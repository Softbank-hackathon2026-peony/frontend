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
// '부적합'·'不適合' 안에 '적합'·'適合'이 들어 있어서 나쁜 쪽을 먼저 본다
const verdictClass = (v: string) => (/낭비|불가|부적합|無駄|不可|不適合/.test(v) ? 'v-bad' : /추천|적합|좋음|おすすめ|推奨|適合|最適/.test(v) ? 'v-good' : 'v-warn')
const cloudLabel = (c: string) => (c === 'gcp' ? 'GCP' : c === 'aws' ? 'AWS' : c.toUpperCase())

function CostLine({ cost }: { cost?: Cost }) {
  if (!cost) return null
  const cur = cost.currency ?? 'USD'
  const fmt = (n: number | null | undefined) => (n == null ? null : `${cur === 'USD' ? '$' : ''}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${cur === 'USD' ? '' : ' ' + cur}`)
  const m = fmt(cost.monthly), t = fmt(cost.test_1h)
  if (m == null && t == null) return <div className="cost"><b>想定コスト</b><span className="pending">{cost.note || '単価確認前'}</span></div>
  return (
    <div className="cost">
      <b>想定コスト</b>
      {m != null && <span>月 {m}</span>}
      {t != null && <span>テスト1時間 {t}</span>}
      {cost.assumptions && <small>前提: {Object.entries(cost.assumptions).map(([k, v]) => `${k} ${v}`).join(' · ')}</small>}
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
    <section className="reason" aria-label="選んだ理由">
      <div className="rhead">
        <Dog pose="happy" still className="minidog" />
        <div>
          <div className="eyebrow">分析結果 · <span className="raw">{repositoryUrl.replace(/^https:\/\/github\.com\//, '')}</span>{rec.commit_sha && <> · <code>{rec.commit_sha.slice(0, 7)}</code></>}{rec.model_id && <> · <code>{rec.model_id}</code></>}</div>
          <h2>だから <span className="nowrap"><em>{rec.label}</em>に</span>デプロイすることにしたよ</h2>
          <p>{rec.summary}</p>
        </div>
      </div>

      {!canDeploy && (
        <div className="warnbox" role="alert">
          <b>このプロジェクトはまだ自動デプロイできないんだ。</b>
          <ul>{rec.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      {canDeploy && rec.warnings.length > 0 && (
        <div className="warnbox soft"><b>先に知っておいてほしいこと</b><ul>{rec.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div>
      )}

      <div className="flow">
        <div className="clues">
          {rec.clues.slice(0, 6).map((c, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div className="clue" key={`${c.file}-${c.line}-${i}`} style={{ '--c': COLORS[i % COLORS.length], '--i': i } as React.CSSProperties}>
                <Icon className="ico" />
                <div className="txt">
                  <div className="file">{c.file}{c.line != null && ` · ${c.line}行目`}</div>
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
          <div className="eyebrow">決定 · {cloudLabel(rec.cloud)}{rec.size && ` · ${rec.size}`}</div>
          <h3>{rec.label}</h3>
          <div className="why">{rec.reason}</div>
          {(rec.container_port || rec.health_path) && (
            <div className="deployspec"><b>デプロイ設定</b><span>{rec.container_port ? `ポート ${rec.container_port}` : ''}{rec.container_port && rec.health_path ? ' · ' : ''}{rec.health_path ? `ヘルスチェック ${rec.health_path}` : ''}</span></div>
          )}
          <CostLine cost={rec.cost} />
          {rec.permissions.length > 0 && (
            <div className="perm"><b>デプロイしたアプリに付く権限</b><ul>{rec.permissions.map((p) => <li key={p}>{p}</li>)}</ul></div>
          )}
          {rec.required_secrets.length > 0 && (
            <div className="secrets"><b>この値は自分で入れてね</b><ul>{rec.required_secrets.map((s) => <li key={s}><code>{s}</code></li>)}</ul></div>
          )}
        </div>
      </div>

      {error && <p className="err" role="alert">{error}</p>}

      {!showAlts ? (
        <div className="choice">
          <p className="lead">これでいく?</p>
          <button className="btn primary big" type="button" disabled={busy || !canDeploy} onClick={() => onApprove(rec.target)}>{busy ? '開始中…' : 'いいね!'}</button>
          <button className="btn ghost" type="button" disabled={busy} onClick={() => setShowAlts(true)}>ううん、別のにする</button>
        </div>
      ) : (
        <div className="alts">
          <h4>じゃあ、どこに載せる?</h4>
          <p className="sub">わんこが比べた{candidates.length}つの候補だよ。1つ選ぶか、希望の条件を書いてくれたらもう一度分析するね。</p>
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
                <div className="name"><span className="rank">{a.rank}</span>{a.label} <span className="cloud">{cloudLabel(a.cloud)}</span><span className={`verdict ${verdictClass(a.verdict)}`}>{a.deployable ? a.verdict : '比較用'}</span></div>
                <p>{a.why}</p>
                {a.size_spec && <p className="spec">{a.size_spec}</p>}
                <div className="meter"><span>適合度</span><div className="bar"><i style={{ '--w': `${a.fit}%` } as React.CSSProperties} /></div><span>{a.fit}%</span></div>
                <CostLine cost={a.cost} />
                {!a.deployable && <p className="spec">今はデプロイ不可・比較用に表示してるだけだよ</p>}
              </button>
            ))}
          </div>
          <div className="revise">
            <label htmlFor="revision">または条件を教えて</label>
            <textarea id="revision" rows={2} maxLength={500} placeholder="例: ずっと動いててほしい / GCP にしたい / 月5ドル以内で" value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
          </div>
          <div className="altfoot">
            <button className="btn dark" type="button" disabled={!chosen || busy} onClick={() => chosen && onApprove(chosen.target)}>{chosen ? `${chosen.label}で作る` : 'これで作る'}</button>
            <button className="btn primary" type="button" disabled={!message.trim() || busy} onClick={() => onRevise(message.trim())}>{busy ? '送信中…' : 'この条件で再分析'}</button>
            <button className="btn ghost" type="button" disabled={busy} onClick={onRestart}>最初からやり直す</button>
            <span className="note">{chosen ? (chosen.rank === 1 ? 'わんこのおすすめと同じだ!' : 'わんこのおすすめじゃないけど、きみの選択を尊重するよ') : 'カードを選ぶか、条件を書いてね'}</span>
          </div>
        </div>
      )}
    </section>
  )
}
