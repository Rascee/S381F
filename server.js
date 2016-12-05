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

app.get('/search', function(req, res) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    if(req.query.searchby=='Name') {
      restaurant.find({'name':req.query.searchtarget}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.render('list',{username:req.session.username, r:restaurants});
        res.end();
      });
    } else if(req.query.searchby=='cuisine') {
      restaurant.find({'cuisine':req.query.searchtarget}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.render('list',{username:req.session.username, r:restaurants});
        res.end();
      });
    } else {
      restaurant.find({'borough':req.query.searchtarget}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.render('list',{username:req.session.username, r:restaurants});
        res.end();
      });
    }
  });
});

app.get('/api/create', function(req, res) {
	var r = {};
	r = req.body;
	if (r.name != null) {
	mongoose.connect(mongourl);
	var db = mongoose.connection;
	var restSchema = require('./restaurant');
	db.on('eror', console.error.bind(console,'connection error'));
	db.once('open', function() {
		var newR = new Restaurant(r);
		newR.save(function(err) {
			if (err) {
			db.close();
			res.json({message: 'Insertion failed'});
			}
			else {
			db.close();
			res.json({
				status: 'ok, _id:' +newR._id
			});
			}
		});	
	});
	} else {
	res.json({
	status: 'failed'
	});
	}
});

app.get('/api/read/:name/:value', function(req, res) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    if(req.params.name=='name') {
      restaurant.find({'name':req.params.value}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(restaurants));
        res.end();
      });
    } else if(req.params.name=='cuisine') {
      restaurant.find({'cuisine':req.params.value}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(restaurants));
        res.end();
      });
    } else {
      restaurant.find({'borough':req.params.value}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.send(JSON.stringify(restaurants));
        res.end();
      });
    }
  });
});

/*app.get('/api/read/:name/:value', function(req, res) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
      restaurant.find({'name':req.params.value}, function(err, restaurants) {
        if(err) return console.log(err);
        db.close();
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(restaurants));
        res.end();
      });
  });
});*/

app.get('/details', function(req, res){
  //var id = req.query.id;
  read_n_print2(req, res, {_id:req.query.id});
});

app.get('/login', function(req, res) {
  res.sendFile(__dirname+'/login.html');
});

app.get('/restaurants', function(req, res) {
  read_n_print(req, res);
});

app.get('/edit', function(req, res) {
  req.session.restaurant_id = req.query.id;
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    restaurant.findOne({_id:ObjectId(req.session.restaurant_id)}, function(err, restaurants) {
      if(err) return console.log(err);
      db.close();
      if(req.session.username==restaurants.uploaduser) {
        res.render('edit',{username:req.session.username, r:restaurants});
        res.end();
      } else {
        res.end('You have no right to do it.');
      }
    });
  });
});

app.post('/edit', function(req, res) {
  var coordArray = [req.body.lon, req.body.lat];
  if(req.body.name=="") {
    res.end("Name should not be empty.");
  } else {
    mongoose.connect(mongourl);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console,'connection error'));
    db.once('open', function() {
      //console.log('Prepare to create:\n');
      //var newR = new restaurant(r);
    restaurant.update(
      {_id: req.session.restaurant_id}, 
      {$set: 
        {
          'name': req.body.name,
          'cuisine': req.body.cuisine,
          'borough':req.body.borough,
          'address.street':req.body.street,
          'address.zipcode':req.body.zipcode,
          'address.building':req.body.building,
          'address.coord':coordArray,
          'uploaduser':req.session.username,
          'img.data':req.files.img.data.toString('base64'),
          'img.contentType':'image/png'
        }
      }, function(err, result) {
        if(err) throw err;
        console.log('Edit successfully.');
        db.close();
        res.end('Edit successfully.');
      });
    });
  }
});

app.get('/rate', function(req, res) {
  req.session.restaurant_id = req.query.id;
  res.set('content-type','text/html');
  res.write('<html><head><title>Rate</title></head><body>');
  res.write('<form action="/rate" method="POST">');
  res.write('Score (1-10)<br>');
  res.write('<input type="text" name="score"><br>');
  res.write('<input type="submit" name="rate" value="Rate">');
  res.end('</form></body></html>');
});

app.post('/rate', function(req, res) {
  console.log(req.session);
  console.log(req.body.score);
  /*MongoClient.connect(mongourl,function(err,db) {
    //console.log('Connected to mlab.com');
    assert.equal(null,err);
    findRateNum(db, req, res, function(result){
      count = result.length;
      console.log('count='+count);
    });
    if(count!=0) {
      res.end('You have already rated the restaurant.');
    } else {
        db.collection('restaurant').update({_id: ObjectId(req.session.restaurant_id)}, 
                                          {$push: {'rates':{rate: req.body.score, user: req.session.username}}});
        res.end('Rate successfully');
    }
    db.close();
  });*/
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    restaurant.aggregate({$unwind:'$rates'},{$match:{_id:ObjectId(req.session.restaurant_id), 'rates.user': req.session.username}}, function (err, result) {  
      if(result.length==0) {
        if(req.body.score>=0&&req.body.score<=10) {
          restaurant.update({_id:ObjectId(req.session.restaurant_id)}, {$push:{'rates':{rate:req.body.score, user: req.session.username}}}, function(err, doc) {
            db.close();
            console.log(doc);
            res.end('Rate successfully.');
          });
        } else {
          res.end('Rate should be 1-10');
        }
      } else {
        db.close();
        res.end('You are already rated the restaurant');
      }
    });
  });
});

app.get('/delete', function(req, res) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    restaurant.findOneAndRemove({_id:ObjectId(req.query.id), uploaduser: req.session.username}, function (err, result) {  
      db.close();
      if(result==null) {
        res.end('You have no right to do it');
      } else {
        res.end('Restaurant removed');
      }
    });
  });
});

app.get('/logout', function(req, res) {
  req.session = null;
  res.redirect('/login');
});

app.get("/map", function(req,res) {
	var lat  = req.query.lat;
	var lon  = req.query.lon;
	var zoom = 18;

	res.render("map.ejs",{lat:lat,lon:lon,zoom:zoom});
	res.end();
});

app.get('/create', function(req, res) {
  res.sendFile(__dirname+'/create.html');
});

app.post('/create', function(req, res) {
  console.log(req.files);
  console.log(req.session.username);
  var coordArray = [req.body.lon, req.body.lat];
  var r = new restaurant({
    'name':req.body.name,
    'cuisine':req.body.cuisine,
    'borough':req.body.borough,
    'address.street':req.body.street,
    'address.zipcode':req.body.zipcode,
    'address.building':req.body.building,
    'address.coord':coordArray,
    'uploaduser':req.session.username,
    'img.data':req.files.img.data.toString('base64'),
    'img.contentType':'image/png'
  }); 
  /*r['address'] = {};
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
  //r['img'] = req.files.img.data.toString('base64');
  r['img'] = {};
  r.img.data = req.files.img.data.toString('base64');
  r.img.contentType = 'image/png';*/
  if(req.body.name=="") {
    res.end("Name should not be empty.");
  } else {
    mongoose.connect(mongourl);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console,'connection error'));
    db.once('open', function() {
      //console.log('Prepare to create:\n');
      //var newR = new restaurant(r);
      r.save(function(err) {
        if (err) throw err;
        console.log('Restaurant Added');
        db.close();
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end('Restaurant Added');
      });
    });
  }
  //res.writeHead(200, {"Content-Type": "text/plain"});
  //res.end('gg');
})

/*app.post('/api/create', function(req, res) {
  //console.log(req.files);
  //console.log(req.session.username);
  var coordArray = [req.body.lon, req.body.lat];
  var r = new restaurant({
    'name':req.body.name,
    'cuisine':req.body.cuisine,
    'borough':req.body.borough,
    'address.street':req.body.street,
    'address.zipcode':req.body.zipcode,
    'address.building':req.body.building,
    'address.coord':coordArray,
    'uploaduser':req.session.username,
    'img':
  }); 
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    //var newR = new restaurant(r);
    r.save(function(err, result) {
      if (err) throw err;
      console.log('Restaurant Added');
      db.close();
      res.writeHead(200, {"Content-Type": 'application/json'});
      res.write(JSON.stringify(result));
      res.end();
    });
  });
  //res.writeHead(200, {"Content-Type": "text/plain"});
  //res.end('gg');
});*/

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
  img: {data: String, contentType: String},
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

function read_n_print(req, res, criteria) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    restaurant.find(criteria, function(err, restaurants) {
      if(err) return console.log(err);
      db.close();
      res.render('list',{username:req.session.username, r:restaurants});
      res.end();
    });
  });
}

function findRateNum(db, req, res, callback) {
  db.collection('restaurant').aggregate([{$unwind:"$rates"}, {$match:{_id: mongoose.Types.ObjectId(req.session.restaurant_id), 'rates.user': req.session.username}}], function(err, result) {
    assert.equal(err, null);
    callback(result);
  });
};

function pushRate(db, req, res, callback) {
  assert.equal(err, null);
  callback(result);
};

function read_n_print2(req, res, criteria) {
  mongoose.connect(mongourl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console,'connection error'));
  db.once('open', function() {
    //console.log('Prepare to create:\n');
    restaurant.findOne(criteria, function(err, restaurants) {
      if(err) return console.log(err);
      //var imgFile = new Buffer(restaurants.img.data, 'base64');
      db.close();
      console.log(restaurants);
      //console.log(JSON.stringify(restaurants[0].coord));
      //var coord = JSON.stringify(restaurants.coord);
      res.render('details',{username:req.session.username, r:restaurants});
      res.end();
    })
  });
}

var server = app.listen(process.env.VCAP_APP_PORT, function () {
  var port = server.address().port;
  //console.log('Server listening at ', port);
});
