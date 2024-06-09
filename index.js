const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m3whnjn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const apartmentCollection = client.db("buildingDb").collection("apartment");
    const userCollection = client.db("buildingDb").collection("users");
    const agreementCollection = client.db("buildingDb").collection("agreements");
    const announcementCollection = client.db("buildingDb").collection("announcements");
    const couponCollection = client.db("buildingDb").collection("coupons");
    const paymentCollection = client.db("buildingDb").collection("payments");


    app.get('/apartment', async(req,res) => {
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      console.log('pagination', req.query)
        const result = await apartmentCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
        res.send(result)
    })

    app.get('/apartment/:id', async(req,res) => {
      const id = req.params.id
      const query= {_id: id}
      const result = await apartmentCollection.findOne(query)
      res.send(result)
    })


    // users related api
    app.post('/users', async(req,res) => {
      const user = req.body;
      const query = { email: user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({ message: 'user already exit', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });


    app.get('/users', async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });


    app.get('/users/admin/:email', async(req,res) => {
      const email = req.params.email;
      const query = {email: email}
      const user = await userCollection.findOne(query)
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})

    })
    
    app.get('/users/member/:email', async(req,res) => {
      const email = req.params.email;
      const query = {email: email}
      const user = await userCollection.findOne(query)
      let member = false;
      if(user){
        member = user?.role === 'member'
      }
      res.send({member})

    })


    app.post('/agreements', async(req,res) => {
      const agreement = req.body
      console.log(agreement)
      const result = await agreementCollection.insertOne(agreement)
      res.send(result)
    })

    app.get('/agreements', async(req,res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await agreementCollection.find(query).toArray();
      res.send(result);
    });


    app.patch('/users/member/:email', async(req,res) => {
      const email = req.params.email;
      const filter ={ email: email}
      const updatedDoc = {
        $set: {
          role: 'member'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.delete('/agreements/:id', async(req,res) => {
      const id = req.params.id
      const query ={ _id: new ObjectId(id)}
      const result = await agreementCollection.deleteOne(query)
      res.send(result)
    })


    app.post('/announcements', async(req,res) => {
      const announcements = req.body
      console.log(announcements)
      const result = await announcementCollection.insertOne(announcements)
      res.send(result)
    })

    app.get('/announcements', async(req,res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    });


    app.post('/coupons', async(req,res) => {
      const coupon = req.body
      console.log(coupon)
      const result = await couponCollection.insertOne(coupon)
      res.send(result)
    })

    app.get('/coupons', async(req,res) => {
      const result = await couponCollection.find().toArray();
      res.send(result);
    });

    app.get('/apartmentCount', async(req,res) => {
      const count = await apartmentCollection.estimatedDocumentCount()
      res.send({count})
    })



    // payment intent

    app.post('/create-payment-intent', async(req,res) => {
      const {rent} = req.body;
    const amount = parseInt(rent * 100)
    console.log(amount,'amount inside')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card']
    })

    res.send({
      clientSecret: paymentIntent.client_secret
    })

    });


    app.post('/payments', async(req,res) => {
      const payment= req.body;
      const paymentResult = await paymentCollection.insertOne(payment)
  
      console.log('payment info', payment)
      // const query = {_id: {
      //   $in: payment.agreementIds.map(id => new ObjectId(id))
      // }};
  
      // const deleteResult = await agreementCollection.deleteMany(query)
      res.send({paymentResult})
  
    })

    app.get('/payments/:email', async(req,res) => {
      const query = {email: req.params.email}
      const result = await paymentCollection.find(query).toArray()
      res.send(result)
    })









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res) => {
    res.send('building apartment is searching')
});

app.listen(port, () => {
    console.log(`Building apartment is sitting on port ${port}`)
})