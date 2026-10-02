# Pawploy frontend

Vite + React + TypeScript + Tailwind CSS. 현재 백엔드 구현 범위인 **공개 GitHub 저장소의 특정 커밋을 S3에 보관**하는 화면이다. 파일 업로드, AI 분석, 이미지 빌드, 실제 배포는 아직 지원하지 않는다.

```bash
npm ci
npm run dev
npm run build
```

기본 API 주소는 `https://fawploy.teampeony.net`이다. 변경하려면 `VITE_API_BASE_URL` 환경 변수를 사용한다 (`.env.example` 참고).

사용자가 저장소 URL과 선택적 ref/프로젝트 이름을 입력하면 프론트가 프로젝트를 만들고 GitHub 소스를 등록한다. 백엔드가 반환한 커밋 SHA로 S3 보관 상태를 조회하며 `ready` 또는 `failed`까지 폴링한다. 새로고침 후에도 히스토리에서 다시 확인할 수 있다.

현재 로그인/프로젝트 목록 API가 없어서 프로젝트 토큰을 브라우저 `localStorage`에 최대 10개 저장한다. 이 토큰으로 해당 프로젝트에 접근할 수 있으므로 공유 컴퓨터에서는 기록을 삭제해야 한다. 히스토리 삭제는 브라우저 기록만 지우며 서버의 소스를 삭제하지 않는다.
