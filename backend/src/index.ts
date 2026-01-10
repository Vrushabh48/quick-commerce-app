import express, { Errback, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./auth/routes/auth.routes";
import profileRoutes from "./user/routes/profile.route";
import userProductRoutes from "./user/routes/product.routes";
import userCartRoutes from "./user/routes/cart.routes";
import userAddressRoutes from "./user/routes/address.routes";
import storeRoutes from "./store/routes/store.routes";
import deliveryRoutes from "./delivery/routes/rider.routes";
import AdminOrder from "./admin/routes/order.routes";
import adminProductRoutes from "./admin/routes/product.routes";
import adminStoreRoutes from "./admin/routes/store.routes";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
  });
});

app.use(helmet());
app.use(cors());
app.set("trust proxy", 1);


// health check
app.get("/", (req, res) => {
  res.send("Hello, Quick Commerce!");
});

// 🔴 MOUNT AUTH ROUTES
app.use("/auth", authRoutes);

app.use("/user", profileRoutes);
app.use("/user", userProductRoutes);
app.use("/user", userCartRoutes);
app.use("/user", userAddressRoutes);

app.use("/store", storeRoutes);

app.use("/delivery", deliveryRoutes);

app.use("/admin", AdminOrder);
app.use("/admin", adminProductRoutes);
app.use("/admin", adminStoreRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;