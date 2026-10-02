import { Dog } from '../components/Dog'
import type { SourceRecord } from '../api/history'

type Props = { record: SourceRecord; onRefresh: () => void; refreshing: boolean; error: string | null; onRestart: () => void }

export function SourceResult({ record, onRefresh, refreshing, error, onRestart }: Props) {
  const { source } = record
  return (
    <section className="result" aria-live="polite">
      <Dog pose={source.status === 'ready' ? 'eureka' : 'think'} still />
      <div className="source-badge">{source.status === 'ready' ? 'S3 보관 완료' : source.status === 'failed' ? '소스 보관 실패' : '소스 보관 중'}</div>
      <h2>{source.status === 'ready' ? '소스를 안전하게 보관했어!' : source.status === 'failed' ? '소스를 보관하지 못했어' : '아직 보관 중이야'}</h2>
      <p className="note">현재 백엔드는 소스 보관까지만 지원해. AI 분석과 배포는 아직 진행되지 않았어.</p>
      <dl className="source-details">
        <div><dt>프로젝트</dt><dd>{record.projectName}</dd></div>
        <div><dt>저장소</dt><dd><a href={source.repository_url} target="_blank" rel="noreferrer">{source.repository_url}</a></dd></div>
        <div><dt>선택한 ref</dt><dd>{source.ref}</dd></div>
        <div><dt>고정된 커밋</dt><dd><code>{source.commit_sha}</code></dd></div>
        {source.s3_key && <div><dt>플랫폼 S3 키</dt><dd><code>{source.s3_key}</code></dd></div>}
        <div><dt>작업 ID</dt><dd><code>{source.source_id}</code></dd></div>
      </dl>
      {source.status === 'failed' && <p className="err" role="alert">{source.error_message || '잠시 후 다시 등록해 주세요.'}</p>}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="result-actions">
        <button className="btn ghost" type="button" disabled={refreshing} onClick={onRefresh}>{refreshing ? '확인 중…' : '상태 새로고침'}</button>
        <button className="btn dark" type="button" onClick={onRestart}>다른 저장소 등록</button>
      </div>
    </section>
  )
}
