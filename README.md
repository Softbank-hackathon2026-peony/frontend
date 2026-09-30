# Pawploy frontend

파일을 넣으면 배포 멍멍이가 고민하다가 배포 방식을 골라 주는 화면. Vite + React + TypeScript + Tailwind v4.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build → dist/
```

## 백엔드 연결

- 기본 주소는 `https://fawploy.yyoungjin.com`. 바꾸려면 `.env` 에 `VITE_API_BASE_URL` 을 넣는다 (`.env.example` 참고).
- 파일을 넣으면 `src/api/upload.ts` 가 프로젝트 생성 → 멀티파트 presign → 파트별 S3 PUT(동시 3개) → complete 순서로 실제 업로드한다. 실패·취소 시 abort 로 정리한다.
- S3 파트 업로드 응답의 `ETag` 헤더를 읽어야 하므로 버킷 CORS 에 `ExposeHeaders: ETag` 가 필요하다.
- 분석·배포 API 는 아직 없다. 근거 화면(`src/data/analysis.ts`)과 만드는 중 화면은 예시 연출이고, API 가 생기면 그 파일과 `Build.tsx` 를 교체한다.

## 새로고침 후에도 남는 것

로그인과 목록 API 가 없어서 올린 기록(`project_id`, `upload_id`, 파일명, `project_token`)을 `localStorage` 에 최대 10개 저장한다 (`src/api/history.ts`). 랜딩의 "최근 올린 파일"에서 이어 볼 수 있다. 로그인이 생기면 서버 조회로 바꾼다.

## 화면 흐름

1. 랜딩: 원형 점선에 드래그앤드롭 (`.zip .tar .gz .tgz .js .ts .html .css .json`)
2. 고민: 강아지가 다리 꼬고 고민하며 말하는 동안 실제 업로드 진행 (칩에 %/조각 수 표시)
3. 띠용: 대사와 업로드가 모두 끝나면 놀라며 결정
4. 근거 화면: 단서 4개 → 결정 카드, 아래에 `좋아!` / `아니 다른거 할래`
5. 만드는 중: 단계 체크리스트 (배포 API 대기)
