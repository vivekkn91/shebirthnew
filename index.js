var moment = require("moment");
var express = require("express");
var ObjectId = require("mongodb").ObjectID;
const { ExploreTrendRequest } = require("g-trends");
var bodyParser = require("body-parser");
var app = express();

// if (process.env.NODE_ENV == "production") {
//   app.use(express.static("portfolio/build"));
//   const path = require("path");
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "portfolio", "build", "index.html"));
//   });
// }
app.listen(process.env.PORT || 5002);
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

    mydb.collection("questions").insertOne(formData, (err, result) => {
      if (err) {
        res.send({ error: "Ann error has occured" });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.post("/answerpost", function (req, res) {
    let formData = req.body;
    // let bodyJson = JSON.parse(formData);
    // console.log(formData);

    mydb.collection("answers").insertOne(formData, (err, result) => {
      if (err) {
        res.send({ error: "Ann error has occured" });
      } else {
        res.send(result.ops[0]);
      }
    });
  });

  app.get("/answersapi/:gotid", function (req, res) {
    let id = req.params.gotid;
    console.log(id);
    mydb
      .collection("answers")
      .find({ question_id: id })
      .toArray(function (err, data) {
        if (err) throw error;
        res.send(data);
      });
  });

  // mydb
  //   .collection("questions")
  //   .insertOne(formData)
  //   .toArray(function (err, res) {
  //     if (err) throw err;
  //     console.log("1 document inserted");
  //   });
  // res.send(res);

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

  //http://localhost:5002/answerpost
  // increment;

  app.post("/increment", function (req, res) {
    let id = req.body;
    var correctcount = id.correctcount + 1;
    //var ansid = id.Answer_id;
    var realid = ObjectId(id.Answer_id);
    console.log(correctcount);

    // var myquery = { address: "Valley 345" };
    // var newvalues = { $set: { name: "Mickey", address: "Canyon 123" } };
    // dbo
    //   .collection("customers")
    //   .updateOne(myquery, newvalues, function (err, res) {
    //     if (err) throw err;
    //     console.log("1 document updated");
    //     db.close();
    //   });

    mydb
      .collection("answers")
      .updateOne(
        { _id: realid },
        { $set: { correctcount: correctcount } },
        function (err, data) {
          if (err) throw err;
          console.log("1 document updated");
          res.send(data);
        }
      );
  });

  app.post("/decrementer", function (req, res) {
    let id = req.body;
    var wrongcount = id.wrongcount - 1;
    //var ansid = id.Answer_id;
    var realid = ObjectId(id.Answer_id);
    console.log(wrongcount);

    // var myquery = { address: "Valley 345" };
    // var newvalues = { $set: { name: "Mickey", address: "Canyon 123" } };
    // dbo
    //   .collection("customers")
    //   .updateOne(myquery, newvalues, function (err, res) {
    //     if (err) throw err;
    //     console.log("1 document updated");
    //     db.close();
    //   });

    mydb
      .collection("answers")
      .updateOne(
        { _id: realid },
        { $set: { wrongcount: wrongcount } },
        function (err, data) {
          if (err) throw err;
          console.log("1 document updated");
          res.send(data);
        }
      );
  });

  app.get("/questone/:gotid", function (req, res) {
    let id = req.params.gotid;
    // /console.log(id);
    mydb
      .collection("questions")
      .find({ _id: ObjectId(id) })
      .toArray(function (err, data) {
        if (err) throw error;
        //console.log(data);
        res.send(data);
      });
  });

  //trend api call

  app.post("/trend", function () {
    const explorer = new ExploreTrendRequest();
    console.log("api calling 1");
    explorer
      .addKeyword("Dream about snakes")
      .compare("Dream about falling")
      .download()
      .then((csv) => {
        console.log(
          "[✔] Done, take a look at your beautiful CSV formatted data!"
        );
        console.log(csv);
      })
      .catch((error) => {
        console.log("[!] Failed fetching csv data due to an error", error);
      });
  });
});
