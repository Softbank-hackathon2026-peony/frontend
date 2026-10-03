// 메인 서버에 분석·배포 API가 생기기 전까지 쓰는 목 구현.
// 실제 API와 같은 시그니처로, 시간 경과에 따라 상태가 바뀐다. 기록은 sessionStorage 에 두어 새로고침에도 이어진다.
import sample from '../data/sample-analysis.json'
import type { Analysis, Decision, DecisionResult, Deployment, Recommendation } from './fawploy'

type MockAnalysis = { id: string; startedAt: number; revision?: string; sourceId: string }
type MockDeployment = { id: string; startedAt: number; target: string; label: string; stopped?: boolean }
type State = { analyses: Record<string, MockAnalysis>; deployments: Record<string, MockDeployment> }

const KEY = 'pawploy.mock.v1'
const load = (): State => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '') as State } catch { return { analyses: {}, deployments: {} } }
}
const save = (s: State) => { try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }
const rid = (prefix: string) => `${prefix}_mock_${Math.random().toString(36).slice(2, 8)}`
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const ANALYZE_MS = 7000
const SAMPLE = (sample as { recommendation: Recommendation }).recommendation

export async function startAnalysis(_projectId: string, _token: string, sourceId: string) {
  await wait(300)
  const s = load(); const id = rid('ana')
  s.analyses[id] = { id, startedAt: Date.now(), sourceId }; save(s)
  return { analysis_id: id, status: 'queued' as const }
}

export async function getAnalysis(_projectId: string, _token: string, analysisId: string): Promise<Analysis> {
  await wait(200)
  const a = load().analyses[analysisId]
  if (!a) return { analysis_id: analysisId, status: 'failed', error_message: 'モックモードの記録がありません。最初からやり直してください。' }
  const t = Date.now() - a.startedAt
  if (t < 1500) return { analysis_id: analysisId, status: 'queued' }
  if (t < ANALYZE_MS) return { analysis_id: analysisId, status: 'running' }
  const rec: Recommendation = JSON.parse(JSON.stringify(SAMPLE))
  if (a.revision) {
    // 수정 요청을 반영한 척: 2순위를 1순위로 올리고 이유에 요청을 남긴다
    const [first, second, ...rest] = rec.candidates
    if (second) {
      rec.candidates = [{ ...second, rank: 1, verdict: 'おすすめ', fit: Math.max(second.fit, 90) }, { ...first, rank: 2, verdict: '適合' }, ...rest]
      rec.target = second.target; rec.label = second.label; rec.cloud = second.cloud
      rec.reason = `修正リクエスト(「${a.revision}」)を反映して ${second.label} に変更しました。` + rec.reason
      rec.cost = second.cost ?? rec.cost
      rec.permissions = second.permissions ?? rec.permissions
    }
  }
  return { analysis_id: analysisId, status: 'ready', recommendation: rec, validation_notes: ['モックモード: agentcore のサンプル応答をそのまま表示しています。'] }
}

export async function decideAnalysis(_projectId: string, _token: string, analysisId: string, decision: Decision): Promise<DecisionResult> {
  await wait(400)
  const s = load(); const a = s.analyses[analysisId]
  if (decision.action === 'revise') {
    const id = rid('ana')
    s.analyses[id] = { id, startedAt: Date.now(), revision: decision.revision_message, sourceId: a?.sourceId ?? '' }; save(s)
    return { analysis_id: id, status: 'queued' }
  }
  const rec = a?.revision ? (await getAnalysis(_projectId, _token, analysisId)).recommendation : SAMPLE
  const cand = rec?.candidates.find((c) => c.target === decision.target)
  const id = rid('dep')
  s.deployments[id] = { id, startedAt: Date.now(), target: decision.target, label: cand?.label ?? decision.target }; save(s)
  return { deployment_id: id, status: 'running' }
}

// 단계별 소요(초): build 4 → fix(1/3) 3 → build 3 → terraform 2 → plan 2 → policy 1 → apply 4 → health 2 → 완료
const TIMELINE: [string, number][] = [['build', 4], ['fix(1/3)', 3], ['build', 3], ['terraform', 2], ['plan', 2], ['policy', 1], ['apply', 4], ['health', 2]]
export async function getDeployment(_projectId: string, _token: string, deploymentId: string): Promise<Deployment> {
  await wait(200)
  const d = load().deployments[deploymentId]
  if (!d) return { deployment_id: deploymentId, status: 'failed', reason: 'モックモードの記録がありません。最初からやり直してください。' }
  if (d.stopped) return { deployment_id: deploymentId, status: 'destroyed', target: d.target, label: d.label }
  let t = (Date.now() - d.startedAt) / 1000
  for (const [step, dur] of TIMELINE) {
    if (t < dur) return { deployment_id: deploymentId, status: 'running', step, target: d.target, label: d.label }
    t -= dur
  }
  const expires = new Date(d.startedAt + 60 * 60 * 1000)
  if (Date.now() > expires.getTime()) return { deployment_id: deploymentId, status: 'destroyed', target: d.target, label: d.label, expires_at: expires.toISOString() }
  return { deployment_id: deploymentId, status: 'running', step: null, url: `https://${deploymentId.replace(/_/g, '-')}.mock.pawploy.dev/`, expires_at: expires.toISOString(), target: d.target, label: d.label }
}

export async function stopDeployment(_projectId: string, _token: string, deploymentId: string): Promise<void> {
  await wait(300)
  const s = load(); const d = s.deployments[deploymentId]
  if (d) { d.stopped = true; save(s) }
}

// ----- ?mock=1 일 때는 프로젝트·소스 등록도 목으로 (백엔드가 꺼져 있어도 데모 가능) -----
import type { GitHubSource, Project } from './fawploy'
type MockSource = { id: string; startedAt: number; url: string; ref: string }
const SKEY = 'pawploy.mock.sources.v1'
const loadS = (): Record<string, MockSource> => { try { return JSON.parse(sessionStorage.getItem(SKEY) || '') } catch { return {} } }
const saveS = (s: Record<string, MockSource>) => { try { sessionStorage.setItem(SKEY, JSON.stringify(s)) } catch { /* ignore */ } }

export async function createProject(name: string): Promise<Project> {
  await wait(300)
  return { project_id: rid('prj'), project_token: rid('tok'), name }
}
export async function createGitHubSource(_projectId: string, _token: string, githubUrl: string, ref?: string): Promise<GitHubSource> {
  await wait(400)
  const s = loadS(); const id = rid('src')
  s[id] = { id, startedAt: Date.now(), url: githubUrl, ref: ref || 'main' }; saveS(s)
  return { source_id: id, status: 'queued', repository_url: githubUrl, ref: ref || 'main', commit_sha: 'mock0000' + Math.random().toString(16).slice(2, 10) }
}
export async function getGitHubSource(_projectId: string, _token: string, sourceId: string): Promise<GitHubSource> {
  await wait(150)
  const m = loadS()[sourceId]
  if (!m) return { source_id: sourceId, status: 'failed', repository_url: '', ref: '', commit_sha: '', error_message: 'モックモードの記録がありません。' }
  const t = Date.now() - m.startedAt
  const status = t < 800 ? 'queued' : t < 2500 ? 'downloading' : 'ready'
  return { source_id: sourceId, status, repository_url: m.url, ref: m.ref, commit_sha: 'mock0000deadbeef', s3_key: status === 'ready' ? `mock/${sourceId}.tar.gz` : undefined }
}
