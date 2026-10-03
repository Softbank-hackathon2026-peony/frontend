import { useEffect, useState } from 'react'
import { Dog } from '../components/Dog'
import type { Deployment } from '../api/fawploy'

type Props = { deployment: Deployment; label: string; stopping: boolean; error: string | null; onStop: () => void; onRestart: () => void }

const STATUS: Record<string, [string, string]> = {
  running: ['実行中', 'ok'], unhealthy: ['応答なし', 'warn'], failed: ['失敗', 'bad'], destroyed: ['終了済み', 'off'],
}
function remain(iso: string | null | undefined, now: number) {
  if (!iso) return null
  const ms = new Date(iso).getTime() - now
  if (Number.isNaN(ms)) return null
  if (ms <= 0) return '00:00'
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return (h ? `${h}:` : '') + `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function Deployed({ deployment, label, stopping, error, onStop, onRestart }: Props) {
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const [stLabel, stClass] = STATUS[deployment.status] ?? [deployment.status, 'warn']
  const alive = deployment.status !== 'destroyed' && deployment.status !== 'failed'
  const left = remain(deployment.expires_at, now)

  const copy = async () => {
    if (!deployment.url) return
    try { await navigator.clipboard.writeText(deployment.url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* 선택해서 복사하도록 둔다 */ }
  }

  return (
    <section className="deployed" aria-live="polite">
      <Dog pose={alive ? "happy" : "think"} still />
      <div className={`stpill ${stClass}`}>{stLabel}</div>
      <h2>{alive ? <>できた! <span className="nowrap"><em>{label}</em>に</span>載ったよ</> : deployment.status === 'destroyed' ? 'デプロイを片付けたよ' : 'デプロイに失敗しちゃった'}</h2>
      {alive && deployment.url && (
        <div className="urlbox">
          <a href={deployment.url} target="_blank" rel="noreferrer">{deployment.url}</a>
          <div className="urlbtns">
            <a className="btn primary small" href={deployment.url} target="_blank" rel="noreferrer">開く</a>
            <button className="btn ghost small" type="button" onClick={copy}>{copied ? 'コピーした' : 'コピー'}</button>
          </div>
        </div>
      )}
      {alive && left && (
        <div className="countdown"><span>残り時間</span><b>{left}</b><small>1時間後に自動で削除されるよ</small></div>
      )}
      {deployment.status === 'unhealthy' && <p className="note">アプリが応答しないよ。少し待ってから確認するか、今すぐ終了できるよ。</p>}
      {deployment.reason && !alive && <p className="err">{deployment.reason}</p>}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="result-actions">
        {alive && !confirm && <button className="btn ghost" type="button" disabled={stopping} onClick={() => setConfirm(true)}>今すぐ終了</button>}
        {alive && confirm && (
          <>
            <span className="note">本当に終了する? リソースはすぐ削除されるよ。</span>
            <button className="btn dark" type="button" disabled={stopping} onClick={onStop}>{stopping ? '終了中…' : 'うん、終了'}</button>
            <button className="btn ghost" type="button" disabled={stopping} onClick={() => setConfirm(false)}>やめとく</button>
          </>
        )}
        <button className="btn ghost" type="button" onClick={onRestart}>別のリポジトリをデプロイ</button>
      </div>
      <div className="ids"><span>deployment: {deployment.deployment_id}</span></div>
    </section>
  )
}
