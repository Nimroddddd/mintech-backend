import express from "express";
import pg from "pg";
import env from "dotenv"
import jwt from "jsonwebtoken";


env.config()
const router = express.Router()
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})

db.connect()


router.get("/add-to-cart/:id", async (req, res) => {
  try {
    const {id} = req.params
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("insert into cart (email, product_id) values ($1, $2)", [claims._email, id])
    return res.sendStatus(201)
    } catch (err) {
      res.send("unauthorized")
      console.log("unauthorized")
    }
})

router.get("/get-cart", async (req, res) => {
  try {
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    const response = await db.query("select * from products inner join cart on cart.product_id=products.product_id")
    const result = response.rows
    const filteredResult = result.filter(product => product.email == claims._email)
    let total = 0
    let count = 0
    for await (let product of filteredResult) {
      const price = product.price
      total = (price + total) * product.count
      count++
    };
    res.json({filteredResult, total, count})
  } catch (err) {
    res.sendStatus(401)
  }
})

router.post("/get-public-cart", async (req, res) => {
  try {
    const products = req.body
    const response = await db.query("select * from products where product_id = ANY($1::text[])", [products])
    const filteredResult = response.rows
    let total = 0
    let count = 0
    for await (let product of filteredResult) {
      const price = product.price
      total = price + total
      count++
    }
    res.json({filteredResult, total, count})
  } catch (err) {
    res.sendStatus(500)
  }
})

router.delete("/delete-from-cart/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const cookie = req.cookies.jwt;
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("delete from cart where email = $1 and product_id = $2", [claims._email, id])
    return res.sendStatus(201)
  } catch (err) {
    res.send("unauthorized")
  }
})

router.post("/update-cart", async (req, res) => {
  const cookie = req.cookies.jwt;
  const claims = jwt.verify(cookie, process.env.SECRET);
  const { _email:email } = claims
  const { count, id } = req.body;
  const response = db.query("update cart set count = $1 where product_id = $2 and email = $3 returning *", [count, id, email])
  res.json(response.rows);
})

router.get("/cart", async (req, res) => {
  let products = []
  const response = await db.query("select product_id from products")
  const result = response.rows;
  for await (let product of result) {
    products.push(product.product_id)
  }
  console.log(products)
})

router.get("/add-to-wishlist/:id", async (req, res) => {
  try {
    const {id} = req.params
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("insert into wishlist (email, product_id) values ($1, $2)", [claims._email, id])
    return res.sendStatus(201)
    } catch (err) {
      res.send("unauthorized")
      console.log("unauthorized")
    }
})

router.get("/get-wishlist", async (req, res) => {
  try {
    const cookie = req.cookies.jwt
    const claims = jwt.verify(cookie, process.env.SECRET)
    const response = await db.query("select * from products inner join wishlist on wishlist.product_id=products.product_id")
    const result = response.rows
    const filteredResult = result.filter(product => product.email == claims._email)
    let count = 0
    for await (let product of filteredResult) {
      count++
    };
    res.json({filteredResult, count})
  } catch (err) {
    res.sendStatus(401)
  }
})

router.post("/get-public-wishlist", async (req, res) => {
  try {
    const products = req.body
    const response = await db.query("select * from products where product_id = ANY($1::text[])", [products])
    const filteredResult = response.rows
    let count = 0
    for await (let product of filteredResult) {
      count++
    }
    res.json({filteredResult, count})
  } catch (err) {
    res.sendStatus(500)
    console.log(err)
  }
})

router.delete("/delete-from-wishlist/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const cookie = req.cookies.jwt;
    const claims = jwt.verify(cookie, process.env.SECRET)
    await db.query("delete from wishlist where email = $1 and product_id = $2", [claims._email, id])
    return res.sendStatus(201)
  } catch (err) {
    res.send("unauthorized")
  }
})

export default router;