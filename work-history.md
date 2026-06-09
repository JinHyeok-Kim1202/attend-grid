# 작업 기록

## 2026-06-08

### 요청 사항
- `AttendGrid` 이름으로 Next.js 15 + TypeScript 프로젝트 생성
- App Router, Tailwind CSS, shadcn/ui, AG Grid Enterprise, Prisma ORM, PostgreSQL 지원 포함
- 좌측 사이드바, 상단 헤더, 메인 콘텐츠 영역을 갖는 반응형 엔터프라이즈 ERP 스타일 대시보드 구성

### 실행한 명령어
1. `npx create-next-app@15 . --ts --tailwind --eslint --app --use-npm --import-alias "@/*" --turbopack --no-src-dir`
   - `AttendGrid`처럼 대문자가 포함된 이름은 npm 패키지명 제약으로 바로 사용할 수 없어 실패
2. `ls`
3. `npx create-next-app@15 attendgrid-temp --ts --tailwind --eslint --app --use-npm --import-alias "@/*" --turbopack --no-src-dir`
4. `shopt -s dotglob nullglob && mv "attendgrid-temp"/* "AttendGrid"/ && rm -rf "attendgrid-temp"`
5. `npx shadcn@latest init -d`
6. `npm install ag-grid-community ag-grid-enterprise ag-grid-react @prisma/client && npm install -D prisma`
7. `npx shadcn@latest add badge card input avatar separator sheet`
8. `npx prisma init --datasource-provider postgresql`
9. `npm install`
10. `npm run lint`
11. `npm run build`
   - 최초 빌드 시 `lib/prisma.ts`가 생성된 Prisma 클라이언트 경로와 맞지 않아 실패
12. `npx prisma generate`
13. `npm run lint`
14. `npm run build`
15. `rm -rf "lib/generated"`
16. `npm run build`

### 설치한 패키지
- 런타임 의존성:
  - `next`
  - `react`
  - `react-dom`
  - `@base-ui/react`
  - `class-variance-authority`
  - `clsx`
  - `lucide-react`
  - `tailwind-merge`
  - `tw-animate-css`
  - `ag-grid-community`
  - `ag-grid-enterprise`
  - `ag-grid-react`
  - `@prisma/client`
  - `shadcn`
- 개발 의존성:
  - `typescript`
  - `@types/node`
  - `@types/react`
  - `@types/react-dom`
  - `tailwindcss`
  - `@tailwindcss/postcss`
  - `eslint`
  - `eslint-config-next`
  - `@eslint/eslintrc`
  - `prisma`

### 수행한 작업
- `AttendGrid` 디렉터리에 TypeScript, App Router, Tailwind CSS, ESLint, Turbopack 기반 Next.js 15 앱을 생성
- `shadcn/ui`를 초기화하고 대시보드에 사용할 UI 컴포넌트를 추가
- AG Grid Enterprise 관련 패키지를 설치하고 기본 설정을 연결
- PostgreSQL datasource를 사용하는 Prisma 초기 설정을 추가
- 직원 및 근태 기록용 Prisma 모델과 유틸 구성을 추가
- shadcn/ui 기반의 반응형 ERP 스타일 대시보드를 구현
- 엔터프라이즈 기능이 포함된 AG Grid 근태 테이블과 샘플 데이터를 추가
- 더 정돈된 엔터프라이즈 느낌을 위해 전역 디자인 시스템, 타이포그래피, AG Grid 테마를 조정
- PostgreSQL 연결 문자열과 AG Grid 라이선스 키 예시를 `.env.example`에 추가
- `package.json`에 Prisma 관련 스크립트를 추가

### 생성 또는 수정한 파일
- `package.json`
- `.env`
- `.env.example`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `components/dashboard/attendance-grid.tsx`
- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/avatar.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components.json`
- `lib/utils.ts`
- `lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma.config.ts`

### 검증
- `npm run lint` 통과
- `npm run build` 통과

### 계속 기록할 사항
- 앞으로 이 프로젝트에서 실행한 명령어, 설치한 패키지, 변경한 코드 및 작업 내용을 이 파일에 계속 누적 기록

---

### 추가 요청 사항
- Auth.js 기반 로그인 시스템 생성
- 이메일/비밀번호 로그인 지원
- 보호된 라우트 적용
- 세션 관리 구성
- PostgreSQL 사용자 테이블 구성
- 역할 지원: `ADMIN`, `MANAGER`, `USER`
- 비인증 사용자는 `/login`으로 리다이렉트

### 추가로 실행한 명령어
1. `npm install next-auth @auth/prisma-adapter bcryptjs`
2. `npx prisma generate`
3. `npm run lint`
4. `npm run build`
   - Prisma 7에서 PostgreSQL 드라이버 어댑터 없이 `PrismaClient`를 생성할 수 없어 실패
5. `npm install @prisma/adapter-pg pg`
6. `npx prisma generate`
7. `npm run lint && npm run build`
   - 설치된 `next-auth`가 v4라서 Auth.js v5 방식의 `handlers` export를 사용할 수 없어 실패
8. `npm install next-auth@beta`
9. `npm run lint && npm run build`
   - Auth.js 타입 이름 차이 및 세션 role 타입 처리 문제를 확인
10. `npm run lint && npm run build`
    - 최종 통과

### 추가로 설치한 패키지
- 런타임 의존성:
  - `next-auth@beta`
  - `@auth/prisma-adapter`
  - `bcryptjs`
  - `@prisma/adapter-pg`
  - `pg`

### 추가로 수행한 작업
- Auth.js v5 기준 인증 구성을 위해 `auth.ts`, `auth.config.ts`, `middleware.ts`를 추가
- Credentials Provider를 이용한 이메일/비밀번호 로그인 로직을 구현
- Prisma 스키마에 `User`, `Account`, `Session`, `VerificationToken` 모델과 `Role` enum을 추가
- 역할 기반 세션 타입을 위해 `types/next-auth.d.ts`를 추가
- `/api/auth/[...nextauth]` 라우트 핸들러를 연결
- `/login` 페이지와 로그인 폼을 추가하고 로그인 실패 메시지를 처리
- 미인증 사용자는 `/login`으로, 인증된 사용자가 `/login`에 접근하면 `/`로 이동하도록 미들웨어를 구성
- 기존 대시보드(`/`)를 보호된 페이지로 바꾸고 현재 로그인 사용자 정보와 로그아웃 버튼을 연결
- Prisma 7 요구사항에 맞게 PostgreSQL 드라이버 어댑터(`@prisma/adapter-pg`)를 사용하도록 `lib/prisma.ts`를 수정
- 테스트용 계정을 쉽게 만들 수 있도록 `npm run db:create-user -- <email> <password> <ADMIN|MANAGER|USER> [name]` 스크립트를 추가

### 추가로 생성 또는 수정한 파일
- `package.json`
- `.env`
- `.env.example`
- `prisma/schema.prisma`
- `lib/prisma.ts`
- `auth.config.ts`
- `auth.ts`
- `middleware.ts`
- `types/next-auth.d.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/login/page.tsx`
- `app/login/actions.ts`
- `components/auth/login-form.tsx`
- `app/page.tsx`
- `scripts/create-user.mjs`

### 추가 검증
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- 홈 대시보드에서 실제 없는 하드코딩 데이터를 제거하고 실제 DB 데이터만 사용
- 통합 현황의 직원 목록을 실제 DB 직원 5명과 연동
- 예외 처리 큐, 관리자 승인 준비도처럼 현재와 무관한 하드코딩 영역 제거
- 로그아웃 버튼 및 동작하지 않는 버튼/메뉴 정리
- 근무조, 운영 쪽처럼 동작하지 않는 메뉴 제거

### 추가로 실행한 명령어
1. `npx prisma generate && npm run lint && npm run build`

### 추가로 수행한 작업
- 홈 대시보드 KPI를 실제 DB 기반 값으로 교체: 등록 직원 수, 활성 직원 수, 운영 부서 수, 이번 달 근태 입력 건수, 오늘 입력 완료 수
- 홈 메인 그리드를 실제 직원 데이터와 실제 근태 입력 수 기반으로 재구성
- 통합 현황 그리드에 실제 등록된 직원 5명의 이름/부서/직책/전화번호/오늘 상태/이번 달 입력 수를 표시하도록 변경
- 하드코딩된 예외 처리 큐, 관리자 승인 준비도, 권역 지원 데스크 영역을 제거
- 근태 데이터가 없을 때는 실제 상태를 반영한 안내 카드만 표시하도록 변경
- 사이드바에서 동작하지 않는 `근무조` 및 운영 섹션 메뉴를 제거
- 상단의 비동작 버튼(일정/알림 등)을 제거하고 로그아웃 버튼을 단순 submit 버튼으로 변경
- 직원 관리/근태 관리 페이지의 상단 문구도 한글로 정리

### 추가로 생성 또는 수정한 파일
- `app/page.tsx`
- `components/dashboard/attendance-grid.tsx`
- `components/layout/app-shell.tsx`
- `app/employees/page.tsx`
- `app/attendance/page.tsx`

### 추가 검증
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- Vercel 배포 가능 여부 점검 및 외부 사용자 접근 준비

### 추가로 실행한 명령어
1. `vercel --version`
   - Vercel CLI가 설치되어 있지 않음을 확인
2. `vercel whoami`
   - Vercel CLI 미설치로 로그인 상태 확인 불가

### 추가로 수행한 작업
- 현재 앱은 배포 가능 상태인지 점검
- 배포 시 현재 `DATABASE_URL`이 `localhost`라서 외부 배포 환경에서는 사용할 수 없음을 확인
- 배포용 DB로 `Neon` 사용을 추천하고, 사용자가 `Neon 사용`을 선택함

---

### 추가 요청 사항
- Neon DB에 관리자 계정 생성 후 테스트 직원 5명 다시 추가

### 추가로 실행한 명령어
1. `node -e "require('dotenv').config(); ... prisma.employee.upsert(...) ..."`
   - 테스트 직원 5명을 배포용 DB에 생성 또는 갱신

### 추가로 수행한 작업
- 배포용 외부 DB(Neon)에 테스트 직원 5명(`김민수`, `이서연`, `박준호`, `최유진`, `정하늘`)을 다시 생성

---

### 추가 요청 사항
- Neon PostgreSQL과 Vercel 환경변수 연결 완료 후 배포 준비 마무리

### 추가로 수행한 작업
- 배포용 DB로 Neon PostgreSQL을 연결
- Vercel 프로젝트 환경변수에 `DATABASE_URL`, `AUTH_SECRET`를 설정
- 배포용 외부 DB 기준으로 관리자 계정과 테스트 직원 데이터 준비를 완료
- 프로덕션 배포 주소를 `https://attend-grid.vercel.app`로 사용할 수 있는 상태까지 진행

---

### 추가 요청 사항
- AG Grid 필터를 헤더 아래 별도 행이 아니라, 맨 위 컬럼 헤더에서 바로 사용할 수 있게 변경

### 추가로 실행한 명령어
1. `npm run lint && npm run build`

### 추가로 수행한 작업
- `직원 관리`, 홈 대시보드의 AG Grid에서 `floatingFilter`를 제거
- 이제 필터는 별도 플로팅 필터 행 없이 컬럼 헤더 메뉴에서 바로 사용할 수 있도록 정리

### 추가로 생성 또는 수정한 파일
- `components/employees/employee-management.tsx`
- `components/dashboard/attendance-grid.tsx`

### 추가 검증
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- AG Grid `No AG Grid modules are registered` 오류 수정

### 추가로 실행한 명령어
1. `npm run lint && npm run build`

### 추가로 수행한 작업
- AG Grid v35 모듈 방식에 맞게 공통 모듈 등록 유틸 `lib/ag-grid.ts`를 추가
- `AllEnterpriseModule`과 라이선스 초기화를 공용으로 관리하도록 정리
- 홈 대시보드, 직원 관리, 근태 관리의 모든 `AgGridReact`에 `modules={agGridModules}`를 연결

### 추가로 생성 또는 수정한 파일
- `lib/ag-grid.ts`
- `components/dashboard/attendance-grid.tsx`
- `components/employees/employee-management.tsx`
- `components/attendance/attendance-sheet.tsx`

### 추가 검증
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- 직원 관리, 근태 관리 화면에 직원이 표시되지 않는 문제 확인 및 수정

### 추가로 실행한 명령어
1. `node -e "require('dotenv').config(); ... prisma.employee.findMany(...) ..."`
   - DB에는 직원 5명, 근태 데이터 0건이 실제로 존재함을 확인
2. `npx prisma generate && npm run lint && npm run build`

### 추가로 수행한 작업
- 데이터 자체는 DB에 존재하므로 프론트보다 API 접근 경로를 우선 점검
- 원인으로 추정되는 미들웨어 문제를 수정: 기존에는 `/api/*`도 미들웨어 리다이렉트 대상이어서 클라이언트 fetch가 데이터 대신 로그인 응답을 받을 수 있었음
- `middleware.ts`에서 일반 API 경로를 미들웨어 매처에서 제외
- 대신 각 API 라우트에서 `requireApiSession()`으로 인증을 JSON 401 방식으로 처리하도록 변경
- 직원/근태/사용자 API 전체에 공통 API 인증 가드를 추가

### 추가로 생성 또는 수정한 파일
- `middleware.ts`
- `lib/api-auth.ts`
- `app/api/employees/route.ts`
- `app/api/employees/[id]/route.ts`
- `app/api/attendance/route.ts`
- `app/api/attendances/route.ts`
- `app/api/attendances/[id]/route.ts`
- `app/api/users/route.ts`
- `app/api/users/[id]/route.ts`

### 추가 검증
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- 직원 관리 페이지에서 총 인원은 보이지만 AG Grid 행이 표시되지 않는 문제 수정

### 추가로 실행한 명령어
1. `npm run lint && npm run build`

### 추가로 수행한 작업
- 직원 데이터는 정상 로드되고 있었지만, `/employees` 페이지에서 AG Grid 엔터프라이즈 모듈이 로드되지 않아 그리드 행 렌더링이 깨질 가능성을 확인
- `components/employees/employee-management.tsx`에 `ag-grid-enterprise` import와 라이선스 키 초기화를 추가

### 추가로 생성 또는 수정한 파일
- `components/employees/employee-management.tsx`

### 추가 검증
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- Employee Management 페이지 생성
- AG Grid 테이블
- 검색
- 직원 추가 다이얼로그
- 직원 수정
- 직원 삭제
- 페이지네이션
- 필드: 이름, 전화번호, 부서, 직책

### 추가로 실행한 명령어
1. `npx shadcn@latest add dialog label`
2. `npx prisma generate && npm run lint && npm run build`

### 추가로 설치한 패키지
- 없음 (`shadcn` 컴포넌트 파일만 추가)

### 추가로 수행한 작업
- 공통 대시보드 레이아웃을 재사용할 수 있도록 `components/layout/app-shell.tsx`를 추가
- 홈 대시보드가 공통 셸을 사용하도록 `app/page.tsx`를 정리
- `/employees` 경로에 직원 관리 페이지를 추가하고 사이드바에서 이동 가능하도록 연결
- Prisma `Employee` 모델에 `phone`, `position` 필드를 추가하고 `site`, `shiftTemplate`, `employeeCode` 기본값을 정리
- `/api/employees`, `/api/employees/[id]` API를 추가해 직원 목록 조회, 추가, 수정, 삭제를 구현
- AG Grid 기반의 직원 관리 클라이언트 컴포넌트를 추가
- 검색, 추가 다이얼로그, 수정, 삭제, 페이지네이션 기능을 구현
- 빈 데이터 상태와 오류 메시지, 새로고침 동작을 함께 구성

### 추가로 생성 또는 수정한 파일
- `prisma/schema.prisma`
- `components/layout/app-shell.tsx`
- `components/employees/employee-management.tsx`
- `components/ui/dialog.tsx`
- `components/ui/label.tsx`
- `app/api/employees/route.ts`
- `app/api/employees/[id]/route.ts`
- `app/employees/page.tsx`
- `app/page.tsx`

### 추가 검증
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- `npm run db:push` 실행 시 PostgreSQL 연결 오류 원인 확인
- 서버 실행 방법과 브라우저 접근 방법 안내

### 추가로 실행한 명령어
1. `docker --version`
   - Docker CLI는 설치되어 있음
2. `psql --version`
   - PostgreSQL 클라이언트는 설치되어 있지 않음
3. `docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
   - Docker Desktop 데몬이 실행 중이 아니어서 컨테이너 목록 조회 실패

### 추가로 수행한 작업
- `P1001: Can't reach database server at localhost:5432` 오류 원인을 점검
- 현재 `.env`가 `localhost:5432`의 PostgreSQL을 바라보도록 설정되어 있음을 확인
- 로컬 PostgreSQL 서버 또는 Docker Desktop 기반 PostgreSQL 컨테이너가 아직 실행되지 않은 상태라고 판단

---

### 추가 요청 사항
- `admin@attendgrid.local / 1234` 로그인 실패 원인 확인

### 추가로 실행한 명령어
1. `node -e "... prisma.user.findMany(...) ..."`
   - DB의 사용자 목록이 비어 있음을 확인
2. `npm run db:create-user -- admin@attendgrid.local 1234 ADMIN "AttendGrid Admin"`
   - 기존 스크립트가 Prisma 7 어댑터 없이 `PrismaClient`를 생성해 실패
3. `npm run db:create-user -- admin@attendgrid.local 1234 ADMIN "AttendGrid Admin" && node -e "... prisma.user.findMany(...) ..."`
   - 스크립트 수정 후 관리자 계정 생성 및 사용자 존재 확인

### 추가로 수행한 작업
- 로그인 실패 원인이 비밀번호 불일치가 아니라 DB에 사용자 자체가 없어서였음을 확인
- `scripts/create-user.mjs`가 Prisma 7 환경에서 동작하도록 `dotenv/config`와 `@prisma/adapter-pg` 기반으로 수정
- `admin@attendgrid.local (ADMIN)` 계정을 실제 DB에 생성

---

### 추가 요청 사항
- 홈페이지를 한글로 변경
- 테스트용 직원 5명 미리 생성

### 추가로 실행한 명령어
1. `node -e "require('dotenv').config(); ... prisma.employee.upsert(...) ..."`
   - 테스트용 직원 5명을 DB에 생성 또는 갱신
2. `npm run lint && npm run build`

### 추가로 설치한 패키지
- 없음

### 추가로 수행한 작업
- 홈 대시보드의 KPI, 카드, 버튼, 설명 문구를 한글로 변경
- 공통 셸의 사이드바, 검색 placeholder, 세션 카드, 접근성 문구를 한글화
- 홈 화면에 표시되는 근태 요약 AG Grid 컬럼명과 상태/승인 배지를 한글로 변경
- 테스트용 직원 5명(`김민수`, `이서연`, `박준호`, `최유진`, `정하늘`)을 DB에 생성

### 추가로 생성 또는 수정한 파일
- `app/page.tsx`
- `components/layout/app-shell.tsx`
- `components/dashboard/attendance-grid.tsx`

### 추가 검증
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- Prisma로 PostgreSQL 스키마 구성
- 테이블: `User`, `Employee`, `Attendance`
- `Attendance` 필드: `employeeId`, `date`, `status`
- 모든 CRUD API 생성

### 추가로 실행한 명령어
1. `npx prisma generate && npm run lint && npm run build`
2. `npx prisma generate && npm run lint && npm run build`
   - `Attendance` 업데이트 시 Prisma 타입 충돌이 있어 API 데이터 형태를 조정한 뒤 재검증

### 추가로 설치한 패키지
- 없음

### 추가로 수행한 작업
- Prisma 스키마에서 근태 모델을 `AttendanceRecord`에서 `Attendance`로 정리
- `Attendance` 테이블을 `employeeId`, `date`, `status` 중심 구조로 단순화
- `Employee`와 `Attendance` 관계명을 새 구조에 맞게 정리
- `AttendanceStatus` enum을 현재 근태 시트에 맞는 값으로 정리
- 기존 월별 근태 시트 API가 새 `Attendance` 모델을 사용하도록 수정
- `User` CRUD API (`/api/users`, `/api/users/[id]`)를 추가
- `Employee` CRUD API에 상세 조회 `GET /api/employees/[id]`를 추가
- `Attendance` CRUD API (`/api/attendances`, `/api/attendances/[id]`)를 추가
- 사용자 생성/수정 시 비밀번호는 해시 저장되도록 처리

### 추가로 생성 또는 수정한 파일
- `prisma/schema.prisma`
- `lib/attendance.ts`
- `app/api/attendance/route.ts`
- `app/api/employees/[id]/route.ts`
- `app/api/users/route.ts`
- `app/api/users/[id]/route.ts`
- `app/api/attendances/route.ts`
- `app/api/attendances/[id]/route.ts`

### 추가 검증
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm run build` 통과

---

### 추가 요청 사항
- Attendance Management 페이지 생성
- AG Grid Enterprise 사용
- 행: 직원
- 열: Day 1 ~ Day 31
- 셀 값: `출근`, `연차`, `반차`, `병가`, `결근`, `공가`
- 단일 셀 편집
- Fill Handle 드래그
- Copy/Paste
- 다중 셀 선택
- Excel 내보내기
- 월 선택기
- Excel 같은 근태 시트 스타일

### 추가로 실행한 명령어
1. `npx prisma generate && npm run lint`
2. `npm run build`

### 추가로 설치한 패키지
- 없음

### 추가로 수행한 작업
- `AttendanceStatus` enum에 근태 시트용 상태 값을 확장
- 근태 상태 값, 월 계산, 날짜 필드 생성을 위한 공용 유틸 `lib/attendance.ts`를 추가
- `/api/attendance` API를 추가해 월별 근태 조회와 단일 셀 저장을 구현
- `/attendance` 페이지를 추가하고 사이드바에서 접근 가능하도록 연결
- AG Grid Enterprise 기반의 Excel 스타일 근태 시트 컴포넌트를 구현
- 단일 셀 편집, Fill Handle, Copy/Paste, 다중 셀 선택, Excel Export, 월 선택 기능을 연결
- 월의 실제 일수보다 큰 날짜 칼럼은 비활성화 스타일로 처리
- 근태 상태별 셀 색상과 Excel 내보내기 스타일을 추가

### 추가로 생성 또는 수정한 파일
- `prisma/schema.prisma`
- `components/layout/app-shell.tsx`
- `lib/attendance.ts`
- `app/api/attendance/route.ts`
- `components/attendance/attendance-sheet.tsx`
- `app/attendance/page.tsx`
- `app/globals.css`

### 추가 검증
- `npx prisma generate` 통과
- `npm run lint` 통과
- `npm run build` 통과
