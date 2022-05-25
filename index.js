const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

const stripe = require("stripe")(process.env.STRIPT_SECRET_KEY);


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dkxov.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'unAuthrization access'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function (err,decoded){
    if(err){
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded= decoded;
    next()
  })
}


async function run() {
  try {
    await client.connect();
    console.log('thsi is me')
    const serviceCollection = client.db("prats").collection("machine")
    const userCollection = client.db("prats").collection("user")
    const orderCollection = client.db("prats").collection("orders")
    const addProductCollection = client.db("prats").collection("addProduct")

    // All Service get database

    app.get('/service', async (req, res) => {

      const query = {}
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)

    })


    // payment item
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types_:[ "card"]
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      });
        
      });

          // Database UserCollection 
          app.put('/user/:email', async (req, res) =>{
            const email = req.params.email;
            const user = req.body
            const filter = {email: email};
            const options = { upsert: true };
            const updateDoc = {
              $set: user
                
              
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token  = jwt.sign({ email:email }, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' });
            res.send({result, token})

          })


          // admin collection

          app.put('/user/admin/:email', verifyJWT, async (req, res) =>{
            const email = req.params.email;
            const requester =req.decoded.email;
            const requesterAccount = await userCollection.findOne({email:requester})
            if(requesterAccount.role === 'admin'){
              const filter = {email: email};
            const updateDoc = {
              $set: {role:'admin'}
                
              
            };
            const result = await userCollection.updateOne(filter, updateDoc);
             res.send(result)

            }
            else{
               res.status(403).send({message: 'forbidden access'})

            }
            

          })


          // orderCollection backHand
          app.post('/order', async (req, res) =>{
            const orders = req.body;
            const result = await orderCollection.insertOne(orders)
            res.send(result)
          })


          // my oder collection backhand
          app.get('/order', async (req, res) =>{
            const user = req.query.user;
            const authorization = req.headers.authorization
            console.log('authHeader',authorization)
            const query = {user: user}
            const result = await orderCollection.find(query).toArray();
            res.send(result);

          })

          // all user collection backhand

          app.get('/user',  async (req, res) =>{
            const users = await userCollection.find().toArray();
            res.send(users)
          })


          app.post('/service', async (req, res) => {

            const addproduct=req.body;
            // const cursor = serviceCollection.insertOne(query);
            // const services = await cursor.toArray();
            const result = await serviceCollection.insertOne(addproduct);
            res.send(result)
      
          })

          // payment issue
          app.get('/order/:id', verifyJWT, async (req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await orderCollection.findOne(query);
            res.send(service); 
          })



  } finally {





  }
}
run().catch(console.dir);






















app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})