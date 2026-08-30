import { Router } from "express";
import {
  getUploadConfigController,
  updateUploadConfigController,
  uploadFileController,
} from "../controllers/upload.controller.js";

const router = Router();

router.get("/config", getUploadConfigController);
router.put("/config", updateUploadConfigController);
router.post("/file", uploadFileController);

export default router;
