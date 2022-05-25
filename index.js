const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dkxov.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// function verifyJWT(req, res, next){
//   const authHeader = req.headers.authorization;
//   if(!authHeader){
//     return res.status(401).send({message: 'unAuthrization access'})
//   }
//   const token = authHeader.split(' ')[1]
//   jwt.verify(token. process.env.ACCESS_TOKEN_SECRET, function(err,decode){
//     if(err){
//       return res.status(403).send({message: 'forbidden access'})
//     }
//     req.decode= decode;
//     next()
//   })
// }


async function run() {
  try {
    await client.connect();
    console.log('thsi is me')
    const serviceCollection = client.db("prats").collection("machine")
    const userCollection = client.db("prats").collection("user")
    const orderCollection = client.db("prats").collection("orders")

    // All Service get database

    app.get('/service', async (req, res) => {

      const query = {}
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)

    })

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

          app.get('/user', async (req, res) =>{
            const users = await userCollection.find().toArray();
            res.send(users)
          })



  } finally {





  }
}
run().catch(console.dir);






















app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})