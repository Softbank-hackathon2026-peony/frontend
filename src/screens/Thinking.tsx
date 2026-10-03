import { useEffect, useRef, useState } from 'react'
import { Dog } from '../components/Dog'
import { isAnalysisReady, type Analysis } from '../api/fawploy'

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
  creating: 'プロジェクト作成中', registering: 'GitHubのコミット確認中', storing: 'ソース保存中', analyzing: '分析中', error: '失敗',
}
// 진행 문구 API 가 없어서 분석 중엔 이 대사를 돌린다
const LINES = [
  'ふむ… リポジトリを持ってきたよ。どんなプロジェクトか見てみよう〜',
  '設定ファイルと依存関係からざっと見てみよう…',
  'Dockerfile はあるかな? ポートはどこで開くんだろう?',
  'ずっと動いてるアプリか、たまにしか動かないアプリか…',
  'どこに載せたら一番安く済むかな…',
  '必要な権限は何で、シークレットはあるかな…',
]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function Thinking({ repositoryUrl, phase, error, analysis, onRetry, onCancel, onFinished }: Props) {
  const [line, setLine] = useState('')
  const [eureka, setEureka] = useState(false)
  const [typing, setTyping] = useState(true)
  const skipRef = useRef(false)
  const finishedRef = useRef(onFinished); finishedRef.current = onFinished
  const label = analysis?.recommendation?.label ?? 'そこ'
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const ready = !!analysis && isAnalysisReady(analysis)

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
      if (phase !== 'analyzing') { await type(`${STATUS[phase]}… コミットを固定して安全に保存してるよ!`); return }
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
      for (const ch of `${label}で決まり!!`) { if (!alive) return; acc += ch; setLine(acc); await sleep(reduced ? 0 : 38) }
      setTyping(false)
      await sleep(reduced ? 200 : 1600)
      if (alive) finishedRef.current()
    })()
    return () => { alive = false }
  }, [ready, error, label, reduced])

  return (
    <section className="think" aria-live="polite">
      {!eureka && !error && phase === 'analyzing' && <button className="skip" type="button" onClick={() => { skipRef.current = true }}>セリフをスキップ</button>}
      <div className={`filechip${error ? ' err' : ''}`}><b>{repositoryUrl}</b><span>{error ? '失敗' : STATUS[phase]}</span></div>
      <div className="scene">
        {error ? (
          <div className="bubble error" role="alert">
            あっ、ここで詰まっちゃった。{error}
            <div className="actions">
              <button className="btn dark small" type="button" onClick={onRetry}>もう一度</button>
              <button className="btn ghost small" type="button" onClick={onCancel}>最初から</button>
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
      {!error && !eureka && <button className="btn ghost small" type="button" onClick={onCancel}>最初から</button>}
      {!error && !eureka && <p className="note">ページを閉じても作業は続くよ。履歴から続きを見られるよ。</p>}
    </section>
  )
}
