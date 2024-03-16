const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://dns-manager-f39da.web.app",
      "https://dns-manager-f39da.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jq69c8i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const domainCollection = client.db("DNS_Manager").collection("domains");
    const dnsRecordCollection = client.db("DNS_Manager").collection("records");
    const userCollection = client.db("DNS_Manager").collection("users");

    // middleware
    const verifyToken = (req, res, next) => {
      if (!req.headers?.authorization) {
        return res.status(401).send({ message: "Unauthorized access" });
      }

      const token = req.headers?.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAuthor = async (req, res, next) => {
      const email = req.decoded?.email;
      const id = req.params?.id;

      const record = await dnsRecordCollection.findOne({
        _id: new ObjectId(id),
      });
      if (record?.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    //jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, {
        expiresIn: "5h",
      });
      // res.header("Access-Control-Allow-Credentials", "true");
      res.send({ token });
    });

    // users api
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    // domains api
    app.get("/domains", verifyToken, async (req, res) => {
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

    app.post("/domains", verifyToken, async (req, res) => {
      const domain = req.body;
      const result = await domainCollection.insertOne(domain);
      res.send(result);
    });

    // records api
    app.get("/records", verifyToken, async (req, res) => {
      const targetedDomain = req.query;
      const domain = targetedDomain?.domain;
      const { searchDomain } = req.query;

      if (searchDomain?.length > 0) {
        // const filter = { domain_name: searchDomain };
        const searchResult = await dnsRecordCollection
          .find({ domain_name: { $regex: searchDomain } })
          .toArray();
        return res.send(searchResult);
      }
      if (targetedDomain?.domain === "all") {
        const result = await dnsRecordCollection.find().toArray();
        res.send(result);
      } else if (domain) {
        const result = await dnsRecordCollection
          .find({ domain_name: { $regex: domain } })
          .toArray();
        res.send(result);
      }
    });

    app.get("/single-record/:id", verifyToken, verifyAuthor, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await dnsRecordCollection.findOne(filter);
      res.send(result);
    });

    app.post("/records", verifyToken, async (req, res) => {
      const record = req.body;
      const result = await dnsRecordCollection.insertOne(record);
      res.send(result);
    });

    app.put("/single-record/:id", verifyToken, verifyAuthor, async (req, res) => {
      const id = req.params.id;
      const { domain_name, record_type, record_value, ttl, description } =
        req.body;
      //   console.log(req.body);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          domain_name,
          record_type,
          record_value,
          ttl,
          description,
        },
      };
      const result = await dnsRecordCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete(
      "/single-record/:id",
      verifyToken,
      verifyAuthor,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const result = await dnsRecordCollection.deleteOne(filter);
        res.send(result);
      }
    );

    // statistics
    app.get("/statistics", async (req, res) => {
      const domains = await domainCollection.countDocuments();
      const records = await dnsRecordCollection.countDocuments();
      const users = await userCollection.countDocuments();
      res.send({ domains, records, users });
    });

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
