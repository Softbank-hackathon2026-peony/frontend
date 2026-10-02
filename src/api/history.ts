import type { GitHubSource } from './fawploy'

// 목록 API/로그인이 아직 없으므로 이 브라우저에만 기록한다. 토큰은 프로젝트 접근 권한이다.
export type SourceRecord = {
  projectId: string
  projectToken: string
  projectName: string
  source: GitHubSource
  createdAt: string
  analysisId?: string
  deploymentId?: string
  decidedTarget?: string
  decidedLabel?: string
  mock?: boolean // 목 모드에서 만든 기록이면 이어 볼 때도 목으로
}

const KEY = 'pawploy.github-sources.v1'
const MAX = 10

function read(): SourceRecord[] {
  try {
    const value = localStorage.getItem(KEY)
    const items: unknown = value ? JSON.parse(value) : []
    return Array.isArray(items) ? items.filter((item): item is SourceRecord =>
      !!item && typeof item.projectId === 'string' && typeof item.projectToken === 'string' &&
      typeof item.source?.source_id === 'string') : []
  } catch { return [] }
}

function write(items: SourceRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))) } catch { /* private mode */ }
}

export const loadHistory = read
export function saveRecord(record: SourceRecord) {
  write([record, ...read().filter((item) => item.source.source_id !== record.source.source_id)])
}
export function removeRecord(sourceId: string) {
  write(read().filter((item) => item.source.source_id !== sourceId))
}
/** 기록이 어느 단계까지 갔는지 */
export function recordStage(r: SourceRecord): 'source' | 'analysis' | 'deployment' {
  if (r.deploymentId) return 'deployment'
  if (r.analysisId) return 'analysis'
  return 'source'
}
