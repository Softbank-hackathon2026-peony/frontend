import { Dog } from '../components/Dog'

type Props = {
  repositoryUrl: string
  phase: 'creating' | 'registering' | 'error'
  error: string | null
  onRetry: () => void
  onCancel: () => void
}

export function Thinking({ repositoryUrl, phase, error, onRetry, onCancel }: Props) {
  const status = phase === 'creating' ? '프로젝트 만드는 중' : phase === 'registering' ? 'GitHub 커밋 확인 중' :
    '보관 작업 대기 중'
  return (
    <section className="think" aria-live="polite">
      <div className={`filechip${error ? ' err' : ''}`}><b>{repositoryUrl}</b><span>{error ? '실패' : status}</span></div>
      <div className="scene">
        <div className={`bubble ${error ? 'error' : 'thought'}`}>
          {error ? (
            <div>앗, 소스를 가져오지 못했어. {error}
              <div className="actions"><button className="btn dark small" type="button" onClick={onRetry}>다시 시도</button><button className="btn ghost small" type="button" onClick={onCancel}>주소 바꾸기</button></div>
            </div>
          ) : <span>{status}… 커밋을 고정하고 안전하게 보관하고 있어!</span>}
        </div>
        <Dog pose="think" decor />
      </div>
      {!error && <button className="btn ghost small" type="button" onClick={onCancel}>처음으로</button>}
      {!error && <p className="note">페이지를 닫아도 작업은 계속돼. 등록 후에는 히스토리에서 상태를 다시 확인할 수 있어.</p>}
    </section>
  )
}
