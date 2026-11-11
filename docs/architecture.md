# 시스템 아키텍처 및 프로젝트 생성 지침

## 1. 권장 폴더 구조

``` text
moment-sentiment/
├── AGENTS.md
├── PRD.md
├── docs/
│   ├── architecture.md
│   ├── ui-guidelines.md
│   ├── feature-spec.md
│   ├── api-spec.md
│   ├── database-security.md
│   └── testing-deployment.md
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── assets/
├── api/
│   └── analyze.js
├── lib/
│   ├── openai.js
│   └── supabase.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

Vercel 배포에서는 `api/`의 파일을 서버리스 함수로 사용한다. 별도 Express
서버를 상시 실행하는 구조 대신 Vercel Functions에 맞춘 단일 API 핸들러를
우선 사용한다. 로컬 개발은 Vercel CLI를 이용해 배포 환경과 비슷하게
실행한다. 에이전트는 임의로 폴더 구조를 바꾸지 않는다.

## 2. 데이터 흐름

1.  브라우저의 `public/js/app.js`가 입력값을 검사한다.
2.  브라우저가 `POST /api/analyze`로 JSON 요청을 보낸다.
3.  `api/analyze.js`가 요청 크기, 타입, 길이를 다시 검증한다.
4.  서버의 `lib/openai.js`가 OpenAI API를 호출한다.
5.  서버가 응답 스키마를 검증하고 안전한 결과만 반환한다.
6.  브라우저가 결과를 텍스트 노드로 표시한다.
7.  저장 동의가 있는 경우 서버가 Supabase에 기록한다.

## 3. 프로젝트 생성 절차

-   Node.js LTS 설치 여부 확인 (`node -v`, `npm -v`).
-   Antigravity에서 새 폴더 `moment-sentiment`를 연다.
-   이 문서 묶음을 프로젝트 루트에 복사한다.
-   `package.json`과 `.gitignore`를 생성한다.
-   필요한 패키지는 구현 문서에 근거해 최소 설치한다.
-   `.env.example`을 복사해 로컬 `.env`를 만들되 실제 키는 별도
    입력한다.
-   최초 실행 전 문서 전체를 읽고 작업 계획을 제출하도록 에이전트에
    지시한다.

## 4. 환경 변수

필수: - `OPENAI_API_KEY` - `OPENAI_MODEL` (프로젝트 설정에서 명시한
모델명) 선택적 저장 기능: - `SUPABASE_URL` - `SUPABASE_SERVICE_ROLE_KEY`

공개 환경변수로 노출되는 이름(`VITE_`, `NEXT_PUBLIC_` 등)은 사용하지
않는다. 이 프로젝트는 정적 HTML/JS이므로 비밀값을 `public/`에 두지
않는다.

## 5. 환경 분리

-   로컬: `.env` (Git 제외)
-   Vercel Preview: 테스트용 환경변수
-   Vercel Production: 운영용 환경변수
-   개발·운영 Supabase 프로젝트와 키를 가능하면 분리한다.

## 6. 설계 제약

-   프런트엔드는 OpenAI 또는 Supabase 서비스 키를 직접 호출하지 않는다.
-   브라우저에서 DB에 직접 저장하지 않는다.
-   API 요청은 동일 출처의 `/api/analyze`를 사용한다.
-   결과 형식이 예상과 다르면 임의로 화면에 렌더링하지 않고 안전한
    오류로 처리한다.
