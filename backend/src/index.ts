import express from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./auth/routes/auth.routes";
import userRoutes from "./user/routes/profile.route";
import storeRoutes from "./store/routes/store.routes";
// import deliveryRoutes from "./delivery/routes/delivery.routes";

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
app.use("/user", userRoutes);
app.use("/store", storeRoutes);
// app.use("/delivery", deliveryRoutes);
// app.use("/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;