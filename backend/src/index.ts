import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { authenticateRequest } from "./middleware/authenticateRequest";
import { authorizeRoles } from "./middleware/authorizeRoles";

import authRoutes from "./auth/routes/auth.routes";
import userRoutes from "./user/routes/profile.route";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(express.json());



app.get(
  "/admin/dashboard",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
);


// health check
app.get("/", (req, res) => {
  res.send("Hello, Quick Commerce!");
});

// 🔴 MOUNT AUTH ROUTES
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;