import { useRef, useState, type DragEvent } from 'react'
import { ArrowDownIcon, FileIcon } from '../components/Icons'
import { SUPPORTED_EXTENSIONS } from '../api/fawploy'
import { fileExtensionSupported } from '../api/upload'
import type { UploadRecord } from '../api/history'

type Props = {
  history: UploadRecord[]
  onFile: (file: File) => void
  onOpenRecord: (rec: UploadRecord) => void
  onDeleteRecord: (rec: UploadRecord) => void
}

const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`)
const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Landing({ history, onFile, onOpenRecord, onDeleteRecord }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!fileExtensionSupported(file.name)) {
      setError(`${file.name} 은(는) 아직 못 받아. 지원 형식: ${SUPPORTED_EXTENSIONS.join(', ')}`)
      return
    }
    setError(null)
    onFile(file)
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }

  return (
    <section className="landing" aria-label="파일 넣기">
      <div
        className={`drop${over ? ' over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="파일을 드래그해서 놓거나 클릭해서 고르기"
        onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false) }}
        onDrop={onDrop}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
      >
        <svg className="ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" /></svg>
        <div className="inner">
          <ArrowDownIcon className="arrow" />
          <h1><mark>너의 파일을</mark><br />넣어줘!</h1>
          <p>zip이나 소스 파일을 여기에 끌어다 놓아</p>
        </div>
        <input ref={inputRef} type="file" accept={SUPPORTED_EXTENSIONS.join(',')} aria-label="파일 선택" onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="landing-foot">
        <span>드래그가 안 되면</span>
        <button className="linkbtn" type="button" onClick={() => inputRef.current?.click()}>파일 골라서 넣기</button>
      </div>

      {history.length > 0 && (
        <div className="history">
          <h3>최근 올린 파일 <small>이 브라우저에 남아 있어</small></h3>
          <ul>
            {history.map((rec) => (
              <li key={rec.uploadId}>
                <FileIcon />
                <div className="nm">
                  <b>{rec.fileName}</b>
                  <span>{fmtSize(rec.sizeBytes)} · {fmtDate(rec.uploadedAt)} · {rec.projectId}{rec.decision ? ` · ${rec.decision}` : ''}</span>
                </div>
                <button className="open" type="button" onClick={() => onOpenRecord(rec)}>이어 보기</button>
                <button className="del" type="button" aria-label="기록 지우기" onClick={() => onDeleteRecord(rec)}>지우기</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
