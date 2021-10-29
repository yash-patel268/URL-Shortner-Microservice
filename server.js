require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var mongo = require("mongodb");
var mongoose = require("mongoose");
let bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let uri = "mongodb+srv://newuser:"+
          process.env.DB_URI+ 
          "@cluster0.dckhd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number
});

let Url = mongoose.model("Url", urlSchema);
let responseObject = {};
app.post("/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (request, response) => {
    let inputUrl = request.body["url"];
    let urlRegex = new RegExp(
      /^https:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
    );

    if (!inputUrl.match(urlRegex)) {
      console.log('Unmatched')
      response.json({ error: "invalid url" });
      return;
    }

    responseObject["original_url"] = inputUrl;

    let inputShort = 1;

    Url.findOne({})
      .sort({ short: "desc" })
      .exec(function(error, result){
        if (!error && result != undefined) {
          inputShort = result.short + 1;
        }
        if (!error) {
          Url.findOneAndUpdate(
            { original: inputUrl },
            { original: inputUrl, short: inputShort },
            { new: true, upsert: true },
            (error, savedUrl) => {
              if (!error) {
                responseObject["short_url"] = savedUrl.short;
                response.json(responseObject);
              }
            }
          );
        }
      });
  }
);

app.get("/api/shorturl/:input", function(request, response){
  let input = request.params.input;

  Url.findOne({ short: input }, function(error, result){
    if (!error && result != undefined) {
      response.redirect(result.original);
    } else {
      response.json({ error: 'invalid url' });
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
