var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://rascee:123@ds111178.mlab.com:11178/test2';
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
	var username = req.param('username');
	var password = req.param('password');
	
});

app.get('/createaccount', function(req, res) {
  	res.sendFile(__dirname+'/createaccount.html');
});

app.post('/createaccount', function(req, res) {
	var username = req.param('username');
	var password1 = req.param('password1');
	var password2 = req.param('password2');
	if(password1!=password2)
		res.redirect('/createaccount');
	if(username=="")
		res.redirect('/createaccount');
	if(password1=="")
		res.redirect('/createaccount');
	console.log('Success');
	MongoClient.connect(mongourl,function(err,db) {
      	console.log('Connected to mlab.com');
      	assert.equal(null,err);
      	insertUser(db, req.param('username'), req.param('password1'), function() {
      	db.close();
  		});
    });

});

var insertUser = function(db, username, password, callback) {
   	db.collection('user').insertOne( {
   		'username':username,
   		'password':password
}, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the user collection.");
    callback();
  });
};

var server = app.listen(8099, function () {
  var port = server.address().port;
  console.log('Server listening at ', port);
});
