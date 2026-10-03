// Fawploy 메인 서버 API 클라이언트.
// 구현됨: 상태, 프로젝트 생성, GitHub 소스 등록/조회.
// 분석·배포 API 클라이언트. 분석 완료 상태는 백엔드/AgentCore 응답의 `analyzed`도 허용한다.
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

// ----- 분석 (agentcore live-analyze-response.json 형식) -----
export type Cost = {
  currency?: string
  monthly: number | null
  test_1h: number | null
  note?: string
  assumptions?: Record<string, number | string>
}
export type Clue = { file: string; line: number | null; finding: string; plain: string; tag: string }
export type Candidate = {
  rank: number
  target: string
  cloud: string // aws | gcp
  architecture?: string
  label: string
  deployable: boolean
  fit: number
  verdict: string // 추천 | 적합 | 과함 | 낭비 ...
  why: string
  size_spec?: string
  permissions?: string[]
  cost?: Cost
}
export type Recommendation = {
  cloud: string
  architecture?: string
  target: string
  label: string
  summary: string
  reason: string
  required_secrets: string[]
  permissions: string[]
  cost: Cost
  clues: Clue[]
  candidates: Candidate[]
  supported: boolean
  warnings: string[]
  dockerfile_notes?: string[]
  container_port?: number
  size?: string
  health_path?: string
  model_id?: string
  commit_sha?: string
  created_at?: string
}
export type AnalysisStatus = 'queued' | 'running' | 'analyzing' | 'ready' | 'analyzed' | 'ok' | 'failed'
export type Analysis = {
  analysis_id: string
  status: AnalysisStatus
  recommendation?: Recommendation
  error_message?: string
  validation_notes?: string[]
  build_files?: { dockerfile?: string; buildspec?: string; uri_prefix?: string; attempt?: number }
}
export const isAnalysisReady = (analysis: Analysis) =>
  (analysis.status === 'ready' || analysis.status === 'analyzed' || analysis.status === 'ok') && !!analysis.recommendation
export type Decision = { action: 'approve'; target: string } | { action: 'revise'; revision_message: string }
export type DecisionResult = { deployment_id?: string; analysis_id?: string; status?: string }

// ----- 배포 -----
export const DEPLOY_STEPS = ['build', 'fix', 'terraform', 'plan', 'policy', 'apply', 'health'] as const
export type DeployStep = (typeof DEPLOY_STEPS)[number]
export type DeployStatus = 'running' | 'unhealthy' | 'failed' | 'destroyed'
export type Deployment = {
  deployment_id: string
  status: DeployStatus | string
  step?: string | null // build | fix(2/3) | terraform | plan | policy | apply | health
  fix_attempt?: number
  fix_max?: number
  reason?: string | null
  url?: string | null
  expires_at?: string | null
  target?: string
  label?: string
  updated_at?: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public requestId?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return '指定したプロジェクトや作業が見つかりませんでした。しばらくしてから再度ご確認ください。'
    if (err.status === 409) return '今の状態ではできないリクエストです。しばらくしてから再度お試しください。'
    if (err.status === 502) return '外部サービスまたはデプロイ処理に接続できませんでした。しばらくしてから再度お試しください。'
    if (err.status === 503) return 'サービスが一時的に利用できません。しばらくしてから再度お試しください。'
    return err.message
  }
  if (err instanceof Error) return err.message
  return '不明なエラーが発生しました。'
}

type RequestOptions = { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; token?: string; signal?: AbortSignal }

async function request<T>(path: string, { method = 'GET', body, token, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['X-Project-Token'] = token
  const response = await fetch(`${API}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal })
  if (response.status === 204) return undefined as T
  const json = await response.json().catch(() => null) as { data?: T; detail?: string | { msg: string }[]; request_id?: string } | null
  if (!response.ok) {
    const detail = json?.detail
    const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : `HTTP ${response.status}`
    throw new ApiError(response.status, message, json?.request_id)
  }
  if (!json?.data) throw new Error('サーバーの応答形式が正しくありません。')
  return json.data
}

const p = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`

export async function getStatus(signal?: AbortSignal): Promise<{ status: string }> {
  const response = await fetch(`${BASE}/status`, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export const createProject = (name: string, signal?: AbortSignal) =>
  request<Project>('/projects', { method: 'POST', body: { name }, signal })

export const createGitHubSource = (projectId: string, token: string, githubUrl: string, ref?: string, signal?: AbortSignal) =>
  request<GitHubSource>(`${p(projectId)}/sources/github`, { method: 'POST', token, body: { github_url: githubUrl, ...(ref ? { ref } : {}) }, signal })

export const getGitHubSource = (projectId: string, token: string, sourceId: string, signal?: AbortSignal) =>
  request<GitHubSource>(`${p(projectId)}/sources/${encodeURIComponent(sourceId)}`, { token, signal })

// 1. 분석 시작  POST /projects/{id}/analyses  body { source_id } → { analysis_id, status }
export const startAnalysis = (projectId: string, token: string, sourceId: string, signal?: AbortSignal) =>
  request<{ analysis_id: string; status: AnalysisStatus }>(`${p(projectId)}/analyses`, { method: 'POST', token, body: { source_id: sourceId }, signal })

// 2. 분석 결과 조회  GET /projects/{id}/analyses/{analysis_id}
export const getAnalysis = (projectId: string, token: string, analysisId: string, signal?: AbortSignal) =>
  request<Analysis>(`${p(projectId)}/analyses/${encodeURIComponent(analysisId)}`, { token, signal })

// 3. 승인 또는 수정  POST /projects/{id}/analyses/{analysis_id}/decision
//    approve → { deployment_id, status } / revise → { analysis_id, status }
export const decideAnalysis = (projectId: string, token: string, analysisId: string, decision: Decision, signal?: AbortSignal) =>
  request<DecisionResult>(`${p(projectId)}/analyses/${encodeURIComponent(analysisId)}/decision`, { method: 'POST', token, body: decision, signal })

// 4. 배포 상태 조회  GET /projects/{id}/deployments/{deployment_id}
export const getDeployment = (projectId: string, token: string, deploymentId: string, signal?: AbortSignal) =>
  request<Deployment>(`${p(projectId)}/deployments/${encodeURIComponent(deploymentId)}`, { token, signal })

// 5. 지금 종료  DELETE /projects/{id}/deployments/{deployment_id} → 204
export const stopDeployment = (projectId: string, token: string, deploymentId: string, signal?: AbortSignal) =>
  request<void>(`${p(projectId)}/deployments/${encodeURIComponent(deploymentId)}`, { method: 'DELETE', token, signal })

/** step 문자열("fix(2/3)")을 단계와 시도 횟수로 푼다. */
export function parseStep(d: Deployment): { step: DeployStep | null; attempt?: number; max?: number } {
  const raw = (d.step ?? '').toString().trim()
  if (!raw) return { step: null }
  const m = /^([a-z_]+)(?:\s*\(\s*(\d+)\s*\/\s*(\d+)\s*\))?/i.exec(raw)
  const name = (m?.[1] ?? raw).toLowerCase() as DeployStep
  const step = (DEPLOY_STEPS as readonly string[]).includes(name) ? name : null
  const attempt = d.fix_attempt ?? (m?.[2] ? Number(m[2]) : undefined)
  const max = d.fix_max ?? (m?.[3] ? Number(m[3]) : undefined)
  return { step, attempt, max }
}

/** 배포가 끝나서 접속 가능한 상태인지 */
export const isDeployed = (d: Deployment) => !!d.url && d.status !== 'failed' && d.status !== 'destroyed'
