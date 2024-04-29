//The dotenv will load our ENVIRONMENT veriables via the .env file - in this case the CONNECTIONSTRING
// as we don't want to upload the connection string to the bit bucket 
// So from now onwards we can access our connection strings and passwords via the process.env.<name> within the application
// more information can be located here - https://www.npmjs.com/package/dotenv
const dotenv = require('dotenv')
dotenv.config()
//This file is solely used to connect to the mongo db
//Once we have a connection to the DB - we then start the express app
//const mongodb = require('mongodb')
const { MongoClient, ServerApiVersion } = require('mongodb');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.CONNECTIONSTRING, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

// mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
//     module.exports = client

//     //Connection is established - lets now start the express application
//     const app = require('./app')
//     app.listen(process.env.PORT)
// })
// MongoClient.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true }, function(err, client){
//     module.exports = client

//     //Connection is established - lets now start the express application
//     const app = require('./app')
//     app.listen(process.env.PORT)
// })

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      await client.db().command({ ping: 1 });
      // Send a ping to confirm a successful connection
      module.exports = client;
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      //     //Connection is established - lets now start the express application
      const app = require('./app');
      app.listen(process.env.PORT);
    } finally {
      // Ensures that the client will close when you finish/error
      //await client.close();
    }
  }
  run().catch(console.dir);