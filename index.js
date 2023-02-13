var moment = require("moment");
var express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const path = require("path");
// require("dotenv").config();
var ObjectId = require("mongodb").ObjectID;

var bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
var app = express();
app.use(cors());

app.listen(5002);

const upload = multer();
var bodyParser = require("body-parser");

app.use(bodyParser.json());

app.use(express.json());
var MongoClient = require("mongodb").MongoClient;
var id = require("mongodb").ObjectID;
require("dotenv").config();
const secretKey = "secretKey";
// console.log(process.env.ACCESS_TOKEN_SECRET);
app.use(express.json());

// const publicEndpoints = [
//   "/signup",
//   "/login",
//   "/add-super-user",
//   "/login-superuser",
// ];

var url =
  "mongodb+srv://vivekkn91:VGCJAMTmoyUKnnQa@cluster0.8ykw3.mongodb.net/mydb?retryWrites=true&w=majority";

MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
  if (err) throw err;

  var mydb = db.db(mydb);
  var created = moment().format("YYYY-MM-DD hh:mm:ss");

  app.use(express.urlencoded({ extended: true }));

  app.post("/signup", async (req, res) => {
    let formData = req.body;

    console.log(formData);

    // const saltRounds = 10;
    // const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

    // generate a new token
    const token = jwt.sign({ email: formData.email }, "secretKey");

    // insert user information and token into the database
    mydb
      .collection("signup")
      .insertOne({ ...formData, token: token }, (err, result) => {
        if (err) {
          res.send({ error: "An error has occurred" });
        } else {
          res.json({ token, result: result.ops[0] });
        }
      });
  });

  app.post("/login", async function (req, res) {
    let formData = req.body;

    const user = await mydb
      .collection("signup")
      .findOne({ useremail: formData.username });

    if (!user) {
      console.log(user);
      return res.status(401).send({ error: "User not found" });
    }

    if (formData.password !== user.password) {
      return res.status(401).send({ error: "Invalid password" });
    }

    let payload = {
      useremail: user.email,
      _id: user._id,
    };
    let token = jwt.sign(payload, "secretKey");
    res.json({ token, result: user });
  });

  app.get("/data", (req, res) => {
    mydb
      .collection("data")
      .find({})
      .toArray((err, result) => {
        if (err) {
          res.send({ error: "An error has occurred" });
        } else {
          res.json({ data: result });
        }
      });
  });
  // function authenticateToken(req, res, next) {
  //   // Get the token from the header
  //   const authHeader = req.headers["authorization"];
  //   const token = authHeader && authHeader.split(" ")[1];
  //   // console.log(token);
  //   if (token == null) return res.sendStatus(401);
  //   console.log(process.env.ACCESS_TOKEN_SECRET);
  //   // Verify and decode the token
  //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
  //     if (err) console.log(err);
  //     return res.sendStatus(403);
  //     req.user = user; //add this line
  //     next();
  //   });
  // }
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  app.get("/user-details", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized request" });
    }
    jwt.verify(token, "secretKey", (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Forbidden" });
      }
      console.log("User ID from JWT payload:", user._id);
      // Find the user in the database using the _id from the JWT payload
      mydb
        .collection("signup")
        .findOne({ _id: ObjectId(user._id) }, function (err, foundUser) {
          if (err) {
            return res.status(500).json({ error: "Error while finding user" });
          }
          if (!foundUser) {
            console.log("User not found in database");
            return res.status(404).json({ error: "User not found" });
          }
          // console.log("User found in database:", foundUser);
          const { username, useremail, perioddate, birthdate } = foundUser;
          res.status(200).json({
            username,
            useremail,
            perioddate,
            birthdate,
          });
        });
    });
  });

  // app.get("/user-details", authenticateToken, (req, res) => {
  //   console.log(req.user);
  //   // Find the user in the database using the _id from the JWT payload
  //   mydb
  //     .collection("signup")
  //     .findOne({ _id: ObjectId(req.user._id) }, function (err, user) {
  //       if (err) {
  //         return res.status(500).json({ error: "Error while finding user" });
  //       }
  //       if (!user) {
  //         return res.status(404).json({ error: "User not found" });
  //       }
  //       res.status(200).json({
  //         email: user.email,
  //         name: user.name,
  //         // other details
  //       });
  //     });
  // });

  // const upload = multer();
  app.post("/add-super-user", upload.none(), function (req, res) {
    // extract the data from the request body
    console.log(req.body);
    const { email, password, role } = req.body;
    console.log(email, password, role);

    // validate the data
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: "Error while hashing password" });
      }

      // create the super user object
      const superUser = { email, password: hashedPassword, role };

      // insert the super user into the database
      mydb.collection("superuser").insertOne(superUser, (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while adding the super user" });
        }

        res.json({ message: "Super user added successfully" });
      });
    });
  });

  app.post("/login-superuser", function (req, res) {
    // extract the data from the request body
    const { email, password } = req.body;
    console.log(email, password);

    // validate the data
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // find the superuser in the database
    mydb.collection("superuser").findOne({ email }, (err, superuser) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error while finding the superuser" });
      }
      if (!superuser) {
        return res.status(404).json({ error: "Superuser not found" });
      }

      // compare the provided password with the hashed password in the database
      bcrypt.compare(password, superuser.password, (err, isMatch) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while comparing passwords" });
        }
        if (!isMatch) {
          return res.status(401).json({ error: "Invalid password" });
        }

        // if the email and password are correct, create a JSON web token
        const payload = { email: superuser.email };
        const token = jwt.sign(payload, "secretKey");

        // return the token and the superuser information
        res.json({ token, superuser });
      });
    });
  });

  const multer = require("multer");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const uploads = multer({ storage });

  app.use(express.json()); // for parsing application/json
  app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  // app.use("/uploads", express.static(path.join(__dirname, "uploads")));app.use("/uploads", express.static(path.join(__dirname, "uploads")))
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.post("/upload", uploads.array("files"), (req, res) => {
    const files = req.files;
    const description = req.body.description;
    const email = req.email;
    // do something with the files and description here
    files.forEach((file) => {
      mydb
        .collection("superuser_uploads")
        .insertOne(
          { file: file.path, description: description },
          (err, result) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Error while uploading file" });
            }
          }
        );
    });
    res.json({ message: "Files uploaded successfully." });
  });

  app.get("/files", (req, res) => {
    mydb
      .collection("superuser_uploads")
      .find({})
      .toArray((err, result) => {
        if (err)
          return res.status(500).json({ error: "Error while fetching files" });
        res.json({ files: result });
      });
  });

  app.post("/faq", (req, res) => {
    const question = req.body.question;
    const answer = req.body.answer;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Both question and answer are required" });
    }

    mydb.collection("faq").insertOne({ question, answer }, (err, result) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error while inserting data into collection" });
      }
      res.status(200).json({ message: "Data inserted successfully" });
    });
  });
});
