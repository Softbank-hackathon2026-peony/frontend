import { useCallback, useEffect, useRef, useState } from 'react'
import { PawIcon } from './components/Icons'
import { Landing } from './screens/Landing'
import { Thinking } from './screens/Thinking'
import { Reason } from './screens/Reason'
import { Build } from './screens/Build'
import { describeApiError, getStatus } from './api/fawploy'
import { uploadProject, type UploadProgress, type UploadResult } from './api/upload'
import { loadHistory, removeRecord, saveRecord, updateRecord, type UploadRecord } from './api/history'

type Stage = { name: 'landing' } | { name: 'thinking'; file: File } | { name: 'reason'; rec: UploadRecord } | { name: 'build'; rec: UploadRecord; target: string }

function App() {
  const [stage, setStage] = useState<Stage>({ name: 'landing' })
  const [history, setHistory] = useState<UploadRecord[]>(() => loadHistory())
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [api, setApi] = useState<'checking' | 'ok' | 'down'>('checking')
  const abortRef = useRef<AbortController | null>(null)
  const pendingRef = useRef<UploadRecord | null>(null)

  useEffect(() => {
    getStatus().then((s) => setApi(s.status === 'ok' ? 'ok' : 'down')).catch(() => setApi('down'))
  }, [])

  const startUpload = useCallback((file: File) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setProgress(null); setUploadResult(null); setUploadError(null); pendingRef.current = null
    uploadProject(file, { onProgress: setProgress, signal: ac.signal })
      .then((res) => {
        if (ac.signal.aborted) return
        setUploadResult(res)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setUploadError(describeApiError(err))
      })
  }, [])

  // 업로드 성공 시 기록 저장 (토큰은 uploadProject 안에서만 쓰고 여기서는 기록용으로 한 번 더 받는다)
  useEffect(() => {
    if (!uploadResult || stage.name !== 'thinking') return
    const rec: UploadRecord = {
      projectId: uploadResult.projectId,
      projectToken: uploadResult.projectToken,
      uploadId: uploadResult.uploadId,
      projectName: uploadResult.projectName,
      fileName: stage.file.name,
      sizeBytes: stage.file.size,
      uploadedAt: new Date().toISOString(),
    }
    pendingRef.current = rec
    saveRecord(rec)
    setHistory(loadHistory())
  }, [uploadResult, stage])

  const onFile = (file: File) => { setStage({ name: 'thinking', file }); startUpload(file) }
  const cancelToLanding = () => { abortRef.current?.abort(); setStage({ name: 'landing' }); setHistory(loadHistory()) }
  const onThinkingFinished = useCallback(() => {
    const rec = pendingRef.current
    if (rec) setStage({ name: 'reason', rec })
  }, [])
  const decide = (rec: UploadRecord, target: string) => {
    updateRecord(rec.uploadId, { decision: target })
    setHistory(loadHistory())
    setStage({ name: 'build', rec: { ...rec, decision: target }, target })
  }

  return (
    <main className="app">
      <div className="brand">
        <PawIcon className="paw" />
        Pawploy <small>배포 멍멍이</small>
        <span className={`api ${api}`} title="백엔드 상태"><i />{api === 'ok' ? '서버 연결됨' : api === 'down' ? '서버 응답 없음' : '서버 확인 중'}</span>
      </div>

      {stage.name === 'landing' && (
        <Landing
          history={history}
          onFile={onFile}
          onOpenRecord={(rec) => setStage(rec.decision ? { name: 'build', rec, target: rec.decision } : { name: 'reason', rec })}
          onDeleteRecord={(rec) => { removeRecord(rec.uploadId); setHistory(loadHistory()) }}
        />
      )}
      {stage.name === 'thinking' && (
        <Thinking
          file={stage.file}
          progress={progress}
          uploadDone={!!uploadResult}
          uploadError={uploadError}
          onRetry={() => startUpload(stage.file)}
          onCancel={cancelToLanding}
          onFinished={onThinkingFinished}
        />
      )}
      {stage.name === 'reason' && (
        <Reason
          fileName={stage.rec.fileName}
          projectId={stage.rec.projectId}
          onYes={() => decide(stage.rec, 'AWS Lambda')}
          onPick={(target) => decide(stage.rec, target)}
          onRestart={cancelToLanding}
        />
      )}
      {stage.name === 'build' && <Build target={stage.target} projectId={stage.rec.projectId} uploadId={stage.rec.uploadId} onRestart={cancelToLanding} />}
    </main>
  )
}

export default App
