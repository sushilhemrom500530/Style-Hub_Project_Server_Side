const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;

// middleware 

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ruakr2a.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const usersCollection = client.db("styleHubDB").collection("users");

    // auth connection related api 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: '30d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'})
      .send({success: true, token: token})
    })

    const verifyToken = async(req, res, next) => {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).send({message:'unauthorized access'})
      }
      jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({message:'unauthorized access'})
        }
        req.decoded = decoded;
        next();
      })
    }

    app.post('/logout', async(req,res) => {
      const user = req.body;
      res.clearCookie('token', {maxAge:0, sameSite: 'none', secure: true})
      .send({success: true})

    })
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })
    app.post('/user', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user?.email }
      const existedUser = await usersCollection.findOne(query);
      if (existedUser) {
        return res.status(400).send({ message: "User already exist", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.send(result)
    })



    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Style Hub is Runnign.....');
})

app.listen(port, () => {
  console.log(`Style Hub is Running on port ${port}`);
})