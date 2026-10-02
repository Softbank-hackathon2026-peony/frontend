import { useEffect } from 'react'
import { FileIcon } from './Icons'
import type { SourceRecord } from '../api/history'

type Props = {
  open: boolean
  history: SourceRecord[]
  onClose: () => void
  onOpen: (record: SourceRecord) => void
  onDelete: (record: SourceRecord) => void
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
            {history.map((record) => <li key={record.source.source_id}>
              <FileIcon />
              <div className="nm"><b>{record.projectName}</b><span>{record.source.repository_url}</span><em className={record.source.status === 'ready' ? 'decided' : ''}>{record.source.status === 'ready' ? 'S3 보관 완료' : record.source.status === 'failed' ? '실패' : '보관 중'}</em></div>
              <button className="open" type="button" onClick={() => { onOpen(record); onClose() }}>열기</button>
              <button className="del" type="button" aria-label="기록 지우기" onClick={() => onDelete(record)}>지우기</button>
            </li>)}
          </ul>
        )}
        <p className="note">기록과 프로젝트 토큰은 이 브라우저에만 저장돼. 공유 컴퓨터라면 기록을 지워줘. 기록 삭제는 서버의 소스를 삭제하지 않아.</p>
      </aside>
    </div>
  )
}
