# Basic CRUD - 풀스택 게시판 프로젝트

인증(JWT), 사용자 관리, 게시판, 댓글 기능을 갖춘 **프로덕션 수준**의 풀스택 웹 애플리케이션입니다.  
백엔드(Spring Boot), 프론트엔드(React), MySQL, Docker 구성으로 **로컬 및 Docker 환경**에서 바로 실행할 수 있습니다.

---

## 목차

- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [로컬에서 실행하기](#로컬에서-실행하기)
- [Docker로 실행하기](#docker로-실행하기)
- [API 문서](#api-문서)
- [curl 예제](#curl-예제)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Java 17, Spring Boot, Gradle |
| Database | MySQL 8 |
| ORM | Spring Data JPA |
| 인증 | JWT |
| Frontend | React, Vite, Axios, React Router |
| 배포 | Docker, Docker Compose |

---

## 아키텍처

### 백엔드 (Layered Architecture)

```
controller   → API 엔드포인트
service      → 비즈니스 로직
repository   → 데이터 접근
entity       → JPA 엔티티
dto          → 요청/응답 DTO
config       → 설정 (JWT 등)
exception    → 전역 예외 처리 (@ControllerAdvice)
security     → JWT 필터, Security 설정
```

### 프론트엔드

```
src/
  pages/      → 로그인, 회원가입, 게시판 목록, 글 상세/작성/수정
  components  → Layout 등
  api/        → authApi, userApi, postApi, commentApi
  hooks       → useAuth
  utils       → axios 인스턴스 (JWT 첨부)
```

### API 응답 형식 (통일)

```json
{
  "success": true,
  "data": { ... },
  "message": ""
}
```

---

## 로컬에서 실행하기

**사전 요구사항:** Java 17, Node.js 18+, MySQL 8 (또는 Docker로 MySQL만 실행)

### 1단계: MySQL 실행

MySQL이 설치되어 있다면 서버를 실행한 뒤, 다음으로 DB와 사용자를 준비합니다.

```bash
mysql -u root -p
CREATE DATABASE IF NOT EXISTS basiccrud;
```

또는 **Docker로 MySQL만** 띄우기:

```bash
docker run -d --name mysql-basiccrud \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=basiccrud \
  -e MYSQL_USER=app \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  mysql:8.0
```

### 2단계: 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

- 기본 포트: **8080**
- DB 연결: `localhost:3306`, DB명 `basiccrud`, 사용자 `root` / 비밀번호 `password` (또는 위 Docker 예제면 `app` / `password`)
- `application.yml`에서 `spring.datasource` 값으로 조정 가능

### 3단계: 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

- 브라우저에서 **http://localhost:5173** 접속
- Vite 프록시로 `/api` 요청이 `http://localhost:8080`으로 전달됨

### 4단계: 동작 확인

1. http://localhost:5173 접속
2. 회원가입 → 로그인 → 게시판에서 글 작성/수정/삭제, 댓글 작성/삭제

---

## Docker로 실행하기

한 번에 **MySQL + 백엔드 + 프론트엔드**를 띄웁니다.

```bash
cd "/Users/plus-user/Documents/SideProject/Basic CRUD"
docker compose up --build
```

- 프론트엔드: **http://localhost** (80 포트)
- 백엔드 API: **http://localhost:8080**
- MySQL: **localhost:3306** (root 비밀번호: `rootpassword`)

다른 PC에서 접속하려면 해당 머신의 IP로 `http://<IP>` 또는 `http://<IP>:80`으로 접속하면 됩니다.

---

## iPhone 앱으로 실행하기 (Capacitor)

현재 프론트엔드는 Capacitor iOS 프로젝트가 연결되어 있어, 개인용 iPhone 앱으로 바로 빌드할 수 있습니다.

### 1) 사전 준비

- macOS + Xcode 설치
- Node.js **18 이상** (권장: 20 LTS)
- 백엔드 실행 (로컬/도커)

### 2) 프론트엔드 API 주소 설정

iPhone 실기기에서 테스트할 때는 `localhost`가 아닌 PC의 로컬 IP를 사용해야 합니다.

```bash
cd frontend
cp .env.example .env
```

`.env` 예시:

```bash
VITE_API_BASE=http://192.168.0.10:8080
```

### 3) iOS 앱 빌드/동기화

```bash
cd frontend
npm install
npm run ios:build
```

### 4) Xcode 열기 및 실행

```bash
cd frontend
npm run ios:open
```

Xcode에서 Team(서명) 설정 후, 연결된 iPhone 대상으로 Run 하면 됩니다.

### 5) 앱 재실행 시 데이터 유지

- 게시글/댓글: MySQL에 저장되므로 앱을 껐다 켜도 유지
- 로그인 상태: 토큰/유저를 localStorage에 저장하므로 유지
- 단, DB 볼륨 삭제(`docker compose down -v`) 또는 앱 데이터 삭제 시에는 초기화될 수 있음

---

## API 문서

### 인증

| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 내 정보 (JWT 필요) |

### 사용자

| Method | URL | 설명 |
|--------|-----|------|
| PUT | /api/users/me | 내 정보 수정 (JWT 필요) |

### 게시글

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/posts | 목록 (페이징: page, size) |
| GET | /api/posts/{id} | 상세 |
| POST | /api/posts | 작성 |
| PUT | /api/posts/{id} | 수정 |
| DELETE | /api/posts/{id} | 삭제 |

### 댓글

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/posts/{id}/comments | 댓글 목록 |
| POST | /api/comments | 댓글 작성 (body: postId, content) |
| DELETE | /api/comments/{id} | 댓글 삭제 |

---

## curl 예제

아래는 **로컬** 기준이며, Docker 사용 시에는 `http://localhost`로 프론트를 쓰는 경우에도 API는 `http://localhost:8080`으로 호출합니다.

### 1. 회원가입

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"홍길동"}'
```

### 2. 로그인 (토큰 저장)

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.data.token')
echo $TOKEN
```

### 3. 게시글 작성

```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"첫 글","content":"안녕하세요."}'
```

### 4. 게시글 수정

```bash
curl -X PUT http://localhost:8080/api/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"수정된 제목","content":"수정된 내용"}'
```

### 5. 게시글 삭제

```bash
curl -X DELETE http://localhost:8080/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 6. 댓글 작성

```bash
curl -X POST http://localhost:8080/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"postId":1,"content":"댓글 내용"}'
```

---

## DB 스키마 (JPA ddl-auto: update)

- **users**: id, email, password, name, created_at
- **posts**: id, title, content, author_id, created_at
- **comments**: id, post_id, author_id, content, created_at

---

## 설정 (application.yml)

- `server.port`: 8080
- `spring.datasource`: MySQL URL, username, password
- `jwt.secret`, `jwt.expiration-ms`: JWT 설정
- Docker에서는 환경변수로 오버라이드 (docker-compose.yml 참고)

---

이 프로젝트는 주니어 백엔드 개발자 포트폴리오로 활용할 수 있으며, REST API 설계, 인증, DB 설계, CRUD, 프론트 연동, Docker 배포를 한 번에 경험할 수 있습니다.
