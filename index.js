const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://dns-manager:UITQJvJHy0CSjFDq@cluster0.jq69c8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const domainCollection = client.db("DNS_Manager").collection("domains");
    const dnsRecordCollection = client.db("DNS_Manager").collection("records");

    // domains api
    app.get("/domains", async (req, res) => {
      const { searchText } = req.query;
      // console.log(searchValue);
      if (searchText?.length > 0) {
        const filter = { domain_name: searchText };
        const searchResult = await domainCollection.find(filter).toArray();
        res.send(searchResult);
      } else {
        const result = await domainCollection.find().toArray();
        res.send(result);
      }
    });

    app.post("/domains", async (req, res) => {
      const domain = req.body;
      const result = await domainCollection.insertOne(domain);
      res.send(result);
    });


    // records api 
    app.get('/records', async(req, res) => {
        const result = await dnsRecordCollection.find().toArray();
        res.send(result);
    })
    app.post('/records', async(req, res) => {
        const record = req.body;
        const result = await dnsRecordCollection.insertOne(record);
        res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("DNS Manager Server is running");
});

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});
