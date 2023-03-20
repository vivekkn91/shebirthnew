var moment = require("moment");
var express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
// const { Translate } = require("@google-cloud/translate").v2;
// // const projectId = "YOUR_PROJECT_ID"; // Your Google Cloud Platform project ID
// const translate = new Translate({
//   projectId: "shebirthnew",
//   keyFilename: "PATH_TO_YOUR_KEY_FILE",
// });
const https = require("https");
const path = require("path");
// require("dotenv").config();
var ObjectId = require("mongodb").ObjectID;

var bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
var app = express();
app.use(cors());

app.listen(5003);

const upload = multer();
var bodyParser = require("body-parser");

app.use(bodyParser.json());

app.use(express.json());
var MongoClient = require("mongodb").MongoClient;
var id = require("mongodb").ObjectID;
require("dotenv").config();
const secretKey = "secretKey";
// console.log(process.env.ACCESS_TOKEN_SECRET);
// app.use(express.json());

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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

    // generate a new token
    const token = jwt.sign({ email: formData.email }, "secretKey");

    // insert user information and token into the database
    mydb
      .collection("signup")
      .insertOne(
        { ...formData, password: hashedPassword, token: token },
        (err, result) => {
          if (err) {
            res.send({ error: "An error has occurred" });
          } else {
            res.json({ token, result: result.ops[0] });
          }
        }
      );
  });
  // app.post("/google/signup", async (req, res) => {
  //   const { email, displayName, token } = req.body;

  //   const user = await mydb.collection("signup").findOne({ email });

  //   if (user) {
  //     let payload = {
  //       useremail: user.email,
  //       _id: user._id,
  //     };

  //     let token = jwt.sign(payload, "secretKey");
  //     console.log(token, user);

  //     res.json({ token, result: { ...user, _id: user._id.toString() } });
  //   } else {

  //     const jwtToken = jwt.sign({ email }, "secretKey");

  //     mydb
  //       .collection("signup")
  //       .insertOne({ email, displayName, token, jwtToken }, (err, result) => {
  //         if (err) {
  //           res.send({ error: "An error has occurred" });
  //         } else {
  //           res.json({ token: jwtToken, result: result.ops[0] });
  //         }
  //       });
  //   }
  // });

  app.post("/google/signup", async (req, res) => {
    const { email, displayName, token } = req.body;

    // Check if email already exists in the database
    const user = await mydb.collection("signup").findOne({ email });

    if (user) {
      let payload = {
        useremail: user.email,
        _id: user._id,
      };

      let token = jwt.sign(payload, "secretKey");
      console.log(token, user);
      // Send the token and user data in response
      res.json({ token, result: { ...user, _id: user._id.toString() } });
    } else {
      // If user does not exist, generate a new token and insert user information into the database
      const jwtToken = jwt.sign({ email }, "secretKey");

      const newUser = {
        email,
        displayName,
        token,
        jwtToken,
      };

      mydb.collection("signup").insertOne(newUser, (err, result) => {
        if (err) {
          res.send({ error: "An error has occurred" });
        } else {
          // Send the token and user data in response
          const insertedUser = result.ops[0];
          res.json({
            token: jwtToken,
            result: { ...insertedUser, _id: insertedUser._id.toString() },
          });
        }
      });
    }
  });

  app.post("/login", async function (req, res) {
    try {
      let formData = req.body;
      console.log(formData);
      const user = await mydb
        .collection("signup")
        .findOne({ useremail: formData.username });

      if (!user) {
        console.log(user);
        return res.status(401).send({ error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(
        formData.password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).send({ error: "Invalid password" });
      }

      let payload = {
        useremail: user.email,
        _id: user._id,
      };
      let token = jwt.sign(payload, "secretKey");
      console.log(token, user);
      res.json({ token, result: user });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
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
          const {
            username,
            useremail,
            perioddate,
            email,
            birthdate,
            displayName,
            name,
          } = foundUser;
          res.status(200).json({
            name,
            email,
            username,
            displayName,
            useremail,
            perioddate,
            birthdate,
          });
        });
    });
  });

  app.post("/perioddate/update", (req, res) => {
    const { email, periodDate } = req.body;
    // update the period date for the user with the given email ID
    mydb
      .collection("signup")
      .updateOne(
        { email: email },
        { $set: { perioddate: periodDate } },
        function (err, result) {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error while updating period date" });
          }
          if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "User not found" });
          }
          res.status(200).json({ success: true });
        }
      );
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
  app.post("/addVideo", (req, res) => {
    const { title, category, description, youtubeUrl } = req.body;

    // Add validation checks here to ensure the required fields are present
    // and that the YouTube URL is valid before continuing.

    const video = { title, category, description, youtubeUrl };
    console.log(video);
    mydb.collection("superuser_uploads").insertOne(video, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error while adding video" });
      }
      res.json({ message: "Video added successfully" });
    });
  });

  // const storage = multer.diskStorage({
  //   destination: (req, file, cb) => {
  //     cb(null, "uploads/");
  //   },
  //   filename: (req, file, cb) => {
  //     cb(null, Date.now() + "-" + file.originalname);
  //   },
  // });

  // const uploads = multer({ storage });

  // app.use(express.json()); // for parsing application/json
  // app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  // app.post("/upload", uploads.array("files"), (req, res) => {
  //   const files = req.files;
  //   const { title, category, description } = req.body;
  //   const email = req.email;
  //   // do something with the files, title, category, and description here
  //   files.forEach((file) => {
  //     mydb
  //       .collection("superuser_uploads")
  //       .insertOne(
  //         {
  //           file: file.path,
  //           title: title,
  //           category: category,
  //           description: description,
  //         },
  //         (err, result) => {
  //           if (err) {
  //             return res
  //               .status(500)
  //               .json({ error: "Error while uploading file" });
  //           }
  //         }
  //       );
  //   });
  //   res.json({ message: "Files uploaded successfully." });
  // });

  app.post("/upload", (req, res) => {
    const { youtubeUrl, title, category, description } = req.body;
    // const email = req.email;
    // do something with the link, title, category, and description here
    mydb.collection("superuser_uploads").insertOne(
      {
        youtubeUrl: youtubeUrl,
        title: title,
        category: category,
        description: description,
      },
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: "Error while uploading link" });
        }
        res.json({ message: "Link uploaded successfully." });
      }
    );
  });

  // const storage = multer.diskStorage({
  //   destination: (req, file, cb) => {
  //     cb(null, "uploads/");
  //   },
  //   filename: (req, file, cb) => {
  //     cb(null, Date.now() + "-" + file.originalname);
  //   },
  // });

  // const uploads = multer({ storage });

  // app.use(express.json()); // for parsing application/json
  // app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  // app.post("/upload", uploads.array("files"), (req, res) => {
  //   const files = req.files;
  //   const { title, category, description } = req.body;
  //   const email = req.email;
  //   // do something with the files, title, category, and description here
  //   files.forEach((file) => {
  //     mydb.collection("superuser_uploads").insertOne(
  //       {
  //         file: file.path,
  //         title: title,
  //         category: category,
  //         description: description,
  //       },
  //       (err, result) => {
  //         if (err) {
  //           return res
  //             .status(500)
  //             .json({ error: "Error while uploading file" });
  //         }
  //       }
  //     );
  //   });
  //   res.json({ message: "Files uploaded successfully." });
  // });

  app.get("/getallCatogories", (req, res) => {
    mydb
      .collection("superuser_uploads")
      .distinct("category", (err, categories) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while retrieving categories" });
        }
        res.json(categories);
      });
  });
  app.get("/getallTitlesByCategory/:category", (req, res) => {
    const { category } = req.params;
    mydb
      .collection("superuser_uploads")
      .find({ category })
      .toArray((err, titles) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while retrieving titles" });
        }
        res.json(titles);
      });
  });
  app.get("/getVideosByTitle/:title", (req, res) => {
    const { title } = req.params;
    mydb
      .collection("superuser_uploads")
      .find({ title })
      .toArray((err, videos) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while retrieving videos" });
        }
        res.json(videos);
      });
  });

  app.get("/getallDAta", (req, res) => {
    mydb
      .collection("superuser_uploads")
      .find()
      .toArray((err, docs) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while retrieving files" });
        }
        res.json(docs);
      });
  });

  app.get("/getallTitleDAta/:category", (req, res) => {
    const category = req.params.category;
    mydb
      .collection("superuser_uploads")
      .find({ category })
      .toArray((err, docs) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while retrieving files" });
        }
        res.json(docs);
      });
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
  app.get("/getfaq", (req, res) => {
    mydb
      .collection("faq")
      .find({})
      .toArray((err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error while fetching data from collection" });
        }
        res.status(200).json({ faqs: data });
      });
  });
});
