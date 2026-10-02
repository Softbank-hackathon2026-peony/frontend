import { useState, type FormEvent } from 'react'

export type SourceInput = { githubUrl: string; ref: string; projectName: string }
type Props = { onSubmit: (input: SourceInput) => void; historyCount: number; onOpenHistory: () => void }

const LinkIcon = () => (
  <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
)

export function Landing({ onSubmit, historyCount, onOpenHistory }: Props) {
  const [githubUrl, setGithubUrl] = useState('')
  const [ref, setRef] = useState('')
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    let url: URL
    try { url = new URL(githubUrl.trim()) } catch { setError('GitHub 저장소 주소를 입력해 줘.'); return }
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.search || url.hash ||
        !/^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(url.pathname)) {
      setError('https://github.com/소유자/저장소 형식의 공개 저장소 주소가 필요해.')
      return
    }
    const name = projectName.trim() || url.pathname.split('/')[2].replace(/\.git$/, '')
    if (name.length > 80) { setError('프로젝트 이름은 80자 이하로 적어 줘.'); return }
    setError('')
    onSubmit({ githubUrl: githubUrl.trim(), ref: ref.trim(), projectName: name })
  }

  return (
    <section className="landing" aria-label="GitHub 저장소 넣기">
      <form className="drop" onSubmit={submit}>
        <svg className="drop-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" /></svg>
        <div className="inner">
          <LinkIcon />
          <h1><mark>GitHub 주소</mark>를<br />넣어줘!</h1>
          <label className="sr" htmlFor="github-url">공개 저장소 URL</label>
          <input id="github-url" className="url" type="url" autoComplete="url" required placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
          <button className="btn primary" type="submit">멍멍이한테 맡기기</button>
        </div>
      </form>
      {error && <p className="err" role="alert">{error}</p>}
      <details className="landing-opts">
        <summary>브랜치나 이름을 정하고 싶으면 (선택)</summary>
        <div className="opts">
          <label htmlFor="github-ref">브랜치 · 태그 · 커밋<input id="github-ref" type="text" maxLength={200} placeholder="비우면 기본 브랜치" value={ref} onChange={(e) => setRef(e.target.value)} form="" /></label>
          <label htmlFor="project-name">프로젝트 이름<input id="project-name" type="text" maxLength={80} placeholder="비우면 저장소 이름" value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
        </div>
      </details>
      <p className="landing-foot">공개 저장소만 돼. 멍멍이가 코드를 보고 어디에 올릴지 고른 다음, 네가 좋다고 하면 바로 배포해.</p>
      {historyCount > 0 && <p className="landing-hint">전에 넣은 저장소 {historyCount}개가 있어. <button className="linkbtn" type="button" onClick={onOpenHistory}>히스토리에서 이어 보기</button></p>}
    </section>
  )
}
