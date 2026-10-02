import { useState } from 'react'
import { Dog } from '../components/Dog'
import { BoxIcon, ChipIcon, ClockIcon, CloudIcon } from '../components/Icons'
import type { Analysis, Candidate, Cost } from '../api/fawploy'

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
const verdictClass = (v: string) => (/추천|적합|좋음/.test(v) ? 'v-good' : /낭비|불가|부적합/.test(v) ? 'v-bad' : 'v-warn')
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
  const rec = analysis.recommendation!
  const [showAlts, setShowAlts] = useState(false)
  const [chosen, setChosen] = useState<Candidate | null>(null)
  const [message, setMessage] = useState('')
  const candidates = [...rec.candidates].sort((a, b) => a.rank - b.rank)
  const canDeploy = rec.supported !== false

  return (
    <section className="reason" aria-label="선택 이유">
      <div className="rhead">
        <Dog pose="eureka" still className="minidog" />
        <div>
          <div className="eyebrow">분석 결과 · <span className="raw">{repositoryUrl.replace(/^https:\/\/github\.com\//, '')}</span>{rec.commit_sha && <> · <code>{rec.commit_sha.slice(0, 7)}</code></>}{rec.model_id && <> · <code>{rec.model_id}</code></>}</div>
          <h2>그래서 <span className="nowrap"><em>{rec.label}</em>로</span> 배포하기로 했어</h2>
          <p>{rec.summary}</p>
        </div>
      </div>

      {!canDeploy && (
        <div className="warnbox" role="alert">
          <b>이 프로젝트는 아직 자동 배포가 안 돼.</b>
          <ul>{rec.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      {canDeploy && rec.warnings.length > 0 && (
        <div className="warnbox soft"><b>미리 알아둘 것</b><ul>{rec.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
      )}

      <div className="flow">
        <div className="clues">
          {rec.clues.map((c, i) => {
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

      {!showAlts ? (
        <div className="choice">
          <p className="lead">이대로 갈까?</p>
          <button className="btn primary big" type="button" disabled={busy || !canDeploy} onClick={() => onApprove(rec.target)}>{busy ? '시작하는 중…' : '좋아!'}</button>
          <button className="btn ghost" type="button" disabled={busy} onClick={() => setShowAlts(true)}>아니 다른거 할래</button>
        </div>
      ) : (
        <div className="alts">
          <h4>그럼 어디에 올릴까?</h4>
          <p className="sub">멍멍이가 비교한 {candidates.length}가지야. 하나 고르거나, 원하는 조건을 적어 주면 다시 분석할게.</p>
          <div className="altgrid">
            {candidates.map((a) => (
              <button
                key={a.target}
                type="button"
                className={`alt${a.rank === 1 ? ' pick' : ''}${chosen?.target === a.target ? ' chosen' : ''}${a.deployable ? '' : ' off'}`}
                style={{ '--c': COLORS[(a.rank - 1) % COLORS.length] } as React.CSSProperties}
                disabled={!a.deployable || busy}
                onClick={() => setChosen(a)}
                aria-pressed={chosen?.target === a.target}
              >
                <div className="name"><span className="rank">{a.rank}</span>{a.label} <span className="cloud">{cloudLabel(a.cloud)}</span><span className={`verdict ${verdictClass(a.verdict)}`}>{a.deployable ? a.verdict : '비교용'}</span></div>
                <p>{a.why}</p>
                {a.size_spec && <p className="spec">{a.size_spec}</p>}
                <div className="meter"><span>적합도</span><div className="bar"><i style={{ '--w': `${a.fit}%` } as React.CSSProperties} /></div><span>{a.fit}%</span></div>
                <CostLine cost={a.cost} />
                {!a.deployable && <p className="spec">지금은 배포 불가 · 비교용으로만 보여 줘</p>}
              </button>
            ))}
          </div>
          <div className="revise">
            <label htmlFor="revision">또는 조건을 말해 줘</label>
            <textarea id="revision" rows={2} maxLength={500} placeholder="예: 항상 켜져 있어야 해 / GCP 로 가고 싶어 / 월 5달러 넘기지 마" value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
          </div>
          <div className="altfoot">
            <button className="btn dark" type="button" disabled={!chosen || busy} onClick={() => chosen && onApprove(chosen.target)}>{chosen ? `${chosen.label}로 만들기` : '이걸로 만들기'}</button>
            <button className="btn primary" type="button" disabled={!message.trim() || busy} onClick={() => onRevise(message.trim())}>{busy ? '보내는 중…' : '이 조건으로 다시 분석'}</button>
            <button className="btn ghost" type="button" disabled={busy} onClick={onRestart}>처음부터 다시</button>
            <span className="note">{chosen ? (chosen.rank === 1 ? '멍멍이 추천이랑 같아!' : '멍멍이 추천은 아니지만 네 선택을 존중할게') : '카드를 고르거나 조건을 적어 줘'}</span>
          </div>
        </div>
      )}
    </section>
  )
}
