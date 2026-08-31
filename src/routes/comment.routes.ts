import { Router } from "express";
import {
  listCommentReplies, listPostComments, patchComment,
  postComment, removeComment, toggleCommentReaction,
} from "../controllers/comment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import { authenticateCommenter, optionalCommenterAuth } from "../middlewares/commenterAuth.middleware.js";
import {
  createCommentSchema, listCommentsQuerySchema, reactionBodySchema, updateCommentSchema,
} from "../validations/comment.validation.js";
import { idParamSchema } from "../validations/post.validation.js";

const router = Router();

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

// POST /comments/:id/reactions  (requires regular user login)
router.post("/:id/reactions", authenticate,
  validate(idParamSchema, "params"),
  validate(reactionBodySchema),
  toggleCommentReaction
);

export default router;
