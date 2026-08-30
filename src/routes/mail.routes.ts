import { Router } from "express";
import { getMailSettings, updateMailSettings } from "../controllers/mail.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getMailSettings);
router.put("/", updateMailSettings);

export default router;
