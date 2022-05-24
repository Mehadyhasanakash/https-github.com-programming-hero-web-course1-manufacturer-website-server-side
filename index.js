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


async function run() {
  try {
    await client.connect();
    console.log('thsi is me')
    const serviceCollection = client.db("prats").collection("machine")
    const userCollection = client.db("prats").collection("user")

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



  } finally {





  }
}
run().catch(console.dir);






















app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})