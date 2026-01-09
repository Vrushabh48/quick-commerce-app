import { Router, Request, Response, NextFunction } from "express";
import { signup, login, refreshToken, logout } from "../controllers/auth.controller";
import { signupSchema, loginSchema, refreshSchema } from "../validator/auth.validator";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

function validate(schema: any) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      return _res.status(400).json({ error: err.errors ?? err.message });
    }
  };
}

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refreshToken);
router.post("/logout", requireAuth, logout);

export default router;
