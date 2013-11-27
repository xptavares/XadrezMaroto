var express = require('express'), 
    passport = require('passport'), 
    flash = require('connect-flash'), 
    LocalStrategy = require('passport-local').Strategy,
    connect = require('connect'),
    xtend = require('xtend'),
    app = express(),
    server = require('http').createServer(app), 
    io = require('socket.io').listen(server), 
    passportSocketIo = require("passport.socketio")
    _ = require('underscore');


var sessionStore    = new connect.session.MemoryStore(),
    sessionSecret  = 'asdasdsdas1312312',
    sessionKey    = 'test-session-key',
    sessionOptions = {
      store:  sessionStore,
      key:    sessionKey,
      secret: sessionSecret
    };

var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com', on: false }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com', on: false }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
};

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

function findAllUsers(fn){

  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.on) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        user.on = true;
        return done(null, user);
      })
    });
  }
));



// configure Express
app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.engine('ejs', require('ejs-locals'));
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session(sessionOptions));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.methodOverride());
    app.use(flash());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.get('/game/:id', ensureAuthenticated, function(req, res){
   var game = _.find(games, function(val){ return val.id == req.params.id });
   res.render('game', { user: req.user, message: req.flash('error'), game: game });
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });
  
// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
/*
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});
*/

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


server.listen(app.get('port'));

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
};


/*
* Web Socket
*/
var position = 'start';
var queue = [];
var games = [{id: 1, player1: 0, player2: 0, position: 'start'}];

// set authorization for socket.io
var options = {};
options.cookieParser = express.cookieParser;
io.configure(function(){
  this.set('authorization', passportSocketIo.authorize(xtend(sessionOptions, options)));

  this.set('log level', 0);
});

io.of('/game').on('connection', function (socket) {
  
  socket.emit('newPosition', position);
  
  socket.on('disconnect', function () {
    //socket.emit('onlines', findUsersOnline());
    socket.broadcast.emit('user connected');
  });

  socket.on('move', function (data) {
    console.log(data);
    position = data.newPos;
    socket.broadcast.emit('move', data);
  });
});

io.of('/queue').on('connection', function (socket) {
  socket.on('queue', function(data){     
     if(data === 'start'){
      socket.emit('game', data);
      if (socket.handshake.user) {
        var user_id = socket.handshake.user.id;
        if(!_.contains(queue, user_id)){
          console.log(queue);
          findGame(user_id, function(err, msg){
            if(err){
              queue.push(user_id);
            }
            console.log(games);
            console.log(msg);
          });
        }
      }
     } else {
      socket.emit('game', data);
     }
  });
});


var findGame = function(user_id, callback){
  if(!_.isEmpty(queue)){
    return createGame(user_id, callback);
  } else {
    return callback(true, 'no Game!');
  }
}

var createGame = function(user_id, callback){
  var playerTwo = _.first(queue);
  queue = _.without(queue, playerTwo);
  var game_id = _.last(games).id + 1; 
  var game = {id: game_id, player1: user_id, player2: playerTwo};
  games.push(game);
  return callback(false, 'Game Created!');
}