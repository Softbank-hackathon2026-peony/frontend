// 실제 API와 목을 한 곳에서 고른다.
// - URL 에 ?mock=1 이 있거나 VITE_USE_MOCK=1 이면 처음부터 목.
// - 실제 분석 시작이 404/405 를 돌려주면(아직 미구현) 그 세션은 목으로 넘어간다.
import * as real from './fawploy'
import * as mock from './mock'
import { ApiError, type Decision } from './fawploy'

let useMock = import.meta.env.VITE_USE_MOCK === '1' || new URLSearchParams(window.location.search).get('mock') === '1'
const listeners = new Set<(on: boolean) => void>()
export const isMock = () => useMock
export function setMock(on: boolean) { if (useMock !== on) { useMock = on; listeners.forEach((l) => l(on)) } }
export function onMockChange(l: (on: boolean) => void) { listeners.add(l); return () => { listeners.delete(l) } }

const notImplemented = (e: unknown) => e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 501)

export async function startAnalysis(projectId: string, token: string, sourceId: string, signal?: AbortSignal) {
  if (useMock) return mock.startAnalysis(projectId, token, sourceId)
  try { return await real.startAnalysis(projectId, token, sourceId, signal) } catch (e) {
    if (notImplemented(e)) { setMock(true); return mock.startAnalysis(projectId, token, sourceId) }
    throw e
  }
}
export const getAnalysis = (projectId: string, token: string, analysisId: string, signal?: AbortSignal) =>
  useMock ? mock.getAnalysis(projectId, token, analysisId) : real.getAnalysis(projectId, token, analysisId, signal)
export const decideAnalysis = (projectId: string, token: string, analysisId: string, decision: Decision, signal?: AbortSignal) =>
  useMock ? mock.decideAnalysis(projectId, token, analysisId, decision) : real.decideAnalysis(projectId, token, analysisId, decision, signal)
export const getDeployment = (projectId: string, token: string, deploymentId: string, signal?: AbortSignal) =>
  useMock ? mock.getDeployment(projectId, token, deploymentId) : real.getDeployment(projectId, token, deploymentId, signal)
export const stopDeployment = (projectId: string, token: string, deploymentId: string, signal?: AbortSignal) =>
  useMock ? mock.stopDeployment(projectId, token, deploymentId) : real.stopDeployment(projectId, token, deploymentId, signal)

export const createProject = (name: string, signal?: AbortSignal) =>
  useMock ? mock.createProject(name) : real.createProject(name, signal)
export const createGitHubSource = (projectId: string, token: string, githubUrl: string, ref?: string, signal?: AbortSignal) =>
  useMock ? mock.createGitHubSource(projectId, token, githubUrl, ref) : real.createGitHubSource(projectId, token, githubUrl, ref, signal)
export const getGitHubSource = (projectId: string, token: string, sourceId: string, signal?: AbortSignal) =>
  useMock ? mock.getGitHubSource(projectId, token, sourceId) : real.getGitHubSource(projectId, token, sourceId, signal)
export { getStatus, describeApiError } from './fawploy'
