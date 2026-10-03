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
    try { url = new URL(githubUrl.trim()) } catch { setError('GitHubリポジトリのURLを入れてね。'); return }
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.search || url.hash ||
        !/^\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(url.pathname)) {
      setError('https://github.com/オーナー/リポジトリ 形式の公開リポジトリURLが必要だよ。')
      return
    }
    const name = projectName.trim() || url.pathname.split('/')[2].replace(/\.git$/, '')
    if (name.length > 80) { setError('プロジェクト名は80文字以内にしてね。'); return }
    setError('')
    onSubmit({ githubUrl: githubUrl.trim(), ref: ref.trim(), projectName: name })
  }

  return (
    <section className="landing" aria-label="GitHubリポジトリを入力">
      <form className="drop" onSubmit={submit}>
        <svg className="drop-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" /></svg>
        <div className="inner">
          <LinkIcon />
          <h1><mark>GitHubのURL</mark>を<br />ちょうだい!</h1>
          <label className="sr" htmlFor="github-url">公開リポジトリのURL</label>
          <input id="github-url" className="url" type="url" autoComplete="url" required placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
          <button className="btn primary" type="submit">わんこ、お願い!</button>
        </div>
      </form>
      {error && <p className="err" role="alert">{error}</p>}
      <details className="landing-opts">
        <summary>ブランチや名前を決めたいなら(任意)</summary>
        <div className="opts">
          <label htmlFor="github-ref">ブランチ・タグ・コミット<input id="github-ref" type="text" maxLength={200} placeholder="空欄ならデフォルトブランチ" value={ref} onChange={(e) => setRef(e.target.value)} form="" /></label>
          <label htmlFor="project-name">プロジェクト名<input id="project-name" type="text" maxLength={80} placeholder="空欄ならリポジトリ名" value={projectName} onChange={(e) => setProjectName(e.target.value)} /></label>
        </div>
      </details>
      <p className="landing-foot">公開リポジトリだけ対応してるよ。わんこがコードを見てどこに載せるか選んで、きみがOKしたらすぐデプロイするね。</p>
      {historyCount > 0 && <p className="landing-hint">前に入れたリポジトリが{historyCount}件あるよ。<button className="linkbtn" type="button" onClick={onOpenHistory}>履歴から続きを見る</button></p>}
    </section>
  )
}
