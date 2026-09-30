import { useEffect, useRef, useState } from 'react'
import { Dog } from '../components/Dog'
import { FileIcon } from '../components/Icons'
import { DIALOGUE, FINAL_LINE } from '../data/analysis'
import type { UploadProgress } from '../api/upload'

type Props = {
  file: File
  progress: UploadProgress | null
  uploadDone: boolean
  uploadError: string | null
  onRetry: () => void
  onCancel: () => void
  onFinished: () => void // 띠용까지 다 끝났을 때
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const PHASE_LABEL: Record<UploadProgress['phase'], string> = {
  creating: '프로젝트 만드는 중', presigning: '업로드 준비 중', uploading: '올리는 중', completing: '조각 합치는 중', done: '업로드 완료',
}

export function Thinking({ file, progress, uploadDone, uploadError, onRetry, onCancel, onFinished }: Props) {
  const [line, setLine] = useState('')
  const [eureka, setEureka] = useState(false)
  const [typing, setTyping] = useState(true)
  const [dialogueDone, setDialogueDone] = useState(false)
  const skipRef = useRef(false)
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  // 1) 강아지 대사: 업로드와 별개로 진행
  useEffect(() => {
    let alive = true
    const wait = (ms: number) => sleep(skipRef.current || reduced ? 0 : ms)
    const type = async (text: string) => {
      setLine('')
      let acc = ''
      for (const ch of text) {
        if (!alive) return
        if (skipRef.current || reduced) { setLine(text); return }
        acc += ch; setLine(acc)
        await wait(ch === ' ' ? 20 : 38)
      }
    }
    ;(async () => {
      await wait(700)
      for (const l of DIALOGUE) { if (!alive) return; await type(l); await wait(1100) }
      if (alive) setDialogueDone(true)
    })()
    return () => { alive = false }
  }, [reduced])

  // 2) 대사도 끝나고 업로드도 끝나면 띠용
  useEffect(() => {
    if (!dialogueDone || !uploadDone || eureka) return
    let alive = true
    ;(async () => {
      setEureka(true)
      setLine('')
      await sleep(reduced ? 0 : 650)
      let acc = ''
      for (const ch of FINAL_LINE) { if (!alive) return; acc += ch; setLine(acc); await sleep(reduced ? 0 : 38) }
      setTyping(false)
      await sleep(reduced ? 200 : 1600)
      if (alive) onFinished()
    })()
    return () => { alive = false }
  }, [dialogueDone, uploadDone, eureka, reduced, onFinished])

  const pct = progress && progress.totalBytes ? Math.round((progress.uploadedBytes / progress.totalBytes) * 100) : 0
  const waitingUpload = dialogueDone && !uploadDone && !uploadError

  return (
    <section className="think" aria-live="polite">
      {!eureka && !uploadError && <button className="skip" type="button" onClick={() => { skipRef.current = true }}>건너뛰기</button>}
      <div className={`filechip${uploadError ? ' err' : ''}`}>
        <FileIcon />
        <b>{file.name}</b>
        <span>
          {uploadError ? '업로드 실패' : progress ? (progress.phase === 'uploading' ? `${pct}% · ${progress.partsDone}/${progress.totalParts} 조각` : PHASE_LABEL[progress.phase]) : '준비 중'}
        </span>
        {!uploadError && <i className="bar" style={{ width: `${progress?.phase === 'done' ? 100 : pct}%` }} />}
      </div>
      <div className="scene">
        {uploadError ? (
          <div className="bubble error" role="alert">
            앗, 파일을 서버에 올리지 못했어. {uploadError}
            <div className="actions">
              <button className="btn dark small" type="button" onClick={onRetry}>다시 올리기</button>
              <button className="btn ghost small" type="button" onClick={onCancel}>다른 파일 넣기</button>
            </div>
          </div>
        ) : (
          <div className={`bubble${eureka ? ' eureka' : ''}`}>
            <span>{waitingUpload ? '조각이 다 올라갈 때까지 잠깐만…' : line}</span>
            {typing && <span className="cursor" />}
          </div>
        )}
        <Dog pose={eureka ? 'eureka' : 'think'} decor />
      </div>
    </section>
  )
}
