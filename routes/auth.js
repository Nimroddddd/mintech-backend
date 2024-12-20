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
const resetTokens = new Map()


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
  try {
    const response = await db.query("select * from users where email=$1", [email]);
    const cartResponse = await db.query("select * from products inner join cart on cart.product_id=products.product_id where email = $1", [email])
    const responseCart =  cartResponse.rows.map(product => product.product_id)
    const user = response.rows[0];
    if (!user) {
      return res.send({message: "User Not Found"})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.send({message: "Incorrect Password"})
    }
    const token = jwt.sign({_email: user.email}, process.env.SECRET, { expiresIn: "12h" })
    // res.cookie("jwt", token, {
    //   httpOnly: true,
    //   sameSite: "None",
    //   secure: true,
    //   maxAge: 1000 * 60 * 60 * 12,
    // })
    res.json({message: "correct password", cart: responseCart, token})
  } catch (err) {
    console.log(err)
  }

})

router.get("/user", async (req, res) => {
  try {
    const { authorization } = req.headers
    const claims = jwt.verify(authorization, process.env.SECRET)
    if (!claims) {
      res.sendStatus(404)
    }
    res.json({message: "logged in"})
  } catch (err) {
    res.json({message: "not logged in"})
  }
})

// router.get("/logout", (req, res) => {
//   res.cookie("jwt", "", { 
//     httpOnly: true,
//     sameSite: "None",
//     secure: true,
//     maxAge: 0,
//   });
//   res.send("logged out")
// })

router.post("/reset-password", async (req, res) => {
  const { token, email, newPassword } = req.body
  if (!email || !token) {
    return res.json({message: "Insufficient credentials provided."})
  }
  console.log(req.body)
  try {
    const tokenData = resetTokens.get(email);
    if (!tokenData || Date.now() > tokenData.expires) {
      return res.json({ message: "Token is invalid or expired." });
    }

    const isTokenValid = await bcrypt.compare(token, tokenData.token);
    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid token." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db.query("update users set password = $1 where email = $2", [hashedPassword, email])
    res.json({message: "Password update succeessful"})
    resetTokens.delete(email);
  } catch (err) {
    console.log(err)
    res.json({message: "Something went wrong"})
  }
})

router.post("/reset-password-request", async (req, res) => {
  const { email } = req.body
  const response  = await db.query("select * from users where email = $1", [email]);
  const result = response.rows;
  console.log(result)
  if (!result.length) {
    return res.json({message: "User not found"})
  }
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(token, 10);
  resetTokens.set(email, { token: hashedToken, expires: Date.now() + 900000 });
  const link = `https://min-tech.netlify.app/reset-password/?token=${token}&email=${email}`
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    to: email,
    subject: "Password Reset",
    html: `<p>Click <a href="${link}">here</a> to reset your password. The link is valid for 15 minutes.</p>`
  };
  try {
    await transporter.sendMail(mailOptions)
    res.json({message: "success"})
  } catch (err) {
    console.log(err)
  }
  console.log(req.body)
})

export default router;