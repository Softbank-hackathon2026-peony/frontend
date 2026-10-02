import { useState } from 'react'
import { Dog } from '../components/Dog'
import { BoxIcon, ChipIcon, ClockIcon, CloudIcon } from '../components/Icons'
import type { Analysis, Cost } from '../api/fawploy'

type Props = {
  analysis: Analysis
  repositoryUrl: string
  busy: boolean
  error: string | null
  onApprove: (target: string) => void
  onRevise: (message: string) => void
  onRestart: () => void
}

const ICONS = [CloudIcon, ClockIcon, ChipIcon, BoxIcon]
const COLORS = ['var(--blue)', 'var(--orange)', 'var(--purple)', 'var(--green)', 'var(--pink)']
const cloudLabel = (c: string) => (c === 'gcp' ? 'GCP' : c === 'aws' ? 'AWS' : c.toUpperCase())

function CostLine({ cost }: { cost?: Cost }) {
  if (!cost) return null
  const cur = cost.currency ?? 'USD'
  const fmt = (n: number | null | undefined) => (n == null ? null : `${cur === 'USD' ? '$' : ''}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${cur === 'USD' ? '' : ' ' + cur}`)
  const m = fmt(cost.monthly), t = fmt(cost.test_1h)
  if (m == null && t == null) return <div className="cost"><b>예상 비용</b><span className="pending">{cost.note || '단가 확인 전'}</span></div>
  return (
    <div className="cost">
      <b>예상 비용</b>
      {m != null && <span>월 {m}</span>}
      {t != null && <span>테스트 1시간 {t}</span>}
      {cost.assumptions && <small>가정: {Object.entries(cost.assumptions).map(([k, v]) => `${k} ${v}`).join(' · ')}</small>}
    </div>
  )
}

export function Reason({ analysis, repositoryUrl, busy, error, onApprove, onRevise, onRestart }: Props) {
  const [message, setMessage] = useState('')
  const rec = analysis.recommendation!
  const canDeploy = rec.supported !== false
  const clues = rec.clues.slice(0, 3)
  const warnings = rec.warnings.slice(0, 3)

  return (
    <section className="reason" aria-label="선택 이유">
      <div className="rhead">
        <Dog pose="eureka" still className="minidog" />
        <div>
          <div className="eyebrow">분석 결과 · <span className="raw">{repositoryUrl.replace(/^https:\/\/github\.com\//, '')}</span>{rec.commit_sha && <> · <code>{rec.commit_sha.slice(0, 7)}</code></>}{rec.model_id && <> · <code>{rec.model_id}</code></>}</div>
          <h2>그래서 <em>{rec.label}</em>로 배포하기로 했어</h2>
          <p>{rec.summary}</p>
        </div>
      </div>

      {!canDeploy && (
        <div className="warnbox" role="alert">
          <b>이 프로젝트는 아직 자동 배포가 안 돼.</b>
          <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      {canDeploy && rec.warnings.length > 0 && (
        <div className="warnbox soft"><b>미리 알아둘 것</b><ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
      )}

      <div className="flow">
        <div className="clues">
          {clues.map((c, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div className="clue" key={`${c.file}-${c.line}-${i}`} style={{ '--c': COLORS[i % COLORS.length], '--i': i } as React.CSSProperties}>
                <Icon className="ico" />
                <div className="txt">
                  <div className="file">{c.file}{c.line != null && ` · ${c.line}번째 줄`}</div>
                  <div className="find"><mark>{c.finding}</mark></div>
                  <div className="plain">{c.plain}</div>
                </div>
                <span className="tag">{c.tag}</span>
              </div>
            )
          })}
        </div>
        <div className="joiner" aria-hidden="true">
          <svg viewBox="0 0 72 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18 C 40 18 40 60 66 60" /><path d="M6 46 C 40 46 40 60 66 60" /><path d="M6 74 C 40 74 40 60 66 60" /><path d="M6 102 C 40 102 40 60 66 60" />
            <path d="M56 50 l10 10 -10 10" />
          </svg>
        </div>
        <div className="decide">
          <div className="eyebrow">결정 · {cloudLabel(rec.cloud)}{rec.size && ` · ${rec.size}`}</div>
          <h3>{rec.label}</h3>
          <div className="why">{rec.reason}</div>
          {(rec.container_port || rec.health_path) && (
            <div className="deployspec"><b>배포 설정</b><span>{rec.container_port ? `포트 ${rec.container_port}` : ''}{rec.container_port && rec.health_path ? ' · ' : ''}{rec.health_path ? `헬스체크 ${rec.health_path}` : ''}</span></div>
          )}
          <CostLine cost={rec.cost} />
          {rec.permissions.length > 0 && (
            <div className="perm"><b>배포된 앱이 받는 권한</b><ul>{rec.permissions.map((p) => <li key={p}>{p}</li>)}</ul></div>
          )}
          {rec.required_secrets.length > 0 && (
            <div className="secrets"><b>이 값은 직접 넣어야 해요</b><ul>{rec.required_secrets.map((s) => <li key={s}><code>{s}</code></li>)}</ul></div>
          )}
        </div>
      </div>

      {error && <p className="err" role="alert">{error}</p>}

      <div className="choice">
        <div className="revise">
          <label htmlFor="revision">원하는 방향이 있으면 말해줘</label>
          <textarea id="revision" rows={2} maxLength={2000} placeholder="예: 항상 켜져 있어야 하고 월 비용은 10달러 이하로 해줘" value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
          <button className="btn ghost" type="button" disabled={!message.trim() || busy} onClick={() => { onRevise(message.trim()); setMessage('') }}>{busy ? '다시 분석하는 중…' : '이 조건으로 다시 분석'}</button>
        </div>
        <p className="lead">이 추천으로 배포할까?</p>
        <button className="btn primary big" type="button" disabled={busy || !canDeploy} onClick={() => onApprove(rec.target)}>{busy ? '시작하는 중…' : `${rec.label}로 배포하기`}</button>
        <button className="btn ghost" type="button" disabled={busy} onClick={onRestart}>처음부터 다시</button>
      </div>
    </section>
  )
}
