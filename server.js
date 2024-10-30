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
  ssl: {
    rejectUnauthorized: false,
    required: true,
  },
})
let count = 0


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
  const user = response.rows[0];
  if (user) {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        throw new Error(err)
      } else {
        if (result) {
          const token = jwt.sign({_id: user.id}, process.env.SECRET)
          res.cookie("jwt", token, {
            // httpOnly: true,
            maxAge: 1000 * 60 * 30,
          })
          res.send("correct password")
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
    const response = await db.query("select * from users where id=$1", [claims._id]);
    const user = response.rows[0]
    res.json(user)
    console.log("cookie is there")
  } catch (err) {
    console.log(err)
    res.send("lol")
    count ++
    console.log(count + "cookie aint there")
  }
})

app.get("/logout", (req, res) => {
  res.cookie("jwt", "", {
    maxAge: 0
  });
  res.send("loggedout")
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})