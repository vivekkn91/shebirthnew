var moment = require("moment");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.listen(5002);
const multer = require("multer");
const upload = multer();
var bodyParser = require("body-parser");

app.use(express.json());
var MongoClient = require("mongodb").MongoClient;
var id = require("mongodb").ObjectID;

//Create a database named "mydb":    sudo service mongod start
var url = "mongodb://localhost:27017/";

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
  app.post("/questionpost", function (req, res) {
    let formData = req.body;
    // let bodyJson = JSON.parse(formData);
    console.log(formData);

    mydb.collection("questions").insertOne(formData, function (err, res) {
      if (err) throw err;
      console.log("1 document inserted");
    });
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

  app.get("/questapi/:id", function (req, res) {
    console.log("apicalled");
    var o_id = new ObjectId(id);
    db.mydb.find({ _id: o_id });
    mydb
      .collection("questions")
      .find({ id })
      .toArray(function (err, data) {
        if (err) throw error;
        res.send(data);
      });
  });
});
