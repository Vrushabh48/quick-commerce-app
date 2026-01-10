import { Router } from "express";
import { authorizeRoles } from "../../middleware/authorizeRoles";

import { deleteUserProfile, getUserProfile, updateUserProfile } from "../controller/profile.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";

const router = Router();

router.get("/profile/me", authenticateRequest, authorizeRoles(["USER"]), getUserProfile);
router.patch("/profile/me", authenticateRequest, authorizeRoles(["USER"]), updateUserProfile);
router.delete("/profile/me", authenticateRequest, authorizeRoles(["USER"]), deleteUserProfile);

export default router;