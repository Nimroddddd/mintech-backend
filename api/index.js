import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import dataRoute from "../routes/data.js";
import cartRoute from "../routes/cart.js";
import authRoute from "../routes/auth.js";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: ["http://localhost:3000", "https://min-tech.netlify.app", "https://mintech-weld.vercel.app", "https://mintech-1.onrender.com"]
}));

app.use("/data", dataRoute);
app.use("/cart", cartRoute);
app.use("/auth", authRoute);

// Add a health check route
app.get("/api/health", (req, res) => {
  res.status(200).send("Server is running");
});

// Handle the root path
app.get("/", (req, res) => {
  res.status(200).send("Mintech API is running");
});

// Export the Express API as the default function
export default app; 