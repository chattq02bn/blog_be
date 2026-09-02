import { Router } from "express";
import { z } from "zod";
import {
  createTopic,
  deleteTopic,
  listTopics,
  updateTopic,
} from "../controllers/topic.controller.js";
import { listTopicSections, listTopicSectionsPaginated, listSectionsBySlugs, listTopicPostsController } from "../controllers/section.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  createTopicSchema,
  listTopicsQuerySchema,
  updateTopicSchema,
} from "../validations/topic.validation.js";
import { idParamSchema } from "../validations/post.validation.js";

const router = Router();

const slugParamSchema = z.object({
  slug: z.string().trim().min(1, "Invalid slug"),
});

const sectionsQuerySchema = z.object({
  slugs: z.string().trim().min(1, "Query 'slugs' is required").max(2000),
});

router.get("/", validate(listTopicsQuerySchema, "query"), listTopics);
router.get("/sections", validate(sectionsQuerySchema, "query"), listSectionsBySlugs);
router.get(
  "/:slug/sections/paginated",
  validate(slugParamSchema, "params"),
  listTopicSectionsPaginated
);
router.get(
  "/:slug/sections",
  validate(slugParamSchema, "params"),
  listTopicSections
);
router.get(
  "/:slug/posts",
  validate(slugParamSchema, "params"),
  listTopicPostsController
);
router.post("/", authenticate, authorize("ADMIN"), validate(createTopicSchema), createTopic);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  validate(updateTopicSchema),
  updateTopic
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(idParamSchema, "params"),
  deleteTopic
);

export default router;
