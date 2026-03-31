# K Recipe

집밥 메뉴를 예쁘게 보여주는 **공개 레시피 웹앱**입니다.

---

## 로컬 실행

```bash
npm install
npm start
```

브라우저 주소:

- 홈페이지: `http://localhost:3000`
- 레시피 라이브러리: `http://localhost:3000/recipes.html`

> 로컬에서는 `data/recipes.json` 파일을 사용하므로 바로 테스트할 수 있습니다.

---

## 배포 구조

이 프로젝트는 두 가지 방식으로 동작합니다.

1. **로컬 개발**: `Express + data/recipes.json`
2. **배포 환경**: `Vercel + Supabase`

현재는 **공개 보기용 웹앱**으로 운영되며, 메뉴 데이터는 로컬 JSON 파일이나 Supabase에서 관리할 수 있습니다.

---

## Supabase 설정

### 1) Supabase 프로젝트 생성
- [https://supabase.com](https://supabase.com) 에서 새 프로젝트 생성

### 2) 테이블 만들기
- Supabase SQL Editor에서 `supabase/schema.sql` 실행

### 3) 환경 변수 준비
`.env.example` 내용을 참고해서 아래 값을 준비합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Vercel 배포

### 방법 A. 가장 쉬운 방법
1. GitHub에 이 프로젝트 업로드
2. [https://vercel.com](https://vercel.com) 에서 Import
3. Environment Variables에 아래 값 입력
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### 방법 B. CLI 배포
```bash
npm install
npx vercel
```

배포 후:
- 공개 페이지를 외부에서 바로 접속 가능
- 데이터는 Supabase에 저장되어 계속 유지 가능

---

## 애드센스 준비 팁

애드센스를 붙일 계획이면 아래를 함께 준비하는 것이 좋습니다.

- 커스텀 도메인 연결
- `소개` / `레시피` / `개인정보처리방침` 페이지 구성
- 모바일 반응형 유지
- 메뉴/콘텐츠를 꾸준히 업데이트

---

## 주요 파일

- `public/` : 공개 웹 페이지
- `api/recipes.js` : 공개 레시피 API
- `lib/recipeStore.js` : 레시피 데이터 로직
- `data/recipes.json` : 로컬 테스트용 데이터
- `supabase/schema.sql` : DB 생성용 SQL
