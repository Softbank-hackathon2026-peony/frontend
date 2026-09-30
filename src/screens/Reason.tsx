import { useState } from 'react'
import { Dog } from '../components/Dog'
import { ALTERNATIVES, CLUES, DECISION } from '../data/analysis'

type Props = {
  fileName: string
  projectId: string
  onYes: () => void
  onPick: (target: string) => void
  onRestart: () => void
}

export function Reason({ fileName, projectId, onYes, onPick, onRestart }: Props) {
  const [showAlts, setShowAlts] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  return (
    <section className="reason" aria-label="선택 이유">
      <div className="rhead">
        <Dog pose="eureka" still className="minidog" />
        <div>
          <div className="eyebrow">예시 분석 결과 (분석 API 준비 중) · <span className="raw">{fileName}</span> · <code>{projectId}</code></div>
          <h2>그래서 <em>{DECISION.name}</em>로 배포하기로 했어</h2>
          <p>네 코드에서 찾은 단서 4개가 전부 한 방향을 가리켰거든. 아래에서 하나씩 확인해 봐.</p>
        </div>
      </div>

      <div className="flow">
        <div className="clues">
          {CLUES.map((c, i) => (
            <div className="clue" key={c.tag} style={{ '--c': c.color, '--i': i } as React.CSSProperties}>
              <c.Icon className="ico" />
              <div className="txt">
                <div className="file">{c.file}</div>
                <div className="find">{c.find[0]}<mark>{c.find[1]}</mark>{c.find[2]}</div>
                <div className="plain">{c.plain}</div>
              </div>
              <span className="tag">{c.tag}</span>
            </div>
          ))}
        </div>
        <div className="joiner" aria-hidden="true">
          <svg viewBox="0 0 72 120" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18 C 40 18 40 60 66 60" /><path d="M6 46 C 40 46 40 60 66 60" /><path d="M6 74 C 40 74 40 60 66 60" /><path d="M6 102 C 40 102 40 60 66 60" />
            <path d="M56 50 l10 10 -10 10" />
          </svg>
        </div>
        <div className="decide">
          <div className="eyebrow">결정</div>
          <h3>{DECISION.name}</h3>
          <div className="why">{DECISION.why}</div>
          <ul>
            {DECISION.reasons.map(([b, rest]) => <li key={b}><b>{b}</b>{rest}</li>)}
          </ul>
        </div>
      </div>

      {!showAlts ? (
        <div className="choice">
          <p className="lead">이대로 갈까?</p>
          <button className="btn primary big" type="button" onClick={onYes}>좋아!</button>
          <button className="btn ghost" type="button" onClick={() => setShowAlts(true)}>아니 다른거 할래</button>
        </div>
      ) : (
        <div className="alts">
          <h4>그럼 어디에 올릴까?</h4>
          <p className="sub">멍멍이가 비교한 다른 선택지야. 하나 고르면 그걸로 만들어 줄게.</p>
          <div className="altgrid">
            {ALTERNATIVES.map((a) => (
              <button
                key={a.name}
                type="button"
                className={`alt${a.verdict === 'good' ? ' pick' : ''}${chosen === a.name ? ' chosen' : ''}`}
                style={{ '--c': a.color } as React.CSSProperties}
                onClick={() => setChosen(a.name)}
              >
                <div className="name">{a.name} <span className={`verdict v-${a.verdict}`}>{a.verdictLabel}</span></div>
                <p>{a.desc}</p>
                <div className="meter"><span>적합도</span><div className="bar"><i style={{ '--w': `${a.fit}%` } as React.CSSProperties} /></div><span>{a.fit}%</span></div>
              </button>
            ))}
          </div>
          <div className="altfoot">
            <button className="btn dark" type="button" disabled={!chosen} onClick={() => chosen && onPick(chosen)}>{chosen ? `${chosen}로 만들기` : '이걸로 만들기'}</button>
            <button className="btn ghost" type="button" onClick={onRestart}>처음부터 다시 (다른 파일 넣기)</button>
            <span className="note">{chosen ? (chosen === DECISION.name ? '멍멍이 추천이랑 같아!' : '멍멍이 추천은 아니지만 네 선택을 존중할게') : '위에서 하나 골라 줘'}</span>
          </div>
        </div>
      )}
    </section>
  )
}
