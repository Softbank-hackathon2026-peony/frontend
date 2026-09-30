import { useEffect } from 'react'
import { FileIcon } from './Icons'
import type { UploadRecord } from '../api/history'

type Props = {
  open: boolean
  history: UploadRecord[]
  onClose: () => void
  onOpen: (rec: UploadRecord) => void
  onDelete: (rec: UploadRecord) => void
}

const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`)
const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function HistoryPanel({ open, history, onClose, onOpen, onDelete }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="drawer-root">
      <div className="drawer-back" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="히스토리">
        <div className="drawer-head">
          <h3>히스토리 <small>이 브라우저에 남은 기록</small></h3>
          <button className="btn ghost small" type="button" onClick={onClose}>닫기</button>
        </div>
        {history.length === 0 ? (
          <p className="drawer-empty">아직 올린 파일이 없어. 파일을 넣으면 여기에 쌓여.</p>
        ) : (
          <ul className="history">
            {history.map((rec) => (
              <li key={rec.uploadId}>
                <FileIcon />
                <div className="nm">
                  <b>{rec.fileName}</b>
                  <span>{fmtSize(rec.sizeBytes)} · {fmtDate(rec.uploadedAt)} · {rec.projectId}</span>
                  <em className={rec.decision ? 'decided' : ''}>{rec.decision ? `${rec.decision}로 결정` : '아직 결정 전'}</em>
                </div>
                <button className="open" type="button" onClick={() => { onOpen(rec); onClose() }}>이어 보기</button>
                <button className="del" type="button" aria-label="기록 지우기" onClick={() => onDelete(rec)}>지우기</button>
              </li>
            ))}
          </ul>
        )}
        <p className="note">서버에는 파일이 그대로 있어. 여기 기록은 이 브라우저에서만 보여.</p>
      </aside>
    </div>
  )
}
