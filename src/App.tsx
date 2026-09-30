import { useRef, useState } from 'react'
import { ArrowRight, Check, FileArchive, FolderOpen, HelpCircle, UploadCloud } from 'lucide-react'

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  const selectFile = (nextFile?: File) => {
    if (nextFile) setFile(nextFile)
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <a href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-900 text-lg text-white">🐶</span>
          <span className="text-lg">pawploy</span>
        </a>
        <div className="flex items-center gap-5 text-sm font-medium text-slate-500">
          <button className="hidden transition hover:text-slate-900 sm:block">배포 가이드</button>
          <button aria-label="도움말" className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white hover:border-slate-300">
            <HelpCircle size={17} />
          </button>
          <div className="grid size-9 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">김</div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-10 lg:pt-20">
        <div className="max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700">
            <span className="size-1.5 rounded-full bg-orange-500" /> 복잡한 배포, 이제 한 번에
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-[-0.05em] sm:text-6xl">파일 하나로<br /><span className="text-orange-500">배포를 시작하세요.</span></h1>
          <p className="mt-7 max-w-md text-base leading-7 text-slate-500">서비스 파일을 올리면 Pawploy가 가장 적합한 클라우드 아키텍처를 제안하고, 클릭 한 번으로 배포해 드려요.</p>

          <div className="mt-10 flex gap-8 text-sm text-slate-500">
            {['AI 아키텍처 분석', 'AWS 원터치 배포', '안전한 파일 보관'].map((item) => <div key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={12} strokeWidth={3} /></span>{item}</div>)}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="rounded-[20px] bg-slate-50 px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-7 flex items-start justify-between"><div><p className="text-lg font-bold">서비스 파일 업로드</p><p className="mt-1 text-sm text-slate-400">배포할 프로젝트의 압축 파일을 올려주세요.</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-400">STEP 1 / 3</span></div>
            <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[0]) }} className={`cursor-pointer rounded-2xl border-2 border-dashed px-5 py-12 text-center transition ${dragging ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
              <input ref={inputRef} type="file" accept=".zip,.tar,.gz,.js,.ts,.html,.css,.json" className="hidden" onChange={(e) => selectFile(e.target.files?.[0])} />
              {file ? <><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-500"><FileArchive /></div><p className="mt-4 truncate px-4 font-bold">{file.name}</p><p className="mt-1 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB · 업로드할 준비가 되었어요</p></> : <><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-500"><UploadCloud /></div><p className="mt-4 font-bold">파일을 이곳에 끌어다 놓으세요</p><p className="mt-2 text-sm text-slate-400">또는 버튼을 눌러 파일을 선택하세요</p><button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"><FolderOpen size={16} /> 파일 선택</button></>}
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span>ZIP, TAR, GZ 또는 소스 파일</span><span>최대 10MB</span></div>
            <button disabled={!file} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">분석 시작하기 <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl items-center justify-between border-t border-slate-200 px-6 py-6 text-xs text-slate-400 lg:px-10"><span>© 2026 Pawploy</span><span>Built for simpler deployments</span></footer>
    </main>
  )
}

export default App
