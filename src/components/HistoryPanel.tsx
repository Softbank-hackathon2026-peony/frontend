import { useEffect } from 'react'
import { FileIcon } from './Icons'
import { recordStage, type SourceRecord } from '../api/history'

type Props = {
  open: boolean
  history: SourceRecord[]
  onClose: () => void
  onOpen: (record: SourceRecord) => void
  onDelete: (record: SourceRecord) => void
}

function stageLabel(r: SourceRecord): [string, boolean] {
  const st = recordStage(r)
  if (st === 'deployment') return [`${r.decidedLabel ?? r.decidedTarget ?? ''} 배포`, true]
  if (st === 'analysis') return ['분석 · 근거 보기', true]
  if (r.source.status === 'ready') return ['소스 보관 완료', true]
  if (r.source.status === 'failed') return ['소스 보관 실패', false]
  return ['소스 보관 중', false]
}

export function HistoryPanel({ open, history, onClose, onOpen, onDelete }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-root">
      <div className="drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="히스토리">
        <div className="drawer-head"><h3>히스토리 <small>이 브라우저에 남은 기록</small></h3><button className="btn ghost small" type="button" onClick={onClose}>닫기</button></div>
        {history.length === 0 ? <p className="drawer-empty">아직 등록한 GitHub 소스가 없어.</p> : (
          <ul className="history">
            {history.map((record) => {
              const [label, good] = stageLabel(record)
              return (
                <li key={record.source.source_id}>
                  <FileIcon />
                  <div className="nm"><b>{record.projectName}</b><span>{record.source.repository_url.replace(/^https:\/\/github\.com\//, '')}{record.mock ? ' · 목' : ''}</span><em className={good ? 'decided' : ''}>{label}</em></div>
                  <button className="open" type="button" onClick={() => { onOpen(record); onClose() }}>이어 보기</button>
                  <button className="del" type="button" aria-label="기록 지우기" onClick={() => onDelete(record)}>지우기</button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="note">기록과 프로젝트 토큰은 이 브라우저에만 저장돼. 공유 컴퓨터라면 기록을 지워줘. 기록 삭제는 서버의 소스·배포를 지우지 않아.</p>
      </aside>
    </div>
  )
}
