import { useEffect, useRef, useState } from 'react'
import { PawIcon } from './components/Icons'
import { Landing, type SourceInput } from './screens/Landing'
import { Thinking } from './screens/Thinking'
import { SourceResult } from './screens/SourceResult'
import { HistoryPanel } from './components/HistoryPanel'
import { createGitHubSource, createProject, describeApiError, getGitHubSource, getStatus } from './api/fawploy'
import { loadHistory, removeRecord, saveRecord, type SourceRecord } from './api/history'

type Stage = { name: 'landing' } |
  { name: 'working'; input: SourceInput; phase: 'creating' | 'registering' | 'error'; error: string | null } |
  { name: 'result'; record: SourceRecord }

function App() {
  const [stage, setStage] = useState<Stage>({ name: 'landing' })
  const [history, setHistory] = useState<SourceRecord[]>(loadHistory)
  const [api, setApi] = useState<'checking' | 'ok' | 'down'>('checking')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getStatus(controller.signal).then((result) => setApi(result.status === 'ok' ? 'ok' : 'down')).catch(() => {
      if (!controller.signal.aborted) setApi('down')
    })
    return () => controller.abort()
  }, [])

  const start = async (input: SourceInput) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStage({ name: 'working', input, phase: 'creating', error: null })
    try {
      const project = await createProject(input.projectName, controller.signal)
      if (controller.signal.aborted) return
      setStage({ name: 'working', input, phase: 'registering', error: null })
      const source = await createGitHubSource(project.project_id, project.project_token, input.githubUrl, input.ref || undefined, controller.signal)
      if (controller.signal.aborted) return
      const record: SourceRecord = { projectId: project.project_id, projectToken: project.project_token, projectName: project.name, source, createdAt: new Date().toISOString() }
      saveRecord(record)
      setHistory(loadHistory())
      setStatusError(null)
      setStage({ name: 'result', record })
    } catch (error) {
      if (!controller.signal.aborted) setStage({ name: 'working', input, phase: 'error', error: describeApiError(error) })
    }
  }

  const leave = () => {
    abortRef.current?.abort()
    setRefreshing(false)
    setStatusError(null)
    setStage({ name: 'landing' })
  }

  const refresh = async (record: SourceRecord, signal?: AbortSignal) => {
    setRefreshing(true)
    try {
      const source = await getGitHubSource(record.projectId, record.projectToken, record.source.source_id, signal)
      if (signal?.aborted) return
      const updated = { ...record, source }
      saveRecord(updated)
      setHistory(loadHistory())
      setStage((current) => current.name === 'result' && current.record.source.source_id === source.source_id ? { name: 'result', record: updated } : current)
      setStatusError(null)
    } catch (error) {
      if (!signal?.aborted) setStatusError(describeApiError(error))
    } finally {
      if (!signal?.aborted) setRefreshing(false)
    }
  }

  useEffect(() => {
    if (stage.name !== 'result' || !['queued', 'downloading'].includes(stage.record.source.status)) return
    const controller = new AbortController()
    let inFlight = false
    const timer = window.setInterval(() => {
      if (inFlight) return
      inFlight = true
      void refresh(stage.record, controller.signal).finally(() => { inFlight = false })
    }, 2500)
    return () => { window.clearInterval(timer); controller.abort() }
  }, [stage])

  return (
    <main className="app">
      <div className="brand">
        <PawIcon className="paw" />
        Pawploy <small>배포 멍멍이</small>
        <span className={`api ${api}`} title="백엔드 상태"><i />{api === 'ok' ? '서버 연결됨' : api === 'down' ? '서버 응답 없음' : '서버 확인 중'}</span>
        <button className="histbtn" type="button" onClick={() => setHistoryOpen(true)} aria-haspopup="dialog">히스토리{history.length > 0 && <b>{history.length}</b>}</button>
      </div>
      {stage.name === 'landing' && <Landing onSubmit={(input) => void start(input)} historyCount={history.length} onOpenHistory={() => setHistoryOpen(true)} />}
      {stage.name === 'working' && <Thinking repositoryUrl={stage.input.githubUrl} phase={stage.phase} error={stage.error} onRetry={() => void start(stage.input)} onCancel={leave} />}
      {stage.name === 'result' && <SourceResult record={stage.record} onRefresh={() => void refresh(stage.record)} refreshing={refreshing} error={statusError} onRestart={leave} />}
      <HistoryPanel open={historyOpen} history={history} onClose={() => setHistoryOpen(false)} onOpen={(record) => {
        abortRef.current?.abort(); setStatusError(null); setStage({ name: 'result', record })
      }} onDelete={(record) => { removeRecord(record.source.source_id); setHistory(loadHistory()) }} />
    </main>
  )
}

export default App
