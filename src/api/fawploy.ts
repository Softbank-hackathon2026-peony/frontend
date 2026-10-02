const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://fawploy.teampeony.net').replace(/\/$/, '')
const API = `${BASE}/api/v1`

export type Project = { project_id: string; project_token: string; name: string }
export type SourceStatus = 'queued' | 'downloading' | 'ready' | 'failed'
export type GitHubSource = {
  source_id: string
  status: SourceStatus
  repository_url: string
  ref: string
  commit_sha: string
  created_at?: string
  updated_at?: string
  s3_key?: string
  error_message?: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public requestId?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return '공개 저장소나 커밋을 찾지 못했어요. 주소와 브랜치를 확인해 주세요.'
    if (err.status === 502) return 'GitHub 연결에 실패했어요. 잠시 후 다시 시도해 주세요.'
    if (err.status === 503) return 'GitHub 요청 제한 또는 저장소 오류가 있어요. 잠시 후 다시 시도해 주세요.'
    return err.message
  }
  if (err instanceof Error) return err.message
  return '알 수 없는 오류가 발생했어요.'
}

type RequestOptions = { method?: 'GET' | 'POST'; body?: unknown; token?: string; signal?: AbortSignal }

async function request<T>(path: string, { method = 'GET', body, token, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['X-Project-Token'] = token
  const response = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  const json = await response.json().catch(() => null) as { data?: T; detail?: string | { msg: string }[]; request_id?: string } | null
  if (!response.ok) {
    const detail = json?.detail
    const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : `HTTP ${response.status}`
    throw new ApiError(response.status, message, json?.request_id)
  }
  if (!json?.data) throw new Error('서버 응답 형식이 올바르지 않아요.')
  return json.data
}

export async function getStatus(signal?: AbortSignal): Promise<{ status: string }> {
  const response = await fetch(`${BASE}/status`, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export const createProject = (name: string, signal?: AbortSignal) =>
  request<Project>('/projects', { method: 'POST', body: { name }, signal })

export const createGitHubSource = (projectId: string, token: string, githubUrl: string, ref?: string, signal?: AbortSignal) =>
  request<GitHubSource>(`/projects/${encodeURIComponent(projectId)}/sources/github`, {
    method: 'POST', token, body: { github_url: githubUrl, ...(ref ? { ref } : {}) }, signal,
  })

export const getGitHubSource = (projectId: string, token: string, sourceId: string, signal?: AbortSignal) =>
  request<GitHubSource>(`/projects/${encodeURIComponent(projectId)}/sources/${encodeURIComponent(sourceId)}`, { token, signal })
