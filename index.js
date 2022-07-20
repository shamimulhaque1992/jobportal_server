require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6t28j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnauthorizedError" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const jobsCollections = client.db("jobportal").collection("jobs");
    const usersCollections = client.db("jobportal").collection("users");
    console.log("database connected");



    app.get("/jobs",verifyJWT, async (req, res) => {
        const query={};
        const authorization = req.headers.authorization;
        console.log("auth",authorization);
        const cursor = jobsCollections.find(query)
        const jobs = await cursor.toArray();
        res.send(jobs);
    })


    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobsCollections.insertOne(newJobs);
      res.send(result);
    });
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await jobsCollections.deleteOne(query);
      res.send(result);
    });
    app.put("/jobs/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const info = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: info.title,
          description: info.description,
          skills: info.skills,
          jobexperience: info.jobexperience,
          education: info.education,
          img: info.img,
        },
      };

      const updatedInfo = await jobsCollections.updateOne(filter, updatedDoc);
      res.send(updatedInfo);
    });


     app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await usersCollections.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
    } finally {
  }
}
  run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Jobs portal is running");
});

app.listen(port, () => {
  console.log(`Lesting to ports ${port}`);
});