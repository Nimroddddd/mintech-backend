import express from "express";
import pg from "pg";
import env from "dotenv"
import axios from "axios";


env.config()
const router = express.Router()
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})
const generateUniqueTxRef = () => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

db.connect()

router.post("/pay", async (req, res) => {
  const { amount, name, phone, email } = req.body
  console.log(req.body)
  try {
    const response = await axios.post("https://api.flutterwave.com/v3/payments", {
      "tx_ref": generateUniqueTxRef(),
      "amount": amount,
      "currency": "USD",
      "redirect_url": "https://min-tech.netlify.app",
      "payment_options": "card",
      "customer": {
          "email": email,
          "phonenumber": phone,
          "name": name
      },
      "customizations": {
          "title": "Mintech",
          "description": "Payment for items in cart",
          "logo": "https://my-ecommerce-site.com/logo.png"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTER_KEY}`,
        "Content-Type": "application/json",
      }
    }
  )
  res.send(response.data.data.link);
  console.log(response.data)
} catch (err) {
  res.send(err)
  console.log(err)
}
})

router.get("/category/:category", async (req, res) => {
  const category = req.params.category
  const response = await db.query("select * from products where category = $1", [category])
  const result = response.rows
  res.json(result)
})

router.get("/product/:id", async (req, res) => {
  const {id} = req.params
  const response = await db.query("select * from products where product_id = $1", [id])
  const result = response.rows[0]
  res.send(result)
})

export default router;
