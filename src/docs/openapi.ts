const AuthUser = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    email: { type: "string", format: "email", example: "admin@note.com" },
    name: { type: "string", nullable: true, example: "Admin" },
    role: { type: "string", enum: ["USER", "ADMIN"], example: "ADMIN" },
  },
  required: ["id", "email", "role"],
} as const;

const UserProfile = {
  type: "object",
  properties: {
    id: { type: "string", example: "1" },
    email: { type: "string", format: "email", example: "admin@note.com" },
    name: { type: "string", nullable: true, example: "Admin" },
    role: { type: "string", enum: ["user", "admin"], example: "admin" },
    avatar: { type: "string", nullable: true },
    logoName: { type: "string", nullable: true, example: "MyBlog" },
    description: { type: "string", nullable: true, example: "Blog cá nhân về lập trình" },
    postsCount: { type: "integer", example: 12 },
    commentsCount: { type: "integer", example: 8 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "email", "role"],
} as const;

const TagRef = {
  type: "object",
  properties: {
    id: { type: "string", example: "cmt8rs4j9001b57pcpp7h45ec" },
    name: { type: "string", example: "TypeScript" },
  },
  required: ["id", "name"],
} as const;

const AuthorRef = {
  type: "object",
  nullable: true,
  properties: {
    id: { type: "integer", example: 2 },
    name: { type: "string", nullable: true, example: "Lan" },
    email: { type: "string", format: "email", example: "author@note.com" },
    avatar: { type: "string", nullable: true },
  },
  required: ["id", "email"],
} as const;

const Post = {
  type: "object",
  properties: {
    id: { type: "string", example: "cmt8rs4j9001b57pcpp7h45ec" },
    title: { type: "string", example: "Tái chế đồ cũ trong nhà: bắt đầu từ hũ thủy tinh" },
    slug: { type: "string", example: "tai-che-do-cu-trong-nha-bat-dau-tu-hu-thuy-tinh-c" },
    excerpt: { type: "string", nullable: true, example: "Đừng vội vất vễu thủy tinh..." },
    cover: { type: "string", nullable: true, example: "https://picsum.photos/seed/post-12/1280/670" },
    bodyBlocks: {
      type: "array",
      description: "Nội dung bài viết dạng blocks (BlockNote JSON)",
      items: {
        type: "object",
        additionalProperties: true,
        example: { type: "paragraph", content: "Chỉ cần nước ấm..." },
      },
    },
    status: { type: "string", enum: ["draft", "published"], example: "published" },
    likes: { type: "integer", example: 5 },
    bookmarks: { type: "integer", example: 3 },
    commentsCount: { type: "integer", example: 4 },
    sectionId: { type: "string", nullable: true, example: "cmt8rs4j9zzz" },
    topicIds: { type: "array", items: { type: "string" } },
    tagIds: { type: "array", items: { type: "string" } },
    topics: { type: "array", items: { $ref: "#/components/schemas/TagRef" } },
    tags: { type: "array", items: { $ref: "#/components/schemas/TagRef" } },
    author: { $ref: "#/components/schemas/AuthorRef" },
    authorAvatar: { type: "string", nullable: true },
    authorName: { type: "string", example: "Lan" },
    date: { type: "string", example: "2026-08-25", description: "YYYY-MM-DD từ createdAt" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "title", "slug", "bodyBlocks", "status", "likes", "bookmarks"],
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

const TopicSummary = {
  type: "object",
  properties: {
    id: { type: "string", example: "cmt8rs4j9001topic01" },
    name: { type: "string", example: "Lifestyle" },
    description: { type: "string", nullable: true, example: "Đời sống & thói quen xanh" },
    postCount: { type: "integer", example: 7 },
  },
  required: ["id", "name", "postCount"],
} as const;

const Section = {
  type: "object",
  properties: {
    id: { type: "string", example: "cmt8rs4j9001sect01" },
    slug: { type: "string", example: "zero-waste" },
    title: { type: "string", example: "Sống tối giản" },
    description: { type: "string", example: "Các bài viết về giảm rác thải" },
    idx: { type: "integer", example: 0 },
    posts: { type: "array", items: { $ref: "#/components/schemas/Post" } },
  },
  required: ["id", "slug", "title", "idx", "posts"],
} as const;

const CommentReactionCount = {
  type: "object",
  properties: {
    emoji: { type: "string", example: "👍" },
    count: { type: "integer", example: 3 },
  },
  required: ["emoji", "count"],
} as const;

const Comment = {
  type: "object",
  properties: {
    id: { type: "string", example: "cmt8rs4j9001cmt001" },
    noteId: { type: "string", example: "cmt8rs4j9001b57pcpp7h45ec", description: "Id bài viết" },
    parentId: { type: "string", nullable: true },
    authorId: { type: "integer", nullable: true, description: "null nếu là khách" },
    author: { type: "string", example: "Minh" },
    authorAvatar: { type: "string", nullable: true },
    content: { type: "string", example: "Bài viết rất hữu ích!" },
    isEdited: { type: "boolean", example: false },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    reactions: { type: "array", items: { $ref: "#/components/schemas/CommentReactionCount" } },
    myReactions: {
      type: "array",
      description: "Emoji mà viewer hiện tại đã thả",
      items: { type: "string" },
      example: ["👍"],
    },
  },
  required: ["id", "noteId", "author", "content", "isEdited", "reactions", "myReactions"],
} as const;

const SidebarNode = {
  type: "object",
  description: "Item sidebar dạng cây (chỉ 2 cấp)",
  properties: {
    id: { type: "string" },
    name: { type: "string", example: "Frontend" },
    slug: { type: "string", example: "frontend" },
    description: { type: "string", nullable: true },
    idx: { type: "integer", example: 0 },
    topicIds: { type: "array", items: { type: "string" } },
    children: {
      type: "array",
      items: { $ref: "#/components/schemas/SidebarNode" },
    },
  },
  required: ["id", "name", "slug", "idx", "topicIds", "children"],
} as const;

const badRequest = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const unauthorized = () => badRequest("Chưa đăng nhập / token không hợp lệ");
const forbidden = () => badRequest("Không có quyền thực hiện (yêu cầu ADMIN)");
const notFound = (what: string) => badRequest(`Không tìm thấy ${what}`);
const validation = () => badRequest("Dữ liệu không hợp lệ");

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
    version: "1.1.0",
    description:
      "Backend API cho blog, xây dựng với Node.js, Express 5, TypeScript và Prisma 7 (PostgreSQL). " +
      "Tài khoản mẫu sau khi seed: admin@note.com / Password123! (role ADMIN).",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "System", description: "Health check" },
    { name: "Auth", description: "Đăng ký, đăng nhập, refresh token" },
    { name: "Posts", description: "Quản lý bài viết, like/bookmark" },
    { name: "Comments", description: "Bình luận (kể cả khách) + reaction emoji" },
    { name: "Topics", description: "Chủ đề và sections theo chủ đề" },
    { name: "Tags", description: "Quản lý thẻ bài viết" },
    { name: "Users", description: "Quản lý người dùng (ADMIN)" },
    { name: "Sidebar", description: "Cây menu sidebar" },
    { name: "Upload", description: "Cấu hình & upload file (Cloudinary / Mega)" },
    { name: "Stats", description: "Thống kê lượt truy cập" },
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
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          details: {
            type: "object",
            nullable: true,
            description: "Chi tiết lỗi (formErrors/fieldErrors khi 422)",
          },
        },
        required: ["success", "message"],
      },
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
          email: { type: "string", format: "email", example: "admin@note.com" },
          password: { type: "string", example: "Password123!" },
        },
        required: ["email", "password"],
      },
      RefreshInput: {
        type: "object",
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
        },
        required: ["refreshToken"],
      },
      TokenPair: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          accessToken: { type: "string", example: "eyJhbGciOi..." },
          refreshToken: { type: "string", example: "eyJhbGciOi..." },
        },
        required: ["user", "accessToken", "refreshToken"],
      },
      CreatePostInput: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200, example: "Bài viết mới" },
          excerpt: { type: "string", maxLength: 500 },
          cover: { type: "string", description: "URL hoặc data-uri ảnh bìa" },
          bodyBlocks: {
            type: "array",
            items: { type: "object", additionalProperties: true },
            default: [],
            example: [{ type: "paragraph", content: "Xin chào!" }],
          },
          status: { type: "string", enum: ["draft", "published"], default: "draft" },
          topicIds: { type: "array", items: { type: "string" }, default: [] },
          tagIds: { type: "array", items: { type: "string" }, default: [] },
          sectionId: { type: "string", nullable: true },
        },
        required: ["title"],
      },
      UpdatePostInput: {
        type: "object",
        minProperties: 1,
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          excerpt: { type: "string", maxLength: 500 },
          cover: { type: "string" },
          bodyBlocks: { type: "array", items: { type: "object", additionalProperties: true } },
          status: { type: "string", enum: ["draft", "published"] },
          topicIds: { type: "array", items: { type: "string" } },
          tagIds: { type: "array", items: { type: "string" } },
          sectionId: { type: "string", nullable: true },
        },
      },
      ToggleActionInput: {
        type: "object",
        properties: {
          active: { type: "boolean", default: true, description: "true = tăng, false = giảm" },
        },
      },
      CreateTopicInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100, example: "Lifestyle" },
          description: { type: "string", maxLength: 2000 },
        },
        required: ["name"],
      },
      UpdateTopicInput: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          description: { type: "string", maxLength: 2000 },
        },
      },
      CreateTagInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 60, example: "Docker" },
        },
        required: ["name"],
      },
      ReplaceTagsInput: {
        type: "object",
        description:
          "Đồng bộ toàn bộ danh sách tag: tag có id được giữ/cập nhật, tag thiếu id sẽ bị XÓA khỏi hệ thống",
        properties: {
          tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string", minLength: 1, maxLength: 60 },
              },
              required: ["name"],
            },
          },
        },
        required: ["tags"],
      },
      UpdateTagInput: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 60 },
        },
      },
      CreateCommentInput: {
        type: "object",
        description:
          "User đã đăng nhập: bỏ qua authorName/authorAvatar (lấy từ hồ sơ). Khách: bắt buộc authorName.",
        properties: {
          content: { type: "string", minLength: 1, maxLength: 2000, example: "Bài viết hay quá!" },
          parentId: { type: "string", nullable: true, description: "Trả lời comment khác" },
          authorName: { type: "string", maxLength: 80, example: "Khách A" },
          authorAvatar: { type: "string" },
        },
        required: ["content"],
      },
      UpdateCommentInput: {
        type: "object",
        description: "Khách sửa comment của mình phải gửi đúng authorName đã dùng khi tạo",
        properties: {
          content: { type: "string", minLength: 1, maxLength: 2000 },
          authorName: { type: "string", maxLength: 80 },
        },
        required: ["content"],
      },
      DeleteCommentInput: {
        type: "object",
        description: "Khách xóa comment của mình phải gửi đúng authorName đã dùng khi tạo",
        properties: {
          authorName: { type: "string", maxLength: 80 },
        },
      },
      ReactionInput: {
        type: "object",
        properties: {
          emoji: {
            type: "string",
            enum: ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🙏"],
            example: "👍",
          },
        },
        required: ["emoji"],
      },
      CreateUserInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50, example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "Password123!" },
          role: { type: "string", enum: ["USER", "ADMIN"], default: "USER" },
          avatar: { type: "string", maxLength: 2048 },
        },
        required: ["name", "email", "password"],
      },
      UpdateUserInput: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 72 },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          avatar: { type: "string", maxLength: 2048 },
        },
      },
      UpdateProfileInput: {
        type: "object",
        description: "Tự cập nhật hồ sơ (các trường nhạy cảm bị bỏ qua)",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 50 },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          avatar: { type: "string" },
          logoName: { type: "string", maxLength: 60, example: "MyBlog" },
          description: { type: "string", maxLength: 2000 },
        },
      },
      SidebarItemInput: {
        type: "object",
        description: "Ghi đè toàn bộ sidebar. Item con chỉ hỗ trợ 1 cấp (children).",
        properties: {
          id: { type: "string", description: "Giữ nguyên id nếu muốn bảo tồn record cũ" },
          name: { type: "string", minLength: 1, maxLength: 120, example: "Frontend" },
          slug: { type: "string", minLength: 1, maxLength: 255, example: "frontend" },
          description: { type: "string", maxLength: 500 },
          idx: { type: "integer", default: 0 },
          topicIds: { type: "array", items: { type: "string" }, default: [] },
          children: {
            type: "array",
            items: { $ref: "#/components/schemas/SidebarItemInput" },
          },
        },
        required: ["name", "slug"],
      },
      AuthUser,
      UserProfile,
      TagRef,
      AuthorRef,
      Post,
      PaginationMeta,
      TopicSummary,
      Section,
      Comment,
      SidebarNode,
      UploadConfig: {
        type: "object",
        properties: {
          cloudinary: {
            type: "object",
            properties: {
              cloudName: { type: "string", example: "dkqyptupf" },
              apiKey: { type: "string", example: "923633263214567" },
              apiSecret: { type: "string" },
              folder: { type: "string", example: "blog" },
            },
            required: ["cloudName", "apiKey", "apiSecret", "folder"],
          },
          mega: {
            type: "object",
            properties: {
              email: { type: "string", format: "email" },
              password: { type: "string" },
            },
            required: ["email", "password"],
          },
        },
        required: ["cloudinary", "mega"],
      },
      UploadResult: {
        type: "object",
        properties: {
          url: { type: "string", example: "https://res.cloudinary.com/..." },
          bytes: { type: "integer", example: 102400 },
          format: { type: "string", example: "jpg" },
          originalFilename: { type: "string", example: "avatar.jpg" },
        },
        required: ["url", "bytes", "format", "originalFilename"],
      },
    },
  },
  paths: {
    /* ================= SYSTEM ================= */
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

    /* ================= AUTH ================= */
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản mới",
        requestBody: jsonBody("RegisterInput"),
        responses: {
          "201": okJson("Đăng ký thành công"),
          "409": badRequest("Email đã được đăng ký"),
          "422": validation(),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập, nhận access + refresh token",
        requestBody: jsonBody("LoginInput"),
        responses: {
          "200": okJson("Đăng nhập thành công", "TokenPair"),
          "401": badRequest("Email hoặc mật khẩu không đúng"),
          "422": validation(),
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Làm mới access token bằng refresh token",
        requestBody: jsonBody("RefreshInput"),
        responses: {
          "200": okJson("Cấp lại token thành công", "TokenPair"),
          "401": badRequest("Refresh token không hợp lệ hoặc hết hạn"),
          "422": validation(),
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
          "401": unauthorized(),
        },
      },
    },

    /* ================= POSTS ================= */
    "/api/v1/posts": {
      get: {
        tags: ["Posts"],
        summary: "Danh sách bài viết (phân trang + lọc + tìm kiếm)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            description: "Tìm kiếm trong title/excerpt (không phân biệt hoa thường)",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["draft", "published"] },
          },
          { name: "topicId", in: "query", schema: { type: "string" } },
          {
            name: "topicIds",
            in: "query",
            schema: { type: "string" },
            description: "Danh sách topic id phân tách bởi dấu phẩy (VD: id1,id2)",
          },
          { name: "tagId", in: "query", schema: { type: "string" } },
          { name: "sectionId", in: "query", schema: { type: "string" } },
          { name: "authorId", in: "query", schema: { type: "integer" } },
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
          "422": validation(),
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Tạo bài viết mới",
        security: bearer,
        requestBody: jsonBody("CreatePostInput"),
        responses: {
          "201": okJson("Tạo thành công", "Post"),
          "401": unauthorized(),
          "422": validation(),
        },
      },
    },
    "/api/v1/posts/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 1 },
          description: "Id (cuid) hoặc slug của bài viết",
        },
      ],
      get: {
        tags: ["Posts"],
        summary: "Chi tiết bài viết",
        responses: {
          "200": okJson("Chi tiết bài viết", "Post"),
          "404": notFound("bài viết"),
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Cập nhật bài viết (chỉ tác giả hoặc ADMIN)",
        security: bearer,
        requestBody: jsonBody("UpdatePostInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "Post"),
          "401": unauthorized(),
          "403": badRequest("Không có quyền sửa bài viết này"),
          "404": notFound("bài viết"),
          "422": validation(),
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Xóa bài viết (chỉ tác giả hoặc ADMIN)",
        security: bearer,
        responses: {
          "200": okJson("Xóa thành công"),
          "401": unauthorized(),
          "403": badRequest("Không có quyền xóa bài viết này"),
          "404": notFound("bài viết"),
        },
      },
    },
    "/api/v1/posts/{id}/{action}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 1 },
          description: "Id hoặc slug của bài viết",
        },
        {
          name: "action",
          in: "path",
          required: true,
          schema: { type: "string", enum: ["like", "bookmark"] },
        },
      ],
      post: {
        tags: ["Posts"],
        summary: "Tăng/giảm like hoặc bookmark (không cần đăng nhập)",
        requestBody: jsonBody("ToggleActionInput"),
        responses: {
          "200": {
            description: "Kết quả sau khi cập nhật",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        likes: { type: "integer" },
                        bookmarks: { type: "integer" },
                        active: { type: "boolean" },
                      },
                      required: ["id", "likes", "bookmarks", "active"],
                    },
                  },
                },
              },
            },
          },
          "404": notFound("bài viết"),
          "422": validation(),
        },
      },
    },

    /* ================= COMMENTS ================= */
    "/api/v1/comments/post/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 1 },
          description: "Id (cuid) hoặc slug của bài viết",
        },
      ],
      get: {
        tags: ["Comments"],
        summary: "Toàn bộ bình luận của bài viết (danh sách phẳng, client tự dựng cây)",
        security: bearer,
        responses: {
          "200": {
            description: "Danh sách bình luận",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                  },
                },
              },
            },
          },
          "404": notFound("bài viết"),
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Tạo bình luận (đã đăng nhập hoặc khách)",
        security: bearer,
        requestBody: jsonBody("CreateCommentInput"),
        responses: {
          "201": okJson("Tạo bình luận thành công", "Comment"),
          "400": badRequest("Khách bình luận nhưng thiếu authorName / parentId không thuộc bài viết"),
          "404": notFound("bài viết"),
          "422": validation(),
        },
      },
    },
    "/api/v1/comments/{id}/replies": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id comment cha" },
      ],
      get: {
        tags: ["Comments"],
        summary: "Danh sách trả lời của một bình luận",
        security: bearer,
        responses: {
          "200": okJson("Danh sách trả lời", "Comment"),
          "404": notFound("bình luận"),
        },
      },
    },
    "/api/v1/comments/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id comment" },
      ],
      patch: {
        tags: ["Comments"],
        summary: "Sửa bình luận (tác giả comment, ADMIN, hoặc khách khớp authorName)",
        security: bearer,
        requestBody: jsonBody("UpdateCommentInput"),
        responses: {
          "200": okJson("Sửa thành công", "Comment"),
          "401": badRequest("Không có quyền sửa bình luận này"),
          "403": badRequest("Không có quyền sửa bình luận này"),
          "404": notFound("bình luận"),
          "422": validation(),
        },
      },
      delete: {
        tags: ["Comments"],
        summary: "Xóa bình luận (khách gửi kèm authorName trong body để xác nhận)",
        security: bearer,
        requestBody: jsonBody("DeleteCommentInput"),
        responses: {
          "200": okJson("Xóa thành công"),
          "401": badRequest("Không có quyền xóa bình luận này"),
          "403": badRequest("Không có quyền xóa bình luận này"),
          "404": notFound("bình luận"),
        },
      },
    },
    "/api/v1/comments/{id}/reactions": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id comment" },
      ],
      post: {
        tags: ["Comments"],
        summary: "Thả / bỏ reaction emoji cho bình luận (toggle, yêu cầu đăng nhập)",
        security: bearer,
        requestBody: jsonBody("ReactionInput"),
        responses: {
          "200": {
            description: "Comment sau khi toggle kèm trạng thái active",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        comment: { $ref: "#/components/schemas/Comment" },
                        active: { type: "boolean" },
                      },
                      required: ["comment", "active"],
                    },
                  },
                },
              },
            },
          },
          "401": unauthorized(),
          "404": notFound("bình luận"),
          "422": validation(),
        },
      },
    },

    /* ================= TOPICS ================= */
    "/api/v1/topics": {
      get: {
        tags: ["Topics"],
        summary: "Danh sách chủ đề (kèm số bài viết)",
        responses: {
          "200": {
            description: "Danh sách chủ đề",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/TopicSummary" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Topics"],
        summary: "Tạo chủ đề mới (ADMIN)",
        security: bearer,
        requestBody: jsonBody("CreateTopicInput"),
        responses: {
          "201": okJson("Tạo thành công", "TopicSummary"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
    },
    "/api/v1/topics/sections": {
      get: {
        tags: ["Topics"],
        summary: "Các section của nhiều chủ đề một lúc (kèm bài viết đã xuất bản)",
        parameters: [
          {
            name: "slugs",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 1 },
            description: "Danh sách topicSlug phân tách bởi dấu phẩy (VD: song-mot-minh,ca-phe-tai-nha)",
          },
        ],
        responses: {
          "200": {
            description: "Danh sách section theo thứ tự slugs yêu cầu",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Section" } },
                  },
                },
              },
            },
          },
          "422": validation(),
        },
      },
    },
    "/api/v1/topics/{slug}/sections": {
      parameters: [
        { name: "slug", in: "path", required: true, schema: { type: "string", minLength: 1 }, description: "Slug của section-group (topicSlug)" },
      ],
      get: {
        tags: ["Topics"],
        summary: "Các section thuộc một chủ đề (kèm bài viết đã xuất bản)",
        responses: {
          "200": {
            description: "Danh sách section",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Section" } },
                  },
                },
              },
            },
          },
          "404": notFound("section cho chủ đề này"),
        },
      },
    },
    "/api/v1/topics/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id chủ đề" },
      ],
      patch: {
        tags: ["Topics"],
        summary: "Cập nhật chủ đề (ADMIN)",
        security: bearer,
        requestBody: jsonBody("UpdateTopicInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "TopicSummary"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("chủ đề"),
          "422": validation(),
        },
      },
      delete: {
        tags: ["Topics"],
        summary: "Xóa chủ đề (ADMIN)",
        security: bearer,
        responses: {
          "200": okJson("Xóa thành công"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("chủ đề"),
        },
      },
    },

    /* ================= TAGS ================= */
    "/api/v1/tags": {
      get: {
        tags: ["Tags"],
        summary: "Danh sách thẻ",
        responses: {
          "200": {
            description: "Danh sách thẻ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TagRef" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Tags"],
        summary: "Tạo thẻ mới (ADMIN) — trả về thẻ cũ nếu tên đã tồn tại",
        security: bearer,
        requestBody: jsonBody("CreateTagInput"),
        responses: {
          "201": okJson("Tạo thành công", "TagRef"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
      put: {
        tags: ["Tags"],
        summary: "Đồng bộ toàn bộ danh sách thẻ (ADMIN) — thẻ không có trong danh sách sẽ bị xóa",
        security: bearer,
        requestBody: jsonBody("ReplaceTagsInput"),
        responses: {
          "200": okJson("Danh sách thẻ sau khi đồng bộ", "TagRef"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
    },
    "/api/v1/tags/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id thẻ" },
      ],
      patch: {
        tags: ["Tags"],
        summary: "Đổi tên thẻ (ADMIN)",
        security: bearer,
        requestBody: jsonBody("UpdateTagInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "TagRef"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("thẻ"),
          "409": badRequest("Tên thẻ đã tồn tại"),
          "422": validation(),
        },
      },
      delete: {
        tags: ["Tags"],
        summary: "Xóa thẻ (ADMIN)",
        security: bearer,
        responses: {
          "200": okJson("Xóa thành công"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("thẻ"),
        },
      },
    },

    /* ================= USERS ================= */
    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "Danh sách người dùng (ADMIN)",
        security: bearer,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Tìm theo name/email" },
          { name: "role", in: "query", schema: { type: "string", enum: ["USER", "ADMIN"] } },
        ],
        responses: {
          "200": {
            description: "Danh sách người dùng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/UserProfile" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
      post: {
        tags: ["Users"],
        summary: "Tạo người dùng mới (ADMIN)",
        security: bearer,
        requestBody: jsonBody("CreateUserInput"),
        responses: {
          "201": okJson("Tạo thành công", "UserProfile"),
          "401": unauthorized(),
          "403": forbidden(),
          "409": badRequest("Email đã được sử dụng"),
          "422": validation(),
        },
      },
    },
    "/api/v1/users/me": {
      get: {
        tags: ["Users"],
        summary: "Hồ sơ cá nhân (hiện tại yêu cầu ADMIN do middleware router-level)",
        security: bearer,
        responses: {
          "200": okJson("Hồ sơ người dùng", "UserProfile"),
          "401": unauthorized(),
          "403": forbidden(),
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Cập nhật hồ sơ cá nhân (hiện tại yêu cầu ADMIN do middleware router-level)",
        security: bearer,
        requestBody: jsonBody("UpdateProfileInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "UserProfile"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
    },
    "/api/v1/users/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
      ],
      get: {
        tags: ["Users"],
        summary: "Chi tiết người dùng (ADMIN)",
        security: bearer,
        responses: {
          "200": okJson("Thông tin người dùng", "UserProfile"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("người dùng"),
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Cập nhật người dùng (ADMIN)",
        security: bearer,
        requestBody: jsonBody("UpdateUserInput"),
        responses: {
          "200": okJson("Cập nhật thành công", "UserProfile"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("người dùng"),
          "409": badRequest("Email đã được sử dụng"),
          "422": validation(),
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Xóa người dùng (ADMIN, không thể tự xóa chính mình)",
        security: bearer,
        responses: {
          "200": okJson("Xóa thành công"),
          "400": badRequest("Không thể tự xóa tài khoản của chính mình"),
          "401": unauthorized(),
          "403": forbidden(),
          "404": notFound("người dùng"),
        },
      },
    },

    /* ================= SIDEBAR ================= */
    "/api/v1/sidebar": {
      get: {
        tags: ["Sidebar"],
        summary: "Cây sidebar (sắp xếp theo idx)",
        responses: {
          "200": {
            description: "Danh sách item gốc kèm children",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/SidebarNode" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Sidebar"],
        summary: "Tạo mục sidebar mới (đẩy idx hiện tại lên 1, item mới idx = 0)",
        security: bearer,
        requestBody: jsonBody("SidebarItemInput"),
        responses: {
          "201": okJson("Tạo thành công", "SidebarNode"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
      put: {
        tags: ["Sidebar"],
        summary: "Ghi đè toàn bộ sidebar (ADMIN)",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: { $ref: "#/components/schemas/SidebarItemInput" },
                  },
                },
                required: ["items"],
              },
            },
          },
        },
        responses: {
          "200": okJson("Sidebar sau khi ghi đè", "SidebarNode"),
          "400": badRequest("Trùng id giữa các item"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
    },

    /* ================= UPLOAD ================= */
    "/api/v1/upload/config": {
      get: {
        tags: ["Upload"],
        summary: "Lấy cấu hình upload (Cloudinary + Mega)",
        security: bearer,
        responses: {
          "200": okJson("Cấu hình upload", "UploadConfig"),
          "401": unauthorized(),
        },
      },
      put: {
        tags: ["Upload"],
        summary: "Cập nhật cấu hình upload (ADMIN)",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UploadConfig" },
            },
          },
        },
        responses: {
          "200": okJson("Cập nhật thành công", "UploadConfig"),
          "401": unauthorized(),
          "403": forbidden(),
          "422": validation(),
        },
      },
    },
    "/api/v1/upload/file": {
      post: {
        tags: ["Upload"],
        summary: "Upload file lên Cloudinary (ảnh/video) hoặc Mega (tệp khác)",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary", description: "File cần upload" },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "201": okJson("Upload thành công", "UploadResult"),
          "401": unauthorized(),
          "400": badRequest("No upload provider configured"),
        },
      },
    },

    /* ================= STATS ================= */
    "/api/v1/stats/visits": {
      get: {
        tags: ["Stats"],
        summary: "Lượt truy cập theo ngày trong tháng",
        parameters: [
          {
            name: "month",
            in: "query",
            schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$", example: "2026-08" },
            description: "Định dạng YYYY-MM, mặc định là tháng hiện tại",
          },
        ],
        responses: {
          "200": {
            description: "Thống kê lượt truy cập",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        month: { type: "string", example: "2026-08" },
                        days: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day: { type: "integer", example: 15 },
                              visits: { type: "integer", example: 120 },
                            },
                            required: ["day", "visits"],
                          },
                        },
                      },
                      required: ["month", "days"],
                    },
                  },
                },
              },
            },
          },
          "422": validation(),
        },
      },
    },
  },
} as const;
