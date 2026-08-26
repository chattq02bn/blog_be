import { Router } from "express";
import { z } from "zod";
import {
  createNewUser,
  getMyProfile,
  getSingleUser,
  listAllUsers,
  patchMyProfile,
  patchUser,
  removeUser,
} from "../controllers/user.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../validations/user.validation.js";
import { updateProfileSchema } from "../validations/profile.validation.js";

const router = Router();

router.use("/", authenticate, authorize("ADMIN"));

router.get("/", validate(listUsersQuerySchema, "query"), listAllUsers);
router.post("/", validate(createUserSchema), createNewUser);

/* Hồ sơ cá nhân — đặt trước /:id để không bị nuốt param */
router.get("/me", getMyProfile);
router.patch("/me", validate(updateProfileSchema), patchMyProfile);

const idParam = z.object({ id: z.coerce.number().int().positive() });
router.get("/:id", validate(idParam, "params"), getSingleUser);
router.patch("/:id", validate(idParam, "params"), validate(updateUserSchema), patchUser);
router.delete("/:id", validate(idParam, "params"), removeUser);

export default router;
