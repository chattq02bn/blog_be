import { Router } from "express";
import {
  listCommentReplies, listPostComments, patchComment,
  postComment, removeComment, toggleCommentLikeHandler, getCommentLikeStateHandler,
  generateCommenterName, checkCommenterName,
} from "../controllers/comment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import { authenticateCommenter, optionalCommenterAuth } from "../middlewares/commenterAuth.middleware.js";
import { optionalCommenterFromCookie, ensureCommenter } from "../middlewares/likeAuth.middleware.js";
import {
  createCommentSchema, listCommentsQuerySchema, updateCommentSchema,
} from "../validations/comment.validation.js";
import { idParamSchema } from "../validations/post.validation.js";

const router = Router();

// GET  /comments/generate-name?postId=xxx — anonymous name generator
router.get("/generate-name", generateCommenterName);

// GET  /comments/check-name?postId=xxx&name=xxx — check if name is used
router.get("/check-name", checkCommenterName);

// GET  /comments/post/:id?page=1&limit=10
router.get("/post/:id", optionalAuth,
  validate(idParamSchema, "params"),
  validate(listCommentsQuerySchema, "query"),
  listPostComments
);

// POST /comments/post/:id  (public: optional auth + optional commenter token)
router.post("/post/:id", optionalAuth, optionalCommenterAuth,
  validate(idParamSchema, "params"),
  validate(createCommentSchema),
  postComment
);

// GET  /comments/:id/replies
router.get("/:id/replies", optionalAuth,
  validate(idParamSchema, "params"),
  validate(listCommentsQuerySchema, "query"),
  listCommentReplies
);

// PATCH /comments/:id  (requires commenter token, owner only)
router.patch("/:id", authenticateCommenter,
  validate(idParamSchema, "params"),
  validate(updateCommentSchema),
  patchComment
);

// DELETE /comments/:id  (requires commenter token, owner only)
router.delete("/:id", authenticateCommenter,
  validate(idParamSchema, "params"),
  removeComment
);

// GET  /comments/:id/like  (optional commenter from cookie)
router.get("/:id/like", optionalCommenterFromCookie, getCommentLikeStateHandler);

// POST /comments/:id/like  (optional commenter from cookie + ensure commenter)
router.post("/:id/like", optionalCommenterFromCookie, ensureCommenter, toggleCommentLikeHandler);

export default router;
