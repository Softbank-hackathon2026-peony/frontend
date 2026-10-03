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
  if (st === 'deployment') return [`${r.decidedLabel ?? r.decidedTarget ?? ''} デプロイ`, true]
  if (st === 'analysis') return ['分析・根拠を見る', true]
  if (r.source.status === 'ready') return ['ソース保存完了', true]
  if (r.source.status === 'failed') return ['ソース保存失敗', false]
  return ['ソース保存中', false]
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
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="履歴">
        <div className="drawer-head"><h3>履歴 <small>このブラウザに残っている記録</small></h3><button className="btn ghost small" type="button" onClick={onClose}>閉じる</button></div>
        {history.length === 0 ? <p className="drawer-empty">まだ登録したGitHubソースはないよ。</p> : (
          <ul className="history">
            {history.map((record) => {
              const [label, good] = stageLabel(record)
              return (
                <li key={record.source.source_id}>
                  <FileIcon />
                  <div className="nm"><b>{record.projectName}</b><span>{record.source.repository_url.replace(/^https:\/\/github\.com\//, '')}{record.mock ? ' · モック' : ''}</span><em className={good ? 'decided' : ''}>{label}</em></div>
                  <button className="open" type="button" onClick={() => { onOpen(record); onClose() }}>続きを見る</button>
                  <button className="del" type="button" aria-label="記録を消す" onClick={() => onDelete(record)}>消す</button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="note">記録とプロジェクトトークンはこのブラウザにだけ保存されるよ。共有パソコンなら記録を消してね。記録を消してもサーバーのソース・デプロイは削除されないよ。</p>
      </aside>
    </div>
  )
}
