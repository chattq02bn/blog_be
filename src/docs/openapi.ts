const AuthUser = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    email: { type: "string", format: "email", example: "admin@blog.dev" },
    name: { type: "string", nullable: true, example: "Admin" },
    role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
  },
  required: ["id", "email", "role"],
} as const;

const Post = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    title: { type: "string", example: "Getting started with Express 5" },
    slug: { type: "string", example: "getting-started-with-express-5-abc123" },
    content: { type: "string", example: "Express 5 brings async error handling..." },
    published: { type: "boolean", example: true },
    authorId: { type: "integer", example: 1 },
    author: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        name: { type: "string", nullable: true, example: "Author" },
        email: { type: "string", format: "email", example: "author@blog.dev" },
      },
      required: ["id", "email"],
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "slug", "content", "published", "authorId"],
} as const;

const PaginationMeta = {
  type: "object",
  properties: {
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    total: { type: "integer", example: 42 },
    totalPages: { type: "integer", example: 5 },
  },
  required: ["page", "limit", "total", "totalPages"],
} as const;

const badRequest = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const jsonBody = (schemaName: string) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schemaName}` },
    },
  },
});

const okJson = (description: string, schemaRef?: string) => ({
  description,
  ...(schemaRef
    ? { content: { "application/json": { schema: { $ref: `#/components/schemas/${schemaRef}` } } } }
    : {}),
});

const bearer = [{ bearerAuth: [] }];

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Blog API",
    version: "1.0.0",
    description:
      "Backend API cho blog, xây dựng với Node.js, Express 5, TypeScript và Prisma (PostgreSQL).",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "System", description: "Health check" },
    { name: "Auth", description: "Đăng ký, đăng nhập, thông tin người dùng" },
    { name: "Posts", description: "Quản lý bài viết" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token nhận từ POST /auth/login",
      },
    },
    schemas: {
      RegisterInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50, example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "Password123!" },
        },
        required: ["name", "email", "password"],
      },
      LoginInput: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "admin@blog.dev" },
          password: { type: "string", example: "Password123!" },
        },
        required: ["email", "password"],
      },
      CreatePostInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200, example: "Bài viết mới" },
          content: { type: "string", example: "Nội dung bài viết..." },
          published: { type: "boolean", default: false },
        },
        required: ["title", "content"],
      },
      UpdatePostInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          content: { type: "string" },
          published: { type: "boolean" },
        },
        minProperties: 1,
      },
      AuthUser,
      Post,
      PaginationMeta,
    },
  },
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["System"],
        summary: "Kiểm tra trạng thái server và database",
        responses: {
          "200": {
            description: "Server đang hoạt động",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "ok" },
                        database: { type: "string", enum: ["up", "down"] },
                        uptime: { type: "number", example: 123.45 },
                        timestamp: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản mới",
        requestBody: jsonBody("RegisterInput"),
        responses: {
          "201": okJson("Đăng ký thành công", "AuthUser"),
          "409": badRequest("Email đã được đăng ký"),
          "422": badRequest("Dữ liệu không hợp lệ"),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập, nhận access token",
        requestBody: jsonBody("LoginInput"),
        responses: {
          "200": {
            description: "Đăng nhập thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/AuthUser" },
                        accessToken: { type: "string", example: "eyJhbGciOi..." },
                      },
                      required: ["user", "accessToken"],
                    },
                  },
                },
              },
            },
          },
          "401": badRequest("Email hoặc mật khẩu không đúng"),
          "422": badRequest("Dữ liệu không hợp lệ"),
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Thông tin người dùng hiện tại",
        security: bearer,
        responses: {
          "200": okJson("Thông tin user từ token", "AuthUser"),
          "401": badRequest("Thiếu hoặc sai token"),
        },
      },
    },
    "/api/v1/posts": {
      get: {
        tags: ["Posts"],
        summary: "Danh sách bài viết (phân trang + tìm kiếm)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Tìm kiếm theo title/content" },
          { name: "authorId", in: "query", schema: { type: "integer" } },
          { name: "published", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          "200": {
            description: "Danh sách bài viết",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Post" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "422": badRequest("Query parameters không hợp lệ"),
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Tạo bài viết mới",
        security: bearer,
        requestBody: jsonBody("CreatePostInput"),
        responses: {
          "201": okJson("Tạo thành công", "Post"),
          "401": badRequest("Chưa đăng nhập"),
          "422": badRequest("Dữ liệu không hợp lệ"),
        },
      },
    },
    "/api/v1/posts/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
      ],
      get: {
        tags: ["Posts"],
        summary: "Chi tiết bài viết",
        responses: {
          "200": okJson("Chi tiết bài viết", "Post"),
          "404": badRequest("Không tìm thấy bài viết"),
          "422": badRequest("Id không hợp lệ"),
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Cập nhật bài viết (chỉ tác giả hoặc ADMIN)",
        security: bearer,
        requestBody: jsonBody("UpdatePostInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "Post"),
          "401": badRequest("Chưa đăng nhập"),
          "403": badRequest("Không có quyền sửa bài viết này"),
          "404": badRequest("Không tìm thấy bài viết"),
          "422": badRequest("Dữ liệu không hợp lệ"),
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Xóa bài viết (chỉ tác giả hoặc ADMIN)",
        security: bearer,
        responses: {
          "200": okJson("Xóa thành công"),
          "401": badRequest("Chưa đăng nhập"),
          "403": badRequest("Không có quyền xóa bài viết này"),
          "404": badRequest("Không tìm thấy bài viết"),
        },
      },
    },
  },
};
