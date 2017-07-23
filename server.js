var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");


mongoose.Promise = Promise;

var app = express();


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/scrappingWithMongo");
var db = mongoose.connection;


db.on("error", function(err) {
  console.log("Mongoose Error: ", err);
});


db.once("open", function() {
  console.log("Mongoose connection successful");
});



app.get("/scrape", function(req, res) {
  
  request("http://www.nytimes.com", function(err, response, html) {
    
    var $ = cheerio.load(html);
  
    $("trb_outfit_relatedListTitle_a").each(function(i, element) {

     
      var result = {};

      
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      
      var entry = new Article(result);

      
      entry.save(function(err, doc) {        
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
    });
  });
  res.send("Finished Scrapping");
});


app.get("/articles", function(req, res) {

  Article.find({}, function(err, doc) {
    if(err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});


app.get("/articles/:id", function(req, res) {

  Article.findOne({ "_id": req.params.id})

  .populate("note")
  .exec(function(err, doc) {
    if(err) {
      console.log(err)
    } else {
      res.json(doc);
    }
  });
});


app.post("/articles/:id", function(req, res) {

  var someNote = new Note(req.body);

  someNote.save(function(err, doc) {
    if(err) {
      console.log(err);
    } else {
      Article.findOneAndUpdate({"_id": req.params.id}, {"note": doc._id})
      .exec(function(err, doc) {
        if(err) {
          console.log(err);
        } else {
          res.send(doc);
        }
      });
    }
  });

});


app.listen(3000, function() {
  console.log("App running on port 3000!");
});