import { Dog } from '../components/Dog'
import { CheckIcon } from '../components/Icons'
import { DEPLOY_STEPS, parseStep, type DeployStep, type Deployment } from '../api/fawploy'

type Props = { deployment: Deployment | null; label: string; error: string | null; onRestart: () => void }

const STEP_LABEL: Record<DeployStep, string> = {
  build: 'Dockerイメージのビルド · ECRへプッシュ',
  fix: 'ビルドエラーの自動修正',
  terraform: 'Terraformコード生成',
  plan: 'terraform plan',
  policy: 'ポリシーチェック(権限・コスト範囲)',
  apply: 'terraform apply',
  health: 'ヘルスチェック',
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
      <Dog pose={failed ? "think" : "typing"} still />
      <h2>{failed ? <><span className="nowrap"><em>{label}</em></span> のデプロイが止まっちゃった</> : <><span className="nowrap"><em>{label}</em>で</span>作ってるところ…</>}</h2>
      <ul className="steps">
        {ORDER.map((s, i) => {
          const state = failed && i === idx ? 'failed' : i < idx ? 'done' : i === idx ? 'doing' : ''
          return (
            <li key={s} className={state}>
              <span className="dot"><CheckIcon /></span>
              <span>{STEP_LABEL[s]}{s === 'build' && fixing && <em className="fixnote"> · 自動修正 {parsed.attempt ?? '?'}/{parsed.max ?? 3}</em>}</span>
            </li>
          )
        })}
      </ul>
      {!deployment && !error && <p className="note">デプロイ状況を読み込み中…</p>}
      {failed && (
        <div className="warnbox" role="alert">
          <b>{parsed.step === 'fix' ? `自動修正 ${parsed.attempt ?? ''}/${parsed.max ?? 3}回失敗したので中断したよ` : 'ここで失敗しちゃった'}</b>
          <p>{deployment?.reason || '原因の情報がないんだ。ログを確認してね。'}</p>
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="ids">{deployment && <span>deployment: {deployment.deployment_id}</span>}</div>
      {(failed || error) && <button className="btn ghost" type="button" onClick={onRestart}>最初から</button>}
    </section>
  )
}
