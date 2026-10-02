import { useEffect, useState } from 'react'
import { Dog } from '../components/Dog'
import type { Deployment } from '../api/fawploy'

type Props = { deployment: Deployment; label: string; stopping: boolean; error: string | null; onStop: () => void; onRestart: () => void }

const STATUS: Record<string, [string, string]> = {
  running: ['실행 중', 'ok'], unhealthy: ['응답 없음', 'warn'], failed: ['실패', 'bad'], destroyed: ['종료됨', 'off'],
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
      <Dog pose="eureka" still />
      <div className={`stpill ${stClass}`}>{stLabel}</div>
      <h2>{alive ? <>다 됐어! <span className="nowrap"><em>{label}</em>에</span> 올라갔어</> : deployment.status === 'destroyed' ? '배포를 정리했어' : '배포가 실패했어'}</h2>
      {alive && deployment.url && (
        <div className="urlbox">
          <a href={deployment.url} target="_blank" rel="noreferrer">{deployment.url}</a>
          <div className="urlbtns">
            <a className="btn primary small" href={deployment.url} target="_blank" rel="noreferrer">열기</a>
            <button className="btn ghost small" type="button" onClick={copy}>{copied ? '복사됨' : '복사'}</button>
          </div>
        </div>
      )}
      {alive && left && (
        <div className="countdown"><span>남은 시간</span><b>{left}</b><small>1시간 뒤 자동으로 삭제돼</small></div>
      )}
      {deployment.status === 'unhealthy' && <p className="note">앱이 응답하지 않아. 잠시 뒤 다시 확인하거나 지금 종료할 수 있어.</p>}
      {deployment.reason && !alive && <p className="err">{deployment.reason}</p>}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="result-actions">
        {alive && !confirm && <button className="btn ghost" type="button" disabled={stopping} onClick={() => setConfirm(true)}>지금 종료</button>}
        {alive && confirm && (
          <>
            <span className="note">정말 종료할까? 리소스가 바로 삭제돼.</span>
            <button className="btn dark" type="button" disabled={stopping} onClick={onStop}>{stopping ? '종료 중…' : '네, 종료'}</button>
            <button className="btn ghost" type="button" disabled={stopping} onClick={() => setConfirm(false)}>아니</button>
          </>
        )}
        <button className="btn ghost" type="button" onClick={onRestart}>다른 저장소 배포</button>
      </div>
      <div className="ids"><span>deployment: {deployment.deployment_id}</span></div>
    </section>
  )
}
