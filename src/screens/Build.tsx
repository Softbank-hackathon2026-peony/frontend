import { useEffect, useState } from 'react'
import { Dog } from '../components/Dog'
import { CheckIcon } from '../components/Icons'
import { BUILD_STEPS } from '../data/analysis'

type Props = { target: string; projectId: string; uploadId: string; onRestart: () => void }

// 배포 API가 아직 없어서 단계 진행은 화면 연출이다. API가 생기면 이 컴포넌트에서 호출한다.
export function Build({ target, projectId, uploadId, onRestart }: Props) {
  const steps = BUILD_STEPS[target] ?? BUILD_STEPS['AWS Lambda']
  const [doing, setDoing] = useState(0)
  const [finished, setFinished] = useState(false)
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    let alive = true
    ;(async () => {
      for (let i = 0; i < steps.length; i++) {
        if (!alive) return
        setDoing(i)
        await new Promise((r) => setTimeout(r, reduced ? 50 : 900 + Math.random() * 500))
      }
      if (alive) { setDoing(steps.length); setFinished(true) }
    })()
    return () => { alive = false }
  }, [steps, reduced])

  return (
    <section className="build" aria-live="polite">
      <Dog pose="eureka" still />
      <h2><em>{target}</em>{finished ? ' 배포 준비 완료!' : '로 만드는 중…'}</h2>
      <ul className="steps">
        {steps.map((s, i) => (
          <li key={s} className={i < doing ? 'done' : i === doing && !finished ? 'doing' : ''}>
            <span className="dot"><CheckIcon /></span>{s}
          </li>
        ))}
      </ul>
      <div className="ids"><span>project: {projectId}</span><span>upload: {uploadId}</span></div>
      {finished && (
        <div className="done-box">
          <p style={{ fontFamily: 'var(--hand)', fontSize: 22, fontWeight: 700, margin: 0 }}>파일은 서버에 안전하게 올라갔어!</p>
          <span className="note">배포 API는 아직 준비 중이라 여기까지는 화면 연출이야. 파일 업로드까지는 진짜로 됐어.</span>
          <button className="btn ghost" type="button" onClick={onRestart}>처음으로</button>
        </div>
      )}
    </section>
  )
}
