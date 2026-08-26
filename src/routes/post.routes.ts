import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  togglePostAction,
  updatePost,
} from "../controllers/post.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createPostSchema,
  idParamSchema,
  listPostsQuerySchema,
  reactionParamSchema,
  toggleActionBodySchema,
  updatePostSchema,
} from "../validations/post.validation.js";

const router = Router();

router.get("/", validate(listPostsQuerySchema, "query"), listPosts);
router.get("/:id", validate(idParamSchema, "params"), getPost);
router.post(
  "/:id/:action",
  validate(reactionParamSchema, "params"),
  validate(toggleActionBodySchema),
  togglePostAction
);
router.post("/", authenticate, validate(createPostSchema), createPost);
router.patch("/:id", authenticate, validate(idParamSchema, "params"), validate(updatePostSchema), updatePost);
router.delete("/:id", authenticate, validate(idParamSchema, "params"), deletePost);

export default router;
