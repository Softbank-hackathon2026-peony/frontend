import { useCallback, useEffect, useRef, useState } from 'react'
import { PawIcon } from './components/Icons'
import { Landing, type SourceInput } from './screens/Landing'
import { Thinking, type WorkPhase } from './screens/Thinking'
import { Reason } from './screens/Reason'
import { Build } from './screens/Build'
import { Deployed } from './screens/Deployed'
import { HistoryPanel } from './components/HistoryPanel'
import * as api from './api'
import { isAnalysisReady, isDeployed, type Analysis, type Deployment } from './api/fawploy'
import { loadHistory, removeRecord, saveRecord, type SourceRecord } from './api/history'

// 화면 흐름: landing → working(소스 보관 → 분석) → reason(근거·선택) → deploying(단계) → deployed(URL·카운트다운)
type Stage =
  | { name: 'landing' }
  | { name: 'working'; input: SourceInput; phase: WorkPhase; error: string | null; record: SourceRecord | null; analysis: Analysis | null }
  | { name: 'reason'; record: SourceRecord; analysis: Analysis; busy: boolean; error: string | null }
  | { name: 'deploying'; record: SourceRecord; deployment: Deployment | null; error: string | null }
  | { name: 'deployed'; record: SourceRecord; deployment: Deployment; stopping: boolean; error: string | null }

const POLL = { source: 2500, analysis: 3000, deploy: 5000, deployed: 10000 }
const LIMIT = { analysis: 10 * 60 * 1000, deploy: 30 * 60 * 1000 }
const inputOf = (r: SourceRecord): SourceInput => ({ githubUrl: r.source.repository_url, ref: r.source.ref, projectName: r.projectName })

function App() {
  const [stage, setStage] = useState<Stage>({ name: 'landing' })
  const [history, setHistory] = useState<SourceRecord[]>(loadHistory)
  const [apiState, setApiState] = useState<'checking' | 'ok' | 'down'>('checking')
  const [mock, setMock] = useState(api.isMock())
  const [historyOpen, setHistoryOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => api.onMockChange(setMock), [])
  useEffect(() => {
    const c = new AbortController()
    api.getStatus(c.signal).then((r) => setApiState(r.status === 'ok' ? 'ok' : 'down')).catch(() => { if (!c.signal.aborted) setApiState('down') })
    return () => c.abort()
  }, [])

  const remember = (record: SourceRecord) => { saveRecord(record); setHistory(loadHistory()); return record }
  const fresh = () => { abortRef.current?.abort(); const c = new AbortController(); abortRef.current = c; return c }

  // ----- 1. 소스 등록 -----
  const start = async (input: SourceInput) => {
    const c = fresh()
    setStage({ name: 'working', input, phase: 'creating', error: null, record: null, analysis: null })
    try {
      const project = await api.createProject(input.projectName, c.signal)
      if (c.signal.aborted) return
      setStage({ name: 'working', input, phase: 'registering', error: null, record: null, analysis: null })
      const source = await api.createGitHubSource(project.project_id, project.project_token, input.githubUrl, input.ref || undefined, c.signal)
      if (c.signal.aborted) return
      const record = remember({ projectId: project.project_id, projectToken: project.project_token, projectName: project.name, source, createdAt: new Date().toISOString(), mock: api.isMock() })
      setStage({ name: 'working', input, phase: 'storing', error: null, record, analysis: null })
    } catch (e) {
      if (!c.signal.aborted) setStage({ name: 'working', input, phase: 'error', error: api.describeApiError(e), record: null, analysis: null })
    }
  }

  // ----- 2. 분석 시작 -----
  const beginAnalysis = useCallback(async (record: SourceRecord) => {
    const c = fresh()
    try {
      const { analysis_id } = await api.startAnalysis(record.projectId, record.projectToken, record.source.source_id, c.signal)
      if (c.signal.aborted) return
      const updated = remember({ ...record, analysisId: analysis_id, mock: api.isMock() })
      setStage({ name: 'working', input: inputOf(updated), phase: 'analyzing', error: null, record: updated, analysis: null })
    } catch (e) {
      if (!c.signal.aborted) setStage({ name: 'working', input: inputOf(record), phase: 'error', error: api.describeApiError(e), record, analysis: null })
    }
  }, [])

  // ----- 3. 승인 / 수정 -----
  const decide = async (record: SourceRecord, analysis: Analysis, decision: Parameters<typeof api.decideAnalysis>[3]) => {
    const c = fresh()
    setStage({ name: 'reason', record, analysis, busy: true, error: null })
    try {
      const res = await api.decideAnalysis(record.projectId, record.projectToken, analysis.analysis_id, decision, c.signal)
      if (c.signal.aborted) return
      if (decision.action === 'approve') {
        if (!res.deployment_id) throw new Error('承認レスポンスに deployment_id がありません。バックエンドの応答を確認してください。')
        const cand = analysis.recommendation?.candidates.find((x) => x.target === decision.target)
        const updated = remember({ ...record, deploymentId: res.deployment_id, decidedTarget: decision.target, decidedLabel: cand?.label ?? analysis.recommendation?.label })
        setStage({ name: 'deploying', record: updated, deployment: null, error: null })
      } else {
        if (!res.analysis_id) throw new Error('修正レスポンスに analysis_id がありません。バックエンドの応答を確認してください。')
        const updated = remember({ ...record, analysisId: res.analysis_id })
        setStage({ name: 'working', input: inputOf(updated), phase: 'analyzing', error: null, record: updated, analysis: null })
      }
    } catch (e) {
      if (!c.signal.aborted) setStage({ name: 'reason', record, analysis, busy: false, error: api.describeApiError(e) })
    }
  }

  // ----- 5. 지금 종료 -----
  const stop = async (record: SourceRecord, deployment: Deployment) => {
    const c = fresh()
    setStage({ name: 'deployed', record, deployment, stopping: true, error: null })
    try {
      await api.stopDeployment(record.projectId, record.projectToken, deployment.deployment_id, c.signal)
      if (c.signal.aborted) return
      setStage({ name: 'deployed', record, deployment: { ...deployment, status: 'destroyed' }, stopping: false, error: null })
    } catch (e) {
      if (!c.signal.aborted) setStage({ name: 'deployed', record, deployment, stopping: false, error: api.describeApiError(e) })
    }
  }

  const leave = () => { abortRef.current?.abort(); setStage({ name: 'landing' }) }

  // 히스토리에서 이어 보기: 기록이 어디까지 갔는지에 따라 알맞은 단계로
  const resume = (record: SourceRecord) => {
    abortRef.current?.abort()
    api.setMock(!!record.mock)
    if (record.deploymentId) setStage({ name: 'deploying', record, deployment: null, error: null })
    else if (record.analysisId) setStage({ name: 'working', input: inputOf(record), phase: 'analyzing', error: null, record, analysis: null })
    else setStage({ name: 'working', input: inputOf(record), phase: 'storing', error: null, record, analysis: null })
  }

  // ----- 폴링 -----
  useEffect(() => {
    const c = new AbortController()
    let timer: number | undefined
    const startedAt = Date.now()
    const loop = async (fn: () => Promise<boolean>, every: number, limit?: number) => {
      const tick = async () => {
        if (c.signal.aborted) return
        if (limit && Date.now() - startedAt > limit) { setStage((s) => timeoutStage(s)); return }
        if (document.hidden) { timer = window.setTimeout(tick, every); return }
        let done = false
        try { done = await fn() } catch (e) { if (!c.signal.aborted) setStage((s) => errorStage(s, api.describeApiError(e))); return }
        if (!done && !c.signal.aborted) timer = window.setTimeout(tick, every)
      }
      void tick()
    }

    if (stage.name === 'working' && stage.phase === 'storing' && stage.record) {
      const rec = stage.record
      loop(async () => {
        const source = await api.getGitHubSource(rec.projectId, rec.projectToken, rec.source.source_id, c.signal)
        if (c.signal.aborted) return true
        const updated = remember({ ...rec, source })
        if (source.status === 'ready') { void beginAnalysis(updated); return true }
        if (source.status === 'failed') { setStage({ name: 'working', input: stage.input, phase: 'error', error: source.error_message || 'ソースを保存できませんでした。', record: updated, analysis: null }); return true }
        return false
      }, POLL.source)
    }
    if (stage.name === 'working' && stage.phase === 'analyzing' && stage.record?.analysisId && !stage.analysis) {
      const rec = stage.record, id = rec.analysisId as string
      loop(async () => {
        const analysis = await api.getAnalysis(rec.projectId, rec.projectToken, id, c.signal)
        if (c.signal.aborted) return true
        if (isAnalysisReady(analysis)) { setStage({ name: 'working', input: stage.input, phase: 'analyzing', error: null, record: rec, analysis }); return true }
        if (analysis.status === 'failed') { setStage({ name: 'working', input: stage.input, phase: 'error', error: analysis.error_message || '分析に失敗しました。', record: rec, analysis: null }); return true }
        return false
      }, POLL.analysis, LIMIT.analysis)
    }
    if (stage.name === 'deploying' && stage.record.deploymentId) {
      const rec = stage.record, id = rec.deploymentId as string
      loop(async () => {
        const d = await api.getDeployment(rec.projectId, rec.projectToken, id, c.signal)
        if (c.signal.aborted) return true
        if (isDeployed(d)) { setStage({ name: 'deployed', record: rec, deployment: d, stopping: false, error: null }); return true }
        setStage({ name: 'deploying', record: rec, deployment: d, error: null })
        return d.status === 'failed' || d.status === 'destroyed'
      }, POLL.deploy, LIMIT.deploy)
    }
    // URL이 발급된 순간 실제 서비스가 접속 가능한 배포 완료 상태다.
    // 백엔드가 최종 상태 반영 전에 status=deploying을 잠시 유지할 수 있으므로
    // status만 보고 계속 polling하지 않는다.
    if (stage.name === 'deployed' && !isDeployed(stage.deployment) && stage.deployment.status !== 'destroyed' && stage.deployment.status !== 'failed' && !stage.stopping) {
      const rec = stage.record, id = stage.deployment.deployment_id
      loop(async () => {
        const d = await api.getDeployment(rec.projectId, rec.projectToken, id, c.signal)
        if (c.signal.aborted) return true
        if (isDeployed(d)) {
          setStage((s) => (s.name === 'deployed' && !s.stopping ? { ...s, deployment: d } : s))
          return true
        }
        setStage((s) => (s.name === 'deployed' && !s.stopping ? { ...s, deployment: d } : s))
        return d.status === 'destroyed' || d.status === 'failed'
      }, POLL.deployed)
    }
    return () => { c.abort(); if (timer) window.clearTimeout(timer) }
    // stage 객체가 바뀔 때마다 재평가하되, 같은 폴링을 중복 시작하지 않도록 키가 되는 값만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.name, stage.name === 'working' ? `${stage.phase}:${stage.record?.source.source_id}:${stage.record?.analysisId}:${stage.analysis ? 1 : 0}` : '', stage.name === 'deploying' ? stage.record.deploymentId : '', stage.name === 'deployed' ? `${stage.deployment.deployment_id}:${stage.deployment.status}:${stage.stopping ? 1 : 0}` : ''])

  const current = stage
  const labelOf = (r: SourceRecord, d?: Deployment | null) => d?.label || r.decidedLabel || r.decidedTarget || 'そこ'

  return (
    <main className="app">
      <div className="brand">
        <PawIcon className="paw" />
        Pawploy <small>デプロイわんこ</small>
        {mock && <span className="mockbadge" title="分析・デプロイ API がまだないため、サンプル応答で動作中">モックモード</span>}
        <span className={`api ${apiState}`} title="バックエンドの状態"><i />{apiState === 'ok' ? 'サーバー接続OK' : apiState === 'down' ? 'サーバー応答なし' : 'サーバー確認中'}</span>
        <button className="histbtn" type="button" onClick={() => setHistoryOpen(true)} aria-haspopup="dialog">履歴{history.length > 0 && <b>{history.length}</b>}</button>
      </div>

      {current.name === 'landing' && <Landing onSubmit={(input) => void start(input)} historyCount={history.length} onOpenHistory={() => setHistoryOpen(true)} />}
      {current.name === 'working' && (
        <Thinking
          key={current.record?.analysisId ?? current.record?.source.source_id ?? 'new'}
          repositoryUrl={current.input.githubUrl}
          phase={current.phase}
          error={current.error}
          analysis={current.analysis}
          onRetry={() => (current.record?.source.status === 'ready' ? void beginAnalysis(current.record) : current.record ? resume(current.record) : void start(current.input))}
          onCancel={leave}
          onFinished={() => { if (current.record && current.analysis) setStage({ name: 'reason', record: current.record, analysis: current.analysis, busy: false, error: null }) }}
        />
      )}
      {current.name === 'reason' && (
        <Reason
          analysis={current.analysis}
          repositoryUrl={current.record.source.repository_url}
          busy={current.busy}
          error={current.error}
          onApprove={(target) => void decide(current.record, current.analysis, { action: 'approve', target })}
          onRevise={(revision_message) => void decide(current.record, current.analysis, { action: 'revise', revision_message })}
          onRestart={leave}
        />
      )}
      {current.name === 'deploying' && <Build deployment={current.deployment} label={labelOf(current.record, current.deployment)} error={current.error} onRestart={leave} />}
      {current.name === 'deployed' && (
        <Deployed deployment={current.deployment} label={labelOf(current.record, current.deployment)} stopping={current.stopping} error={current.error} onStop={() => void stop(current.record, current.deployment)} onRestart={leave} />
      )}

      <HistoryPanel open={historyOpen} history={history} onClose={() => setHistoryOpen(false)}
        onOpen={(record) => resume(record)}
        onDelete={(record) => { removeRecord(record.source.source_id); setHistory(loadHistory()) }} />
    </main>
  )
}

function errorStage(s: Stage, message: string): Stage {
  if (s.name === 'working') return { ...s, phase: 'error', error: message }
  if (s.name === 'deploying') return { ...s, error: message }
  if (s.name === 'deployed') return { ...s, error: message }
  return s
}
function timeoutStage(s: Stage): Stage {
  if (s.name === 'working') return { ...s, phase: 'error', error: '時間がかかりすぎています。履歴からもう一度開いて確認してください。' }
  if (s.name === 'deploying') return { ...s, error: 'デプロイに時間がかかりすぎています。履歴からもう一度開いて確認してください。' }
  return s
}

export default App
