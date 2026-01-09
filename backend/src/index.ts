import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("Hello, Quick Commerce!");
});

// 🔴 MOUNT AUTH ROUTES
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;