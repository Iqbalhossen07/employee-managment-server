const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require('cors')
const app = express()
const port =process.env.PORT || 5000



// middleware 

app.use(cors())
app.use(express.json())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vtrfwez.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const userCollection = client.db("employee_Management").collection("users");
    const paymentCollection = client.db("employee_Management").collection("payments");
    const paymentCollection1 = client.db("employee_Management").collection("payment");
    const workCollection = client.db("employee_Management").collection("work");
    const contactCollection = client.db("employee_Management").collection("contact");


     // jwt related api
     app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
      res.send({ token });
    })
    

    // middlewares 
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token asche 50 number line', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
     
    }


    // use verify Hr after verifyToken
    const verifyHr = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isHr = user?.role === 'hr';
      if (!isHr) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    // use verify Hr after verifyToken
    const verifyEmployee = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isEmployee = user?.role === 'employee';
      if (!isEmployee) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // use verify Hr after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }




     // check hr 
     app.get('/users/hr/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let hr = false;
      if (user) {
        hr = user?.role === 'hr';
      }
      res.send({ hr });
    })


     // check admin 
     app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })
     // check Employee 
     app.get('/users/employee/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let employee = false;
      if (user) {
        employee = user?.role === 'employee';
      }
      res.send({ employee });
    })


    app.post('/users', async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
      });

      app.get('/users', verifyToken, async (req, res) => {
        // console.log(req.headers)
        const result = await userCollection.find().toArray();
        res.send(result);
      });
     
    
    
     
// verified check

      app.patch('/users/verified/:id',verifyToken,verifyHr,  async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            verified: 'true'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })


      // make HR 
      app.patch('/users/Hr/:id',verifyToken,verifyAdmin,  async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: 'hr'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })
    
      // make Fire Api 
      app.patch('/users/fire/:id',verifyToken,verifyAdmin,  async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            fire: 'fire'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })
    
    

      // payment collection post api create 
      
      app.post('/payments', async (req, res) => {
        const user = req.body;
        const result = await paymentCollection.insertOne(user);
        res.send(result);
      });


        // payment collection
        // app.get('/payments', async (req, res) => {
        //   const result = await paymentCollection.find().toArray();
        //   res.send(result);
        // });

        app.get('/payments/:id', async (req, res) => {

          // const email = req.query.email;
          const query = { _id : new ObjectId(req.params.id)};
          const result = await paymentCollection.findOne(query);
          res.send(result);
        });

        
        app.get('/payment/:id', async (req, res) => {
          
          const id = req.params.id
          // const email = req.query.email;
          // const query = {email :email};
          const userQuery = {_id : new ObjectId(id)}
          const user = await userCollection.findOne(userQuery)
          console.log('hiiting 227',user)
          // const result = await paymentCollection1.findOne(query);
          res.send(user);
        });

         // payment intent
        app.post('/create-payment-intent', async (req, res) => {
          const { salary } = req.body;
          const amount = parseInt(salary * 100);
          console.log(amount, 'amount inside the intent')

          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method_types: ['card']
          });

          res.send({
            clientSecret: paymentIntent.client_secret
          })
        });

        app.post('/payment', async (req, res) => {
          const id = req.params.id
          const payment = req.body;
          const paymentResult = await paymentCollection1.insertOne(payment);
    
          //  carefully delete each item from the cart
          console.log('payment info', payment);
          const query = {_id: new ObjectId(id)}
    
          const deleteResult = await paymentCollection.deleteOne(query);
    
          res.send({ paymentResult, deleteResult });
        })

        // payment history api create 

        app.get('/payment/:email', verifyToken, async (req, res) => {
          const query = { email: req.params.email }
          if (req.params.email !== req.decoded.email) {
            return res.status(403).send({ message: 'forbidden access' });
          }
          const result = await paymentCollection1.find(query).toArray();
          res.send(result);
        })


        // // work-sheet post api create 

        

        app.post('/work', async (req, res) => {
          const user = req.body;
          const result = await workCollection.insertOne(user);
          res.send(result);
        });

        app.get('/work/:email', verifyToken, async (req, res) => {
          const query = { email: req.params.email }
          if (req.params.email !== req.decoded.email) {
            return res.status(403).send({ message: 'forbidden access' });
          }
          const result = await workCollection.find(query).toArray();
          res.send(result);
        })


        // contact api create 

        app.post('/contact', async (req, res) => {
          const user = req.body;
          const result = await contactCollection.insertOne(user);
          res.send(result);
        });

   


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`Management is sitting ${port}`)
})