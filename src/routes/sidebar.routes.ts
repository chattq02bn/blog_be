import { Router } from "express";
import {
  getSidebar,
  getSidebarChildren,
  patchSidebarTopics,
  postSidebarItem,
  putSidebar,
} from "../controllers/sidebar.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import {
  idParamSchema,
} from "../validations/post.validation.js";
import {
  createSidebarItemSchema,
  patchSidebarItemSchema,
  replaceSidebarItemsSchema,
  sidebarQuerySchema,
} from "../validations/topic.validation.js";

const router = Router();

/* GET /sidebar?page=1&limit=3 — không truyền page/limit thì trả toàn bộ cây (kèm mục con) */
router.get("/", validate(sidebarQuerySchema, "query"), getSidebar);

/* GET /sidebar/:id/children?page=1&limit=10 — mục con PHÂN TRANG (lazy load) */
router.get(
  "/:id/children",
  optionalAuth,
  validate(idParamSchema, "params"),
  validate(sidebarQuerySchema, "query"),
  getSidebarChildren
);

router.post("/", authenticate, authorize("ADMIN"), validate(createSidebarItemSchema), postSidebarItem);
router.patch("/:id/topics", authenticate, authorize("ADMIN"), validate(idParamSchema, "params"), validate(patchSidebarItemSchema), patchSidebarTopics);
router.put("/", authenticate, authorize("ADMIN"), validate(replaceSidebarItemsSchema), putSidebar);

export default router;
