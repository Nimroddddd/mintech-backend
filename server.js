import express from "express";
import bodyParser from "body-parser";
import cors from "cors"
import cookieParser from "cookie-parser";
import dataRoute from "./routes/data.js"
import cartRoute from "./routes/cart.js"
import authRoute from "./routes/auth.js"
import crypto from "crypto"
import bcrypt from "bcrypt"


const app = express()
const port = 8080
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(cors({
  credentials: true,
  origin: ["http://localhost:3000", "https://min-tech.netlify.app", "https://mintech-weld.vercel.app", "https://mintech-1.onrender.com"]
}))

app.use("/data", dataRoute)
app.use("/cart", cartRoute)
app.use("/auth", authRoute)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})