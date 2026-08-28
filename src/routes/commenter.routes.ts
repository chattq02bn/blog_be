import { Router } from "express";
import { postCommenter, patchCommenterMe } from "../controllers/commenter.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticateCommenter } from "../middlewares/commenterAuth.middleware.js";
import { createCommenterSchema, updateCommenterSchema } from "../validations/commenter.validation.js";

const router = Router();

// POST /commenters — create new commenter, returns token
router.post("/", validate(createCommenterSchema), postCommenter);

// PATCH /commenters/me — update nickname (requires token)
router.patch("/me", authenticateCommenter, validate(updateCommenterSchema), patchCommenterMe);

export default router;
