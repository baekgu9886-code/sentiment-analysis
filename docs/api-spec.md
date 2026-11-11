# API 명세

## 1. 엔드포인트

`POST /api/analyze`

Content-Type: `application/json`

## 2. 요청 본문

``` json
{
  "text": "오늘은 좋은 일이 많아서 행복하다.",
  "saveConsent": false
}
```

-   `text`: 필수 문자열, trim 후 1\~2,000자
-   `saveConsent`: 선택 불리언, 생략 시 false
-   추가 필드는 무시하거나 명시적 검증 오류로 처리하되 일관된 정책을
    적용한다.

## 3. 성공 응답

HTTP 200

``` json
{
  "ok": true,
  "result": {
    "sentiment": "positive",
    "label": "긍정",
    "confidence": 87,
    "reason": "행복과 좋은 일을 언급해 긍정적인 감정이 드러납니다."
  },
  "saved": false,
  "requestId": "server-generated-id"
}
```

## 4. 실패 응답

예시:

``` json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 내용을 확인해 주세요."
  },
  "requestId": "server-generated-id"
}
```

HTTP 상태: - 400: 요청 본문/입력 검증 실패 - 413: 요청 크기 초과 - 429:
요청 제한 - 502 또는 503: AI 공급자 오류 - 500: 내부 오류

사용자 응답에는 내부 예외 메시지를 넣지 않는다.

## 5. 서버 처리 순서

1.  HTTP 메서드 확인 (POST만 허용).
2.  Content-Type 및 JSON 본문 확인.
3.  요청 크기 제한 적용.
4.  `text`, `saveConsent` 타입과 길이 검증.
5.  IP/세션 기반 요청 제한 등 배포 환경에 적합한 기본 남용 방지 적용.
    신뢰할 수 없는 임의 헤더만으로 사용자 신원을 단정하지 않는다.
6.  OpenAI API 호출에 타임아웃을 적용한다.
7.  AI 결과를 허용 스키마에 맞게 검증한다.
8.  저장 동의가 true이고 Supabase 설정이 완료된 경우에만 저장을
    시도한다.
9.  성공 결과를 반환한다.

## 6. OpenAI 연동

-   서버에서 공식 OpenAI SDK를 사용한다.
-   API 키는 `process.env.OPENAI_API_KEY`에서만 읽는다.
-   모델은 `process.env.OPENAI_MODEL`에서 읽는다.
-   구현 시 공식 문서에서 현재 권장되는 API 방식과 구조화 출력 지원
    여부를 확인한다.
-   모델 응답은 신뢰할 수 없는 외부 입력으로 간주하고 서버에서 검증한다.
-   실패·타임아웃은 안전한 오류 코드로 변환한다.

## 7. 브라우저 호출

-   `fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, saveConsent }) })`
-   응답의 HTTP 상태와 JSON의 `ok`를 모두 확인한다.
-   네트워크 오류와 서버가 반환한 오류를 구분해 화면에 표시한다.
-   응답 전체를 HTML 문자열로 삽입하지 않는다.

## 8. API 완료 기준

-   정상 JSON 요청에서 명세된 응답 구조를 반환한다.
-   GET 등 허용되지 않은 메서드는 405를 반환한다.
-   잘못된 JSON, 빈 문자열, 길이 초과, 잘못된 불리언 값을 안전하게
    처리한다.
-   API 키가 응답·브라우저 코드·로그에 나타나지 않는다.
