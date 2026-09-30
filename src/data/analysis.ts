// 분석·배포 API가 아직 없어서 화면에 보여 줄 예시 데이터. 백엔드가 생기면 이 파일을 API 응답으로 교체한다.
import type { ComponentType, SVGProps } from 'react'
import { BoxIcon, ChipIcon, ClockIcon, CloudIcon } from '../components/Icons'

export type Clue = {
  color: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  file: string
  find: [string, string, string] // [앞, 강조, 뒤]
  plain: string
  tag: string
}

export const DIALOGUE = [
  '흠… 너는 이미지 분류 모델을 서빙하는 프로젝트구나~',
  'config.yaml에 region: ap-northeast-2… 클라우드는 AWS 환경을 쓰겠군.',
  'scheduler.py의 cron을 보니 매일 아침 9시에만 돌아가는 서비스잖아?',
  '학습 코드는 없고 predict()만 있어. 추론만 하는 거고… 모델은 4.2MB, 5MB 이하네…',
  '특정 시간에만 쓰이고, 가볍고, AWS… 그렇다면…!',
]
export const FINAL_LINE = 'AWS Lambda로 배포할게!'

export const CLUES: Clue[] = [
  { color: 'var(--blue)', Icon: CloudIcon, file: 'config.yaml · 3번째 줄', find: ['', 'region: ap-northeast-2', ', S3 버킷 이름이 적혀 있어'], plain: '쉽게 말하면: 이미 AWS를 쓰기로 한 프로젝트야', tag: 'AWS 환경' },
  { color: 'var(--orange)', Icon: ClockIcon, file: 'scheduler.py · 12번째 줄', find: ['', 'cron("0 9 * * *")', ' 매일 아침 9시에 한 번만 실행돼'], plain: '쉽게 말하면: 하루 중 몇 분만 일하고 나머진 놀아', tag: '특정 시간만 사용' },
  { color: 'var(--purple)', Icon: ChipIcon, file: 'app/predict.py', find: ['학습 코드 없이 ', 'predict()', '만 있어. 추론 전용이야'], plain: '쉽게 말하면: GPU로 오래 계산할 일이 없어', tag: '추론 서비스' },
  { color: 'var(--green)', Icon: BoxIcon, file: 'model/classifier.onnx', find: ['모델 파일이 ', '4.2MB', ', 의존성은 onnxruntime 하나'], plain: '쉽게 말하면: 아주 가벼워서 어디든 금방 올라가', tag: '5MB 이하' },
]

export const DECISION = {
  name: 'AWS Lambda',
  why: '쓸 때만 켜지고, 안 쓰면 요금이 0원인 곳!',
  reasons: [
    ['AWS 환경', '이니까 같은 계정 안에서 S3, 스케줄러(EventBridge)를 바로 연결해'],
    ['하루 한 번', '만 돌아가니까 항상 켜둔 서버는 낭비야. 실행 시간만큼만 내면 돼'],
    ['추론만', ' 하니까 응답 15분 제한 안에 충분히 끝나'],
    ['4.2MB', ' 모델은 Lambda 배포 한도(zip 50MB) 안에 넉넉히 들어가'],
  ] as [string, string][],
}

export type Alternative = { name: string; color: string; verdict: 'good' | 'warn' | 'bad'; verdictLabel: string; desc: string; fit: number }
export const ALTERNATIVES: Alternative[] = [
  { name: 'AWS Lambda', color: 'var(--fur)', verdict: 'good', verdictLabel: '추천', desc: '이벤트가 올 때만 실행. 이번 프로젝트의 단서 4개와 전부 맞아.', fit: 96 },
  { name: 'EC2 서버', color: 'var(--blue)', verdict: 'bad', verdictLabel: '낭비', desc: '24시간 켜져 있어. 하루 5분 쓰려고 23시간 55분치 요금을 내는 셈이야.', fit: 22 },
  { name: 'ECS Fargate', color: 'var(--green)', verdict: 'warn', verdictLabel: '과함', desc: '컨테이너를 만들고 관리해야 해. 의존성 하나짜리 프로젝트엔 손이 너무 많이 가.', fit: 48 },
  { name: 'SageMaker Endpoint', color: 'var(--purple)', verdict: 'warn', verdictLabel: '과함', desc: '대형 모델용 전용 서빙. 4MB 모델엔 최소 비용부터 너무 커.', fit: 35 },
]

export const BUILD_STEPS: Record<string, string[]> = {
  'AWS Lambda': ['의존성 묶기 (onnxruntime + 모델 4.2MB)', 'Lambda 함수 만들기', '매일 9시 스케줄 연결 (EventBridge)', '테스트 호출 한 번'],
  'EC2 서버': ['EC2 인스턴스 켜기 (t3.small)', '파이썬 환경 + 의존성 설치', 'cron 등록 (매일 9시)', '테스트 호출 한 번'],
  'ECS Fargate': ['Dockerfile 만들기', '이미지 빌드 후 ECR에 올리기', 'Fargate 스케줄 태스크 만들기', '테스트 호출 한 번'],
  'SageMaker Endpoint': ['모델 아티팩트 S3에 올리기', 'SageMaker 모델 + 엔드포인트 만들기', '스케줄 호출 연결', '테스트 호출 한 번'],
}
