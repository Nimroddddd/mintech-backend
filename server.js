import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from "cors"
import cookieParser from "cookie-parser";
import env from "dotenv"


const app = express()
const port = 8080
env.config()
const saltRounds = 10;
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(cors({
  credentials: true,
  origin: ["http://localhost:3000", "https://min-tech.netlify.app", "https://mintech-weld.vercel.app"]
}))
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})

db.connect()

app.get("/", (req, res) => {
  res.send("Hello world")
})

app.post("/register", async (req, res) => {
  const {email, password} = req.body;
  try {
    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        throw new Error(err)
      }
      try {
        const response = await db.query("insert into users (email, password) values ($1, $2) returning *", [email, hash])
        res.json(response.rows[0]) 
      } catch(err) {
        res.send("user already exists")
      }
    })
  } catch(err) {
    res.send(404)
    console.log(err)
  }
})

app.post("/login", async (req, res) => {
  const {email, password} = req.body
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
            // sameSite: "None",
            secure: true,
            maxAge: 1000 * 60 * 60 * 5,
          })
          res.json({message: "correct password", cart: responseCart})
        } else {
          res.send("incorrect password")
        }
      }
    })
  } else {
    res.send("user not found")
  }

})

app.get("/user", async (req, res) => {
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

app.get("/category/:category", async (req, res) => {
  const category = req.params.category
  const response = await db.query("select * from products where category = $1", [category])
  const result = response.rows
  res.json(result)
})

app.get("/product/:id", async (req, res) => {
  const {id} = req.params
  const response = await db.query("select * from products where product_id = $1", [id])
  const result = response.rows[0]
  console.log(result)
  res.send(result)
})

app.get("/add-to-cart/:id", async (req, res) => {
  try {
    const {id} = req.params
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("insert into cart (email, product_id) values ($1, $2)", [claims._email, id])
    } catch (err) {
      console.log(err)
      res.send("unauthorized")
    }
})

app.get("/get-cart", async (req, res) => {
  try {
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    const response = await db.query("select * from products inner join cart on cart.product_id=products.product_id")
    const result = response.rows
    const filteredResult = result.filter(product => product.email == claims._email)
    console.log(filteredResult)
    res.json(filteredResult)
  } catch (err) {
    res.sendStatus(401)
  }
})

app.post("/get-public-cart", async (req, res) => {
  try {
    const products = req.body
    const response = await db.query("select * from products where product_id = ANY($1::text[])", [products])
    const result = response.rows
    res.json(result)
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

app.delete("/delete-from-cart/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const cookie = req.cookies.jwt;
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("delete from cart where email = $1 and product_id = $2", [claims._email, id])
    res.sendStatus(201)
  } catch (err) {
    res.send("unauthorized")
  }
})

app.get("/logout", (req, res) => {
  res.cookie("jwt", "", { 
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: 0,
  });
  res.send("logged out")
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})