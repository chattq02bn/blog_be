# Blog Backend API

Backend cho dự án Blog, xây dựng với **Node.js + Express 5 + TypeScript + Prisma (PostgreSQL)**.

> **Lưu ý:** Backend chạy ở cổng `4000` (tránh xung đột với frontend đang dùng cổng `3000`).

## Công nghệ sử dụng

| Thành phần | Thư viện |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Ngôn ngữ | TypeScript 5.9 (ESM) |
| Database | PostgreSQL + Prisma ORM 7 (driver adapter `@prisma/adapter-pg`) |
| Validation | Zod v4 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Bảo mật | `helmet`, `cors`, `compression` |
| Docs | Swagger UI (`swagger-ui-express`) |

## Cấu trúc thư mục

```
BE/
├── prisma/
│   ├── schema.prisma        # Định nghĩa models (User, Post)
│   └── seed.ts              # Dữ liệu mẫu
├── src/
│   ├── config/              # env.ts (validate biến môi trường), prisma.ts (client)
│   ├── controllers/         # Xử lý request/response
│   ├── docs/                # openapi.ts - tài liệu Swagger
│   ├── middlewares/         # auth, validate, error handler
│   ├── routes/              # Định tuyến API
│   ├── services/            # Business logic
│   ├── types/               # Kiểu dữ liệu dùng chung
│   ├── utils/               # ApiError, asyncHandler, jwt, logger...
│   ├── validations/         # Schema Zod cho từng module
│   ├── app.ts               # Cấu hình Express app
│   └── server.ts            # Entry point + graceful shutdown
├── .env                     # Biến môi trường (không commit)
├── .env.example             # Mẫu biến môi trường
└── prisma.config.ts         # Cấu hình Prisma CLI v7
```

## Yêu cầu

- Node.js >= 20.19
- PostgreSQL đang chạy local (hoặc connection string từ dịch vụ như Supabase, Neon...)

## Các bước chạy dự án

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo database

Tạo database tên `blog_db` trong PostgreSQL (đổi user/password theo máy bạn):

```sql
CREATE DATABASE blog_db;
```

### 3. Cấu hình `.env`

File `.env` đã được tạo sẵn. Chỉnh lại thông tin database cho khớp với PostgreSQL của bạn:

```env
PORT=4000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog_db
JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên >= 32 ký tự>
```

### 4. Tạo Prisma Client và bảng

```bash
npm run prisma:generate     # Sinh Prisma Client vào src/generated/prisma
npm run prisma:migrate      # Tạo bảng (nhập tên migration, ví dụ: init)
```

### 5. Chạy dự án

```bash
# Development (auto reload khi sửa code)
npm run dev

# Production
npm run build
npm start
```

Server chạy tại: `http://localhost:4000/api/v1`

### 6. (Tuỳ chọn) Seed dữ liệu mẫu

```bash
npm run db:seed
```

Tài khoản mẫu (đăng nhập bằng password `Password123!`):

- `admin@blog.dev` (role ADMIN)
- `author@blog.dev` (role USER)

## Truy cập Swagger UI

Sau khi chạy server, mở trình duyệt:

| URL | Mô tả |
|---|---|
| `http://localhost:4000/api-docs` | Giao diện Swagger UI |
| `http://localhost:4000/api-docs.json` | File OpenAPI spec (JSON) |

### Cách dùng Swagger để test API có đăng nhập

1. Gọi `POST /api/v1/auth/login` với email/password (dùng tài khoản seed ở trên).
2. Copy giá trị `accessToken` từ response.
3. Nhấn nút **Authorize** (biểu tượng ổ khóa) góc phải trên → dán token vào → **Authorize**.
4. Từ đó các endpoint có biểu tượng ổ khóa (`GET /auth/me`, `POST /posts`...) sẽ tự gửi kèm header `Authorization: Bearer <token>`.

## Danh sách API chính

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Kiểm tra trạng thái server/database | - |
| POST | `/api/v1/auth/register` | Đăng ký | - |
| POST | `/api/v1/auth/login` | Đăng nhập, trả về access token | - |
| GET | `/api/v1/auth/me` | Thông tin user hiện tại | Bearer |
| GET | `/api/v1/posts?page=&limit=&q=` | Danh sách bài viết (phân trang, tìm kiếm) | - |
| GET | `/api/v1/posts/:id` | Chi tiết bài viết | - |
| POST | `/api/v1/posts` | Tạo bài viết | Bearer |
| PATCH | `/api/v1/posts/:id` | Sửa bài viết (tác giả hoặc ADMIN) | Bearer |
| DELETE | `/api/v1/posts/:id` | Xóa bài viết (tác giả hoặc ADMIN) | Bearer |

## Kết nối Frontend

Frontend (cổng `3000`) gọi API qua địa chỉ `http://localhost:4000/api/v1`. Nếu chạy frontend ở origin khác, thêm vào `.env`:

```env
CORS_ORIGIN=http://localhost:3000
```

(Nhiều origin cách nhau bởi dấu phẩy. Để mặc định `*` cho phép tất cả.)

## Scripts hữu ích

| Lệnh | Chức năng |
|---|---|
| `npm run dev` | Chạy dev server (tsx watch) |
| `npm run dev:nodemon` | Chạy dev server bằng nodemon |
| `npm run build` | Build ra thư mục `dist/` |
| `npm start` | Chạy bản build production |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run prisma:migrate` | Tạo/applied migration mới |
| `npm run prisma:studio` | Mở Prisma Studio xem dữ liệu |
| `npm run db:seed` | Seed dữ liệu mẫu |
