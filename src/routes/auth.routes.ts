import { Router } from "express";
import { login, me, refresh, register, forgotPassword } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { loginSchema, refreshSchema, registerSchema, forgotPasswordSchema } from "../validations/auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.get("/me", authenticate, me);

export default router;
