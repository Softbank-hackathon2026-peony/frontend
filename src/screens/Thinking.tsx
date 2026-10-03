import { useEffect, useRef, useState } from 'react'
import { Dog } from '../components/Dog'
import type { Analysis } from '../api/fawploy'
import { eul } from '../lib/particle'

export type WorkPhase = 'creating' | 'registering' | 'storing' | 'analyzing' | 'error'
type Props = {
  repositoryUrl: string
  phase: WorkPhase
  error: string | null
  analysis: Analysis | null // status ready 가 되면 띠용
  onRetry: () => void
  onCancel: () => void
  onFinished: () => void // 띠용까지 끝났을 때
}

const STATUS: Record<WorkPhase, string> = {
  creating: '프로젝트 만드는 중', registering: 'GitHub 커밋 확인 중', storing: '소스 보관 중', analyzing: '분석 중', error: '실패',
}
// 진행 문구 API 가 없어서 분석 중엔 이 대사를 돌린다
const LINES = [
  '흠… 저장소를 받아왔어. 어떤 프로젝트인지 볼까~',
  '설정 파일이랑 의존성부터 훑어보자…',
  'Dockerfile 이 있나? 포트는 어디서 열지?',
  '항상 켜져 있어야 하는 앱인지, 가끔만 도는 앱인지…',
  '어디에 올리면 돈이 제일 적게 들까…',
  '권한은 뭐가 필요하고, 비밀값은 있는지…',
]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function Thinking({ repositoryUrl, phase, error, analysis, onRetry, onCancel, onFinished }: Props) {
  const [line, setLine] = useState('')
  const [eureka, setEureka] = useState(false)
  const [typing, setTyping] = useState(true)
  const skipRef = useRef(false)
  const finishedRef = useRef(onFinished); finishedRef.current = onFinished
  const label = analysis?.recommendation?.label ?? '거기'
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const ready = analysis?.status === 'ready' && !!analysis.recommendation

  // 고민 대사 (분석 전 단계에선 상태 문구, 분석 중엔 대사 순환)
  useEffect(() => {
    if (ready || error) return
    let alive = true
    const type = async (text: string) => {
      setLine('')
      let acc = ''
      for (const ch of text) {
        if (!alive) return
        if (skipRef.current || reduced) { setLine(text); return }
        acc += ch; setLine(acc)
        await sleep(ch === ' ' ? 20 : 38)
      }
    }
    ;(async () => {
      if (phase !== 'analyzing') { await type(`${STATUS[phase]}… 커밋을 고정하고 안전하게 보관하고 있어!`); return }
      let i = 0
      while (alive) {
        await type(LINES[i % LINES.length]); i += 1
        await sleep(reduced ? 300 : 2200)
      }
    })()
    return () => { alive = false }
  }, [phase, ready, error, reduced])

  // 결과 도착 → 띠용 (콜백은 ref 로 잡아 부모 리렌더에 끊기지 않게)
  useEffect(() => {
    if (!ready || error) return
    let alive = true
    ;(async () => {
      setEureka(true); setLine('')
      await sleep(reduced ? 0 : 650)
      let acc = ''
      for (const ch of `${eul(label)} 써야겠군!!`) { if (!alive) return; acc += ch; setLine(acc); await sleep(reduced ? 0 : 38) }
      setTyping(false)
      await sleep(reduced ? 200 : 1600)
      if (alive) finishedRef.current()
    })()
    return () => { alive = false }
  }, [ready, error, label, reduced])

  return (
    <section className="think" aria-live="polite">
      {!eureka && !error && phase === 'analyzing' && <button className="skip" type="button" onClick={() => { skipRef.current = true }}>대사 건너뛰기</button>}
      <div className={`filechip${error ? ' err' : ''}`}><b>{repositoryUrl}</b><span>{error ? '실패' : STATUS[phase]}</span></div>
      <div className="scene">
        {error ? (
          <div className="bubble error" role="alert">
            앗, 여기서 막혔어. {error}
            <div className="actions">
              <button className="btn dark small" type="button" onClick={onRetry}>다시 시도</button>
              <button className="btn ghost small" type="button" onClick={onCancel}>처음으로</button>
            </div>
          </div>
        ) : (
          <div className={`bubble ${eureka ? 'eureka' : 'thought'}`}>
            <span>{line}</span>
            {typing && <span className="cursor" />}
            {eureka && (
              <svg className="tail" viewBox="0 0 32 20" aria-hidden="true">
                <polygon points="1,0 31,0 16,18" className="tail-fill" /><path d="M1 0 L16 18 L31 0" className="tail-line" />
              </svg>
            )}
          </div>
        )}
        <Dog pose={eureka ? 'eureka' : 'think'} decor />
      </div>
      {!error && !eureka && <button className="btn ghost small" type="button" onClick={onCancel}>처음으로</button>}
      {!error && !eureka && <p className="note">페이지를 닫아도 작업은 계속돼. 히스토리에서 이어 볼 수 있어.</p>}
    </section>
  )
}
