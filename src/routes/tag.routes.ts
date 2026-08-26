import { Router } from "express";
import {
  createTag,
  deleteTag,
  listTags,
  replaceTags,
  updateTag,
} from "../controllers/tag.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  createTagSchema,
  replaceTagsSchema,
  updateTagSchema,
} from "../validations/tag.validation.js";
import { idParamSchema } from "../validations/post.validation.js";

const router = Router();

router.get("/", listTags);
router.post("/", authenticate, authorize("ADMIN"), validate(createTagSchema), createTag);
router.put("/", authenticate, authorize("ADMIN"), validate(replaceTagsSchema), replaceTags);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateTagSchema),
  updateTag
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  deleteTag
);

export default router;
