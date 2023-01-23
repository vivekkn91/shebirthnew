var moment = require("moment");
var express = require("express");
var ObjectId = require("mongodb").ObjectID;
var bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var app = express();
app.listen(5002);
const multer = require("multer");
const upload = multer();
var bodyParser = require("body-parser");
// const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(express.json());
var MongoClient = require("mongodb").MongoClient;
var id = require("mongodb").ObjectID;

//Create a database named "mydb":    sudo service mongod start
var url =
  "mongodb+srv://vivekkn91:VGCJAMTmoyUKnnQa@cluster0.8ykw3.mongodb.net/mydb?retryWrites=true&w=majority";

MongoClient.connect(url, { useUnifiedTopology: true }, function (err, db) {
  if (err) throw err;

  var mydb = db.db(mydb);
  var created = moment().format("YYYY-MM-DD hh:mm:ss");

  // mydb.createCollection("questions", function (err, data) {
  // if (err) throw err;
  // var question = {
  //   question: "the first question",
  //   time: created,
  // };
  // mydb.collection("questions").insertOne(question, function (err, data) {
  //   if (err) throw err;
  //   console.log("Data created!");

  app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

    // Request methods you wish to allow
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
  });
  app.use(express.urlencoded({ extended: true }));

  app.post("/signup", async function (req, res) {
    let formData = req.body;
    // let bodyJson = JSON.parse(formData);
    console.log(formData);

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(formData.password, saltRounds);
    mydb
      .collection("signup")
      .insertOne({ ...formData, password: hashedPassword }, (err, result) => {
        // mydb.collection("signup").insertOne(formData, (err, result) => {
        if (err) {
          res.send({ error: "Ann error has occured" });
        } else {
          let payload = {
            email: formData.email,
          };
          let token = jwt.sign(payload, "secretKey");
          res.json({ token, result: result.ops[0] });
        }
      });

    // mydb
    //   .collection("questions")
    //   .insertOne(formData)
    //   .toArray(function (err, res) {
    //     if (err) throw err;
    //     console.log("1 document inserted");
    //   });
    // res.send(res);
  });

  app.post("/login", function (req, res) {
    let formData = req.body;
    mydb
      .collection("signup")
      .findOne({ email: formData.email }, function (err, user) {
        if (err) {
          return res.status(500).json({ error: "Error while finding user" });
        }
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        bcrypt.compare(
          formData.password,
          user.password,
          function (err, isMatch) {
            if (err) {
              return res
                .status(500)
                .json({ error: "Error while comparing passwords" });
            }
            if (!isMatch) {
              return res.status(401).json({ error: "Invalid password" });
            }
            console.log("email from db: ", user.email);
            console.log("password from db: ", user.password);
            // Query the superuser collection
            mydb
              .collection("superuser")
              .findOne({ email: formData.email }, function (err, superUser) {
                if (err) {
                  return res
                    .status(500)
                    .json({ error: "Error while finding superuser" });
                }
                if (!superUser) {
                  // if user is not a superuser
                  let payload = {
                    email: user.email,
                  };
                  let token = jwt.sign(payload, "secretKey");
                  res.json({ token, result: user, redirect: "/dashboard" });
                } else {
                  console.log("email from superuser db: ", superUser.email);
                  console.log(
                    "password from superuser db: ",
                    superUser.password
                  );
                  console.log("role from superuser db: ", superUser.role);
                  // if user is a superuser
                  let payload = {
                    email: superUser.email,
                  };
                  let token = jwt.sign(payload, "secretKey");
                  res.json({
                    token,
                    result: superUser,
                    redirect: "/superuser",
                  });
                }
              });
          }
        );
      });
  });

  const upload = multer();
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

  app.post("/questionpost", function (req, res) {
    let formData = req.body;
    // let bodyJson = JSON.parse(formData);
    console.log(formData);

    mydb.collection("questions").insertOne(formData, (err, result) => {
      if (err) {
        res.send({ error: "Ann error has occured" });
      } else {
        res.send(result.ops[0]);
      }
    });

    // mydb
    //   .collection("questions")
    //   .insertOne(formData)
    //   .toArray(function (err, res) {
    //     if (err) throw err;
    //     console.log("1 document inserted");
    //   });
    // res.send(res);
  });

  // app.post("/questionpost", jsonParser, function (req, res) {
  //   let data = req;
  //   console.log(data);
  // });

  app.get("/questapi", function (req, res) {
    console.log("apicalled");

    mydb
      .collection("questions")
      .find({})
      .toArray(function (err, data) {
        if (err) throw error;
        res.send(data);
      });
  });

  app.get("/questone/:gotid", function (req, res) {
    let id = req.params.gotid;
    // /console.log(id);
    mydb
      .collection("questions")
      .find({ _id: ObjectId(id) })
      .toArray(function (err, data) {
        if (err) throw error;
        console.log(data);
        res.send(data);
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
  const mime = require("mime-types");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(
        null,
        file.fieldname + "-" + Date.now() + "." + mime.extension(file.mimetype)
      );
    },
  });
  const uploads = multer({ storage });

  // const uploads = multer({ dest: "uploads/" }); // destination for uploaded files

  // parse application/json and application/x-www-form-urlencoded
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post("/upload", uploads.array("files"), (req, res) => {
    // req.files is an array of the uploaded files
    // req.body.description is the text field from the request body
    const files = req.files;
    const description = req.body.description;

    // do something with the files and description

    //     const files = req.files;
    // const description = req.body.description;

    // Save the file name and description in the "superuser_uploads" collection
    try {
      mydb.collection("superuser_uploads").insertOne(
        {
          fileName: files[0].originalname,
          description: description,
        },
        (err, result) => {
          if (err) {
            console.log(err);
            res.send("An error occurred while saving the file.");
          } else {
            res.send("Upload successful!");
          }
        }
      );
    } catch (error) {
      console.log(error);
      res.send("An error occurred while saving the file.");
    }
  });

  // app.listen(3000, () => {
  //   console.log("Server listening on port 3000");
  // });
});
