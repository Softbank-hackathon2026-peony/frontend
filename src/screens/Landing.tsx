import { useState, type FormEvent } from 'react'

export type SourceInput = { githubUrl: string; ref: string; projectName: string }
type Props = { onSubmit: (input: SourceInput) => void; historyCount: number; onOpenHistory: () => void }

export function Landing({ onSubmit, historyCount, onOpenHistory }: Props) {
  const [githubUrl, setGithubUrl] = useState('')
  const [ref, setRef] = useState('')
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    let url: URL
    try { url = new URL(githubUrl.trim()) } catch { setError('GitHub 저장소 주소를 입력해 주세요.'); return }
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.search || url.hash ||
        !/^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(url.pathname)) {
      setError('https://github.com/소유자/저장소 형식의 공개 저장소 주소가 필요해요.')
      return
    }
    const name = projectName.trim() || url.pathname.split('/')[2].replace(/\.git$/, '')
    if (name.length > 80) { setError('프로젝트 이름은 80자 이하로 입력해 주세요.'); return }
    setError('')
    onSubmit({ githubUrl: githubUrl.trim(), ref: ref.trim(), projectName: name })
  }

  return (
    <section className="landing" aria-label="GitHub 저장소 등록">
      <div className="source-card">
        <div className="source-badge">GitHub → 플랫폼 S3</div>
        <h1><mark>공개 GitHub 주소</mark>를<br />알려줘!</h1>
        <p>원하는 브랜치나 커밋을 선택하면 해당 시점의 코드를 보관할게.</p>
        <form className="source-form" onSubmit={submit}>
          <label htmlFor="github-url">공개 저장소 URL</label>
          <input id="github-url" type="url" autoComplete="url" required placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
          <label htmlFor="github-ref">브랜치 · 태그 · 커밋 <span>(선택)</span></label>
          <input id="github-ref" type="text" maxLength={200} placeholder="비우면 기본 브랜치" value={ref} onChange={(e) => setRef(e.target.value)} />
          <label htmlFor="project-name">프로젝트 이름 <span>(선택)</span></label>
          <input id="project-name" type="text" maxLength={80} placeholder="비우면 저장소 이름" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn primary big" type="submit">소스 가져오기</button>
        </form>
        <p className="source-note">현재는 공개 GitHub 저장소만 지원해. 소스 보관만 진행하며 분석·빌드는 아직 시작하지 않아.</p>
      </div>
      {historyCount > 0 && <p className="landing-hint">저장한 소스 {historyCount}개 · <button className="linkbtn" type="button" onClick={onOpenHistory}>히스토리 보기</button></p>}
    </section>
  )
}
