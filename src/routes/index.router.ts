import { Router } from "express";
import authRoutes from "./auth.routes.js";
import postRoutes from "./post.routes.js";
import topicRoutes from "./topic.routes.js";
import tagRoutes from "./tag.routes.js";
import commentRoutes from "./comment.routes.js";
import commenterRoutes from "./commenter.routes.js";
import userRoutes from "./user.routes.js";
import sidebarRoutes from "./sidebar.routes.js";
import socialLinkRoutes from "./social-link.routes.js";
import mailRoutes from "./mail.routes.js";
import uploadRoutes from "./upload.routes.js";
import { visitsStats } from "../controllers/stats.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { visitsQuerySchema } from "../validations/profile.validation.js";
import { healthCheck } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/topics", topicRoutes);
router.use("/tags", tagRoutes);
router.use("/comments", commentRoutes);
router.use("/commenters", commenterRoutes);
router.use("/users", userRoutes);
router.use("/sidebar", sidebarRoutes);
router.use("/social-links", socialLinkRoutes);
router.use("/mail", mailRoutes);
router.use("/upload", uploadRoutes);
router.get("/stats/visits", validate(visitsQuerySchema, "query"), visitsStats);

export default router;
