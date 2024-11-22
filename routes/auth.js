import bcrypt from "bcrypt";
import pg from "pg";
import express from "express"
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"
import crypto from "crypto"
import env from "dotenv";

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})
const saltRounds = 10;
const router = express.Router();

db.connect()
env.config()


router.post("/register", async (req, res) => {
  const {email, password} = req.body;
  try {
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        throw new Error(err)
      }
      try {
        const response = await db.query("insert into users (email, password) values ($1, $2) returning *", [email, hash])
        res.json(response.rows[0]) 
      } catch(err) {
        res.sendStatus(409)
      }
    })
  } catch(err) {
    res.sendStatus(500)
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body
  const response = await db.query("select * from users where email=$1", [email]);
  const cartResponse = await db.query("select * from products inner join cart on cart.product_id=products.product_id")
  const potentialCart = cartResponse.rows
  const filteredResult = potentialCart.filter(product => product.email == email)
  let responseCart = []
  if (filteredResult) {
    for await (let product of filteredResult) {
      responseCart.push(product.product_id)
    }
  }
  const user = response.rows[0];
  if (user) {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        throw new Error(err)
      } else {
        if (result) {
          const token = jwt.sign({_email: user.email}, process.env.SECRET)
          res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 1000 * 60 * 60 * 5,
          })
          res.json({message: "correct password", cart: responseCart})
        } else {
          res.send({message: "Incorrect Password"})
        }
      }
    })
  } else {
    res.send({message: "User Not Found"})
  }

})

router.get("/user", async (req, res) => {
  try {
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    if (!claims) {
      res.sendStatus(404)
    }
    res.json({message: "logged in"})
  } catch (err) {
    res.json({message: "not logged in"})
  }
})

router.get("/logout", (req, res) => {
  res.cookie("jwt", "", { 
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 0,
  });
  res.send("logged out")
})

router.post("/reset-password", async (req, res) => {
  console.log(req.body)
})

router.post("/reset-password-request", async (req, res) => {
  const { email } = req.body
  const token = crypto.randomBytes(32).toString("hex");
  const link = `http://localhost:3000/reset-password/${token}`
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "min12345kabir@gmail.com",
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    to: email,
    subject: "Password Reset",
    text: `Click here to reset your password: ${link}`,
  };
  await transporter.sendMail(mailOptions)
  res.send("success")
  console.log(req.body)
})

export default router;