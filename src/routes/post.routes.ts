import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  getLikedPostIds,
  getPostLikeState,
  listPosts,
  listPostsBySection,
  togglePostAction,
  togglePostLike,
  updatePost,
} from "../controllers/post.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { optionalCommenterAuth } from "../middlewares/commenterAuth.middleware.js";
import { optionalCommenterFromCookie, ensureCommenter } from "../middlewares/likeAuth.middleware.js";
import {
  createPostSchema,
  idParamSchema,
  listPostsQuerySchema,
  listPostsBySectionSchema,
  reactionParamSchema,
  toggleActionBodySchema,
  updatePostSchema,
} from "../validations/post.validation.js";

const router = Router();

router.get("/section/:sectionId", validate(listPostsBySectionSchema, "query"), listPostsBySection);
router.get("/liked", optionalCommenterAuth, getLikedPostIds);
router.get("/", validate(listPostsQuerySchema, "query"), listPosts);
router.get("/:id", validate(idParamSchema, "params"), getPost);

router.get("/:id/like", optionalCommenterFromCookie, getPostLikeState);
router.post("/:id/like", optionalCommenterFromCookie, ensureCommenter, togglePostLike);

router.post(
  "/:id/:action",
  validate(reactionParamSchema, "params"),
  validate(toggleActionBodySchema),
  optionalCommenterAuth,
  togglePostAction
);
router.post("/", authenticate, validate(createPostSchema), createPost);
router.patch("/:id", authenticate, validate(idParamSchema, "params"), validate(updatePostSchema), updatePost);
router.delete("/:id", authenticate, validate(idParamSchema, "params"), deletePost);

export default router;
