import { Dog } from '../components/Dog'
import { CheckIcon } from '../components/Icons'
import { DEPLOY_STEPS, parseStep, type DeployStep, type Deployment } from '../api/fawploy'

type Props = { deployment: Deployment | null; label: string; error: string | null; onRestart: () => void }

const STEP_LABEL: Record<DeployStep, string> = {
  build: 'Docker 이미지 빌드 · ECR 푸시',
  fix: '빌드 오류 자동 수정',
  terraform: 'Terraform 코드 생성',
  plan: 'terraform plan',
  policy: '정책 검사 (권한 · 비용 범위)',
  apply: 'terraform apply',
  health: '헬스체크',
}
// fix 는 build 에 붙는 보조 단계라 목록에선 build 아래 한 줄로 보여 준다
const ORDER: DeployStep[] = DEPLOY_STEPS.filter((s) => s !== 'fix')

export function Build({ deployment, label, error, onRestart }: Props) {
  const parsed = deployment ? parseStep(deployment) : { step: null as DeployStep | null }
  const current = parsed.step === 'fix' ? 'build' : parsed.step
  const idx = current ? ORDER.indexOf(current) : -1
  const failed = deployment?.status === 'failed'
  const fixing = parsed.step === 'fix'

  return (
    <section className="build" aria-live="polite">
      <Dog pose="eureka" still />
      <h2>{failed ? <><span className="nowrap"><em>{label}</em></span> 배포가 멈췄어</> : <><span className="nowrap"><em>{label}</em>로</span> 만드는 중…</>}</h2>
      <ul className="steps">
        {ORDER.map((s, i) => {
          const state = failed && i === idx ? 'failed' : i < idx ? 'done' : i === idx ? 'doing' : ''
          return (
            <li key={s} className={state}>
              <span className="dot"><CheckIcon /></span>
              <span>{STEP_LABEL[s]}{s === 'build' && fixing && <em className="fixnote"> · 자동 수정 {parsed.attempt ?? '?'}/{parsed.max ?? 3}</em>}</span>
            </li>
          )
        })}
      </ul>
      {!deployment && !error && <p className="note">배포 상태를 불러오는 중…</p>}
      {failed && (
        <div className="warnbox" role="alert">
          <b>{parsed.step === 'fix' ? `자동 수정 ${parsed.attempt ?? ''}/${parsed.max ?? 3}회 실패로 중단했어` : '여기서 실패했어'}</b>
          <p>{deployment?.reason || '원인 정보가 없어. 로그를 확인해 줘.'}</p>
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="ids">{deployment && <span>deployment: {deployment.deployment_id}</span>}</div>
      {(failed || error) && <button className="btn ghost" type="button" onClick={onRestart}>처음으로</button>}
    </section>
  )
}
