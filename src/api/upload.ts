// 파일 하나를 프로젝트 생성 → 멀티파트 presign → 파트별 S3 PUT → complete 순서로 올린다.
import { abortUpload, completeUpload, createProject, presignPart, startUpload, SUPPORTED_EXTENSIONS, type CompletedPart } from './fawploy'

export type UploadPhase = 'creating' | 'presigning' | 'uploading' | 'completing' | 'done'
export type UploadProgress = {
  phase: UploadPhase
  uploadedBytes: number
  totalBytes: number
  partsDone: number
  totalParts: number
}
export type UploadResult = { projectId: string; projectToken: string; uploadId: string; projectName: string }

export function fileExtensionSupported(name: string): boolean {
  const lower = name.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** 파일명에서 프로젝트 이름(공백 아닌 1~80자)을 만든다. */
export function projectNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.(tar\.gz|tgz|zip|tar|gz|js|ts|html|css|json)$/i, '').trim()
  const name = base.length ? base.slice(0, 80) : '새 프로젝트'
  return name
}

class PartUploadError extends Error {
  constructor(public status: number) {
    super(`S3 파트 업로드 실패 (HTTP ${status})`)
  }
}

function putPart(url: string, blob: Blob, onBytes: (loaded: number) => void, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => onBytes(e.loaded)
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new PartUploadError(xhr.status))
      const etag = xhr.getResponseHeader('ETag')
      if (!etag) return reject(new Error('S3 응답에서 ETag를 읽을 수 없어요. 버킷 CORS의 ExposeHeaders에 ETag가 필요해요.'))
      onBytes(blob.size)
      resolve(etag)
    }
    xhr.onerror = () => reject(new Error('S3로 파일 조각을 보내다 네트워크 오류가 났어요.'))
    xhr.onabort = () => reject(new DOMException('업로드를 취소했어요.', 'AbortError'))
    signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(blob)
  })
}

export async function uploadProject(
  file: File,
  { onProgress, signal, concurrency = 3 }: { onProgress?: (p: UploadProgress) => void; signal?: AbortSignal; concurrency?: number } = {},
): Promise<UploadResult> {
  const progress: UploadProgress = { phase: 'creating', uploadedBytes: 0, totalBytes: file.size, partsDone: 0, totalParts: 0 }
  const emit = () => onProgress?.({ ...progress })
  emit()

  const project = await createProject(projectNameFromFile(file.name), signal)
  const token = project.project_token // 메모리에서만 사용

  progress.phase = 'presigning'; emit()
  const start = await startUpload(project.project_id, token, file.name, file.size, signal)
  progress.totalParts = start.total_parts
  progress.phase = 'uploading'; emit()

  const loadedByPart = new Map<number, number>()
  const refreshBytes = () => {
    let sum = 0
    for (const v of loadedByPart.values()) sum += v
    progress.uploadedBytes = Math.min(sum, file.size)
    emit()
  }

  const uploadOne = async (partNumber: number): Promise<CompletedPart> => {
    const startByte = (partNumber - 1) * start.part_size
    const blob = file.slice(startByte, Math.min(startByte + start.part_size, file.size))
    for (let attempt = 0; ; attempt++) {
      const { upload_url } = await presignPart(project.project_id, token, start.upload_id, partNumber, signal)
      try {
        const etag = await putPart(upload_url, blob, (loaded) => { loadedByPart.set(partNumber, loaded); refreshBytes() }, signal)
        progress.partsDone += 1; emit()
        return { part_number: partNumber, etag }
      } catch (err) {
        // URL 만료(403) 등은 같은 파트 URL을 다시 발급받아 한 번 더 시도한다.
        const retryable = err instanceof PartUploadError && attempt < 2
        if (!retryable) throw err
        loadedByPart.set(partNumber, 0); refreshBytes()
      }
    }
  }

  const results: CompletedPart[] = []
  try {
    let next = 1
    const workers = Array.from({ length: Math.min(concurrency, start.total_parts) }, async () => {
      while (next <= start.total_parts) {
        const n = next++
        results.push(await uploadOne(n))
      }
    })
    await Promise.all(workers)

    progress.phase = 'completing'; emit()
    results.sort((a, b) => a.part_number - b.part_number)
    await completeUpload(project.project_id, token, start.upload_id, results, signal)
    progress.phase = 'done'; emit()
    return { projectId: project.project_id, projectToken: token, uploadId: start.upload_id, projectName: project.name }
  } catch (err) {
    // 실패하거나 취소되면 진행 중이던 멀티파트 업로드를 정리한다.
    await abortUpload(project.project_id, token, start.upload_id).catch(() => undefined)
    throw err
  }
}
