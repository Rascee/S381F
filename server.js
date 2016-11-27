var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://rascee:123@ds111178.mlab.com:11178/test2';
var mongoose = require('mongoose');
var app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// Define virtual paths

app.get('/', function(req, res) {
  	res.redirect('/login');
});

app.get('/login', function(req, res) {
  	res.sendFile(__dirname+'/login.html');
});

app.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	
});

app.get('/createaccount', function(req, res) {
  	res.sendFile(__dirname+'/createaccount.html');
});

app.post('/createaccount', function(req, res) {
	var username = req.body.username;
	var password1 = req.body.password1;
	var password2 = req.body.password2;
	if(password1!=password2)
		res.redirect('/createaccount');
	if(username=="")
		res.redirect('/createaccount');
	if(password1=="")
		res.redirect('/createaccount');
	console.log('Success');
	/*MongoClient.connect(mongourl,function(err,db) {
      	console.log('Connected to mlab.com');
      	assert.equal(null,err);
      	insertUser(db, req.param('username'), req.param('password1'), function() {
      	db.close();
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end('Insert was successful');
  		  });
    });*/
    mongoose.connect(mongourl);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console,'connection error'));
    db.once('open', function() {
    console.log('Prepare to create:\n');
    var newUser = new user({username: req.body.username, password: req.body.password1});
      newUser.save(function(err) {
          if (err) throw err;
          console.log('Insert was successful ');
          db.close();
          res.writeHead(200, {"Content-Type": "text/plain"});
          res.end('Insert was successful ');
      });
    });
    /*var newUser = new user({username: req.body.username, password: req.body.password});
    newUser.save(function(err) {
      if(err) {
        console.log('error');
        return;
      }
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end('Insert was successful');
    });*/
});
var Schema = mongoose.Schema;
var userSchema = new Schema({
  username: String,
  password: String
});

var user = mongoose.model('user', userSchema, 'user');

/*var insertUser = function(db, username, password, callback) {
   	db.collection('user').insertOne( {
   		'username':username,
   		'password':password
}, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the user collection.");
    callback();
  });
};*/

var server = app.listen(8099, function () {
  var port = server.address().port;
  console.log('Server listening at ', port);
});
