// Fawploy 백엔드 API 클라이언트 (현재 구현 범위: 프로젝트 생성 + S3 멀티파트 업로드)
// Base URL은 VITE_API_BASE_URL 로 바꿀 수 있다. project_token 은 메모리에만 두고 절대 저장/노출하지 않는다.

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://fawploy.yyoungjin.com').replace(/\/$/, '')
const API = `${BASE}/api/v1`

export const SUPPORTED_EXTENSIONS = ['.zip', '.tar', '.gz', '.tgz', '.js', '.ts', '.html', '.css', '.json'] as const

export type Project = { project_id: string; project_token: string; name: string }
export type UploadStart = { upload_id: string; part_size: number; total_parts: number }
export type PartPresign = { upload_url: string; expires_in: number }
export type UploadComplete = { project_id: string; upload_id: string; status: 'uploaded' }
export type CompletedPart = { part_number: number; etag: string }

export class ApiError extends Error {
  constructor(public status: number, message: string, public requestId?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** HTTP 상태를 사람이 읽을 수 있는 한 줄로 바꾼다 (문서의 대표 오류 표 기준). */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const byStatus: Record<number, string> = {
      400: '파트 번호가 잘못됐어요.',
      404: '프로젝트 토큰이 맞지 않거나 업로드 작업이 없어요.',
      409: '지금 업로드 상태에서는 할 수 없는 요청이에요.',
      413: '파일이 S3 크기 한도를 넘었어요.',
      415: '지원하지 않는 확장자예요.',
      422: '요청값이 맞지 않거나 파트 정보가 실제 파일과 달라요.',
      503: '서버 저장소(S3/DynamoDB) 작업이 실패했어요. 잠시 후 다시 시도해 주세요.',
    }
    return byStatus[err.status] ?? err.message
  }
  if (err instanceof Error) return err.message
  return '알 수 없는 오류가 났어요.'
}

type RequestOptions = { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; token?: string; signal?: AbortSignal }

async function request<T>(path: string, { method = 'GET', body, token, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['X-Project-Token'] = token
  const res = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  if (res.status === 204) return undefined as T
  const json = (await res.json().catch(() => null)) as { data?: T; detail?: string; request_id?: string } | null
  if (!res.ok) throw new ApiError(res.status, json?.detail ?? `HTTP ${res.status}`, json?.request_id)
  return json?.data as T
}

export const getStatus = () => fetch(`${BASE}/status`).then((r) => r.json() as Promise<{ status: string; service: string; timestamp: string }>)

export const createProject = (name: string, signal?: AbortSignal) =>
  request<Project>('/projects', { method: 'POST', body: { name }, signal })

export const startUpload = (projectId: string, token: string, fileName: string, sizeBytes: number, signal?: AbortSignal) =>
  request<UploadStart>(`/projects/${projectId}/uploads/presign`, { method: 'POST', token, body: { file_name: fileName, size_bytes: sizeBytes }, signal })

export const presignPart = (projectId: string, token: string, uploadId: string, partNumber: number, signal?: AbortSignal) =>
  request<PartPresign>(`/projects/${projectId}/uploads/${uploadId}/parts/${partNumber}/presign`, { token, signal })

export const completeUpload = (projectId: string, token: string, uploadId: string, parts: CompletedPart[], signal?: AbortSignal) =>
  request<UploadComplete>(`/projects/${projectId}/uploads/${uploadId}/complete`, { method: 'POST', token, body: { parts }, signal })

export const abortUpload = (projectId: string, token: string, uploadId: string) =>
  request<void>(`/projects/${projectId}/uploads/${uploadId}`, { method: 'DELETE', token })
