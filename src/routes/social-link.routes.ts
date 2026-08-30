import { Router } from "express";
import {
  listSocialLinks,
  listActiveSocialLinks,
  updateSocialLinks,
} from "../controllers/social-link.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: chỉ lấy link active
router.get("/active", listActiveSocialLinks);

// Admin: CRUD
router.get("/", authenticate, authorize("ADMIN"), listSocialLinks);
router.put("/", authenticate, authorize("ADMIN"), updateSocialLinks);

export default router;
