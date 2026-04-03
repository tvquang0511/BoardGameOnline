# BoardGameOnline (Board Game Hub)

BoardGameOnline là đồ án xây dựng **nền tảng chơi mini board-game online** (single-player/AI) theo hướng “game hub”: có **hệ thống tài khoản**, **lưu lịch sử chơi**, **xếp hạng**, **thành tựu**, **kết bạn**, **nhắn tin**, **đánh giá game**, và **admin dashboard** thống kê.

Backend cung cấp REST API (Express + Knex + PostgreSQL) với cơ chế bảo vệ **2 lớp**:
- Tất cả endpoint dưới `/api/*` yêu cầu `x-api-key`
- Các endpoint nhạy cảm yêu cầu thêm `Authorization: Bearer <JWT>`

---

## 1) Giới thiệu đồ án

Mục tiêu:
- Mô phỏng một hệ thống “game platform” đơn giản: game list → play → lưu kết quả → leaderboard/achievement
- Có tính năng social cơ bản (friends + messages) và trang quản trị (admin)
- Tối ưu trải nghiệm chơi: hỗ trợ điều khiển bằng bàn phím, auto-save/continue cho một số game

Các game hiện có (theo seed + frontend engine):
- Caro 4 / Caro 5 (độ khó AI: Easy/Medium/Hard)
- Tic-Tac-Toe
- Snake
- Match-3
- Memory
- Pixel Art
- Sudoku (dạng state/save)

---

## 2) Công nghệ & công cụ đã sử dụng

### 2.1 Công nghệ chính
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui (Radix UI)
- **Routing**: React Router
- **Form/Validation**: React Hook Form + Zod
- **Charts**: Recharts (admin statistics)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Query builder/ORM**: Knex.js
- **Auth**: JWT (Bearer token)
- **API Docs**: Swagger UI (đọc từ `backend/openapi.yaml`)

### 2.2 Công cụ hỗ trợ phát triển
- **Swagger UI**: `GET http://localhost:3000/api-docs`
- **Knex migrations/seeds**: tạo schema & demo data

---

## 3) Tính năng (đầy đủ theo code hiện tại)

Phần này tổng hợp theo backend routes/controllers và frontend routes/pages.

### 3.1 Auth & tài khoản
- Đăng ký / đăng nhập / đăng xuất
- `GET /api/auth/me`: lấy thông tin user + profile
- JWT lưu ở client (localStorage) và tự attach vào request

### 3.2 Hồ sơ người chơi (Profile)
- Xem/cập nhật profile của tôi: display name, bio, avatar (URL), settings
- Thống kê cá nhân:
  - Tổng quan stats (`/api/profiles/me/stats`)
  - Top achievements (`/api/profiles/me/top-achievements`)
  - Favorite games (`/api/profiles/me/favorite-games`)
  - Global rank của bản thân (`/api/profiles/me/global-rank`)

### 3.3 Games hub + chơi game
- Danh sách game (active mặc định) + xem chi tiết theo `slug`
- Bắt đầu chơi game theo URL `/games/:gameSlug`
- Điều khiển bằng phím (↑↓←→, Enter, Back/Esc, Help)
- Một số game có:
  - Giới hạn thời gian theo ván hoặc theo lượt
  - AI local cho Caro (Easy/Medium/Hard)

### 3.4 Sessions, lịch sử chơi, điểm/level
- Start session (`POST /api/sessions/start`) khi bắt đầu chơi
- Finish session (`POST /api/sessions/:id/finish`) khi kết thúc → ghi `game_results`, cộng điểm/level
- Recent games của tôi (`GET /api/games/me/recent`)
- Most played của tôi (`GET /api/games/me/most-played`)

### 3.5 Lưu game (Saved games)
- Lưu state theo user/game (phục vụ continue)
- Auto-save khi rời ván (frontend dùng name `__autosave__`)
- API: list/create/get/delete dưới `/api/saved-games`

### 3.6 Đánh giá game (Game reviews)
- Xem danh sách review + thống kê rating theo game (public)
- User đăng nhập có thể tạo/cập nhật/xóa review (mỗi user tối đa 1 review / game)
- Backend tự cập nhật `average_rating` + `review_count`

### 3.7 Achievements (thành tựu)
- Xem catalog thành tựu (public)
- Xem danh sách thành tựu của tôi + tiến độ
- Trigger check/unlock khi:
  - Kết thúc ván (cập nhật điểm, win streak, total games, …)
  - Chấp nhận kết bạn
- Có endpoint “recheck” để tính lại theo dữ liệu hiện có

### 3.8 Friends (kết bạn)
- Danh sách bạn bè (pagination)
- Incoming/outgoing friend requests
- Suggestions + search theo username/display name/email
- Hành động: gửi lời mời, accept/reject/cancel, unfriend

### 3.9 Messages (nhắn tin)
- Inbox theo friend list (contacts)
- Nhắn tin 1-1 (polling, không realtime)
- Chỉ cho phép nhắn tin với bạn bè
- Mark read

### 3.10 Leaderboard / Ranking
- Xếp hạng theo:
  - Tổng điểm tích lũy (profile points)
  - Hoặc tổng điểm theo từng game (khi truyền `gameSlug`)
- Scope: `global`, `friends`, `me` (personal stats)
- Có phân trang cho bảng xếp hạng

### 3.11 Admin (role = admin)
- Quản lý user: list/search, tạo, cập nhật (enable/disable, đổi email/pass/display_name), xóa
- Quản lý game: cập nhật name/description/status/default_config
- Dashboard thống kê:
  - Summary stats (users / sessions / top games)
  - DAU theo ngày
  - Sessions theo giờ
  - Phân bố lượt chơi theo game
  - Activity log (auth sessions + game sessions)

---

## 4) UI (Frontend pages)

Các route chính trên frontend:
- Auth: `/login`, `/register`
- Client:
  - Dashboard: `/`
  - Chọn game: `/games-list`
  - Chơi game: `/games/:gameSlug`
  - Profile: `/profile`, `/profile/edit`, `/appearance`
  - Friends: `/friends`
  - Messages: `/messages`
  - Achievements: `/achievements`
  - Ranking: `/ranking`
- Admin:
  - `/admin`, `/admin/users`, `/admin/statistics`, `/admin/games`

---

## 5) Diagrams (GitHub-friendly)

```mermaid
flowchart LR
  FE[Frontend\nReact + Vite] -->|HTTP + JSON\n(x-api-key + Bearer JWT)| API[Backend API\nExpress + Knex]
  API --> DB[(PostgreSQL)]
  API --> DOCS[Swagger UI\n/api-docs]
```

---

## 6) API docs (Swagger / OpenAPI)

- Swagger UI: `http://localhost:3000/api-docs`
- Source OpenAPI: `backend/openapi.yaml`

Ghi chú bảo mật:
- Tất cả request vào `/api/*` cần header `x-api-key`
- Endpoint cần đăng nhập cần thêm `Authorization: Bearer <token>`

---

## 7) Chạy project (dev)

### 7.1 Yêu cầu
- Node.js (khuyến nghị >= 18)
- PostgreSQL

### 7.2 Cấu hình `.env`

Backend: tạo file `backend/.env` với tối thiểu:
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# chọn 1 trong 2 cách cấu hình DB
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
# hoặc
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=board_game
# DB_USER=postgres
# DB_PASSWORD=postgres

API_KEY=your_api_key
```

Frontend: tạo file `frontend/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_KEY=your_api_key
```

### 7.3 Migrate + seed database

```bash
cd backend
npm install
npm run migrate:up
npm run seed:run
```

Seed sẽ tạo demo data (users/games/achievements/friends/messages/results). Ví dụ tài khoản:
- Admin: `admin@game.com` / `123456`
- User: `alice@example.com` / `123456`

### 7.4 Chạy backend

```bash
cd backend
npm run dev
```

Mặc định:
- API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`

### 7.5 Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Mở app: `http://localhost:5173`

---

## 8) Troubleshooting nhanh

- `401 Missing x-api-key`: kiểm tra `API_KEY` (backend) và `VITE_API_KEY` (frontend) đang khớp.
- `401 Missing Bearer token`: login trước để frontend lưu token (localStorage).
- Lỗi DB connection: kiểm tra `DATABASE_URL` hoặc `DB_*` và đảm bảo PostgreSQL đang chạy.
