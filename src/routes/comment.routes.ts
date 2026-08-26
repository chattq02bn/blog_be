import { Router } from "express";
import {
  listCommentReplies,
  listPostComments,
  patchComment,
  postComment,
  removeComment,
  toggleCommentReaction,
} from "../controllers/comment.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import {
  createCommentSchema,
  listCommentsQuerySchema,
  reactionBodySchema,
  updateCommentSchema,
} from "../validations/comment.validation.js";
import { idParamSchema } from "../validations/post.validation.js";

const router = Router();

/* Bình luận của một bài viết: /comments/post/:postIdOrSlug?page=1&limit=10 */
router.get(
  "/post/:id",
  optionalAuth,
  validate(idParamSchema, "params"),
  validate(listCommentsQuerySchema, "query"),
  listPostComments
);
router.post(
  "/post/:id",
  optionalAuth,
  validate(idParamSchema, "params"),
  validate(createCommentSchema),
  postComment
);

router.get(
  "/:id/replies",
  optionalAuth,
  validate(idParamSchema, "params"),
  validate(listCommentsQuerySchema, "query"),
  listCommentReplies
);

router.patch(
  "/:id",
  optionalAuth,
  validate(idParamSchema, "params"),
  validate(updateCommentSchema),
  patchComment
);

/* Khách xóa bình luận của mình bằng cách gửi kèm authorName trong body */
router.delete(
  "/:id",
  optionalAuth,
  validate(idParamSchema, "params"),
  removeComment
);

router.post(
  "/:id/reactions",
  authenticate,
  validate(idParamSchema, "params"),
  validate(reactionBodySchema),
  toggleCommentReaction
);

export default router;
