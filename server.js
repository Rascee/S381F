var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var session = require('cookie-session');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://rascee:123@ds111178.mlab.com:11178/test2';
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');
var app = express();

app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({name: 'session',keys: ['key1','key2']}));
// Define virtual paths

app.get('/', function(req, res) {
  if(req.session.username) 
    res.redirect('/restaurants');
  else 
    res.redirect('/login');
});

app.get('/login', function(req, res) {
  res.sendFile(__dirname+'/login.html');
});

app.get('/restaurants', function(req, res) {
  read_n_print(req, res);
});

app.get('/logout', function(req, res) {
  req.session = null;
  res.redirect('/login');
});

app.get("/map", function(req,res) {
	var lat  = req.query.lat;
	var lon  = req.query.lon;
	var zoom = req.query.zoom;

	res.render("map.ejs",{lat:lat,lon:lon,zoom:zoom});
	res.end();
});

app.get('/create', function(req, res) {
  res.sendFile(__dirname+'/create.html');
});

app.post('/create', function(req, res) {
  console.log(req.files);
  console.log(req.session.username);
  var r = {}; 
  r['address'] = {};
  r.address.street = (req.body.street != null) ? req.body.street : null;
  r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
  r.address.building = (req.body.building != null) ? req.body.building : null;
  r.address['coord'] = [];
  r.address.coord.push(req.body.lon);
  r.address.coord.push(req.body.lat);
  r['borough'] = (req.body.borough != null) ? req.body.borough : null;
  r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
  r['name'] = (req.body.name != null) ? req.body.name : null;
  r['rates'] = [];
  r['uploaduser'] = req.session.username;
  //r['img'] = (req.files.img.data.toString() != null) ? req.files.img.data.toString('base64') : null;
  r['img'] = req.files.img.data.toString('base64');
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    var newR = new restaurant(r);
    newR.save(function(err) {
      if (err) throw err;
      console.log('Restaurant Added');
      db.close();
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end('Restaurant Added');
    });
  });
  //res.writeHead(200, {"Content-Type": "text/plain"});
  //res.end('gg');
})

app.post('/login', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;	
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    user.count({username: username}, function(err, num) {
      if(num==0) {
        db.close();
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end('Username is not existed');
      } else {
        user.findOne({username: username}, function(err, user) {
          if(password==user.password) {
            db.close();
            req.session.username = username;
            //res.writeHead(200, {"Content-Type": "text/plain"});
            //res.end('Welcome, '+req.session.username);
            res.redirect('/restaurants');
          } else {
            db.close();
            res.writeHead(200, {"Content-Type": "text/plain"});
            res.end('Incorrect password');
          }
        });
      }
    });
  });
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
      console.log('Account created');
      db.close();
      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end('Account created');
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
var restaurantSchema = new Schema({
  name: {type: String, required: true},
  cuisine: String,
  borough: String,
  address: {street: String, building: String, zipcode: String, coord:[Number]},
  rates: [{rate:{type: Number, min: 0, max: 10}, user: String}],
  img: String,
  uploaduser: String
});

var user = mongoose.model('user', userSchema, 'user');
var restaurant = mongoose.model('restaurant', restaurantSchema, 'restaurant');
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

function read_n_print(req, res) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    restaurant.find(function(err, restaurants) {
      if(err) return console.log(err);
      db.close();
      res.render('list',{username:req.session.username, r:restaurants});
      res.end();
    })
  });
}

var server = app.listen(8099, function () {
  var port = server.address().port;
  console.log('Server listening at ', port);
});
