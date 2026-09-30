// 새로고침해도 "내가 올린 것"이 화면에 남도록 브라우저에 기록한다.
// 아직 로그인이 없고 프로젝트 목록 API도 없어서, 이 기록이 유일한 복구 수단이다.
// project_token 은 로그인 전까지의 임시 비밀값이라 같은 브라우저에만 저장한다 (서버로 보내는 곳은 X-Project-Token 헤더뿐).
// 로그인이 생기면 이 파일은 서버 조회로 교체한다.

export type UploadRecord = {
  projectId: string
  projectToken: string
  uploadId: string
  projectName: string
  fileName: string
  sizeBytes: number
  uploadedAt: string // ISO
  decision?: string // 사용자가 고른 배포 방식 (좋아! / 다른 거)
}

const KEY = 'pawploy.uploads.v1'
const MAX = 10

function read(): UploadRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as UploadRecord[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list: UploadRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* 사생활 보호 모드 등에서는 저장이 안 될 수 있다. 기능은 그대로 동작한다. */
  }
}

export const loadHistory = read

export function saveRecord(rec: UploadRecord) {
  const rest = read().filter((r) => r.uploadId !== rec.uploadId)
  write([rec, ...rest])
}

export function updateRecord(uploadId: string, patch: Partial<UploadRecord>) {
  write(read().map((r) => (r.uploadId === uploadId ? { ...r, ...patch } : r)))
}

export function removeRecord(uploadId: string) {
  write(read().filter((r) => r.uploadId !== uploadId))
}
