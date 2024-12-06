if (process.platform === "win32") {
    let rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    //graceful shutdown
    process.exit();
});

let session = require('express-session');
let MongoDBStore = require('connect-mongodb-session')(session);
let express = require('express');
let cookieParser = require('cookie-parser');
let morgan = require('morgan');
let cors = require("cors");
let app = express();
let passport = require("passport");
let config = require('../config/config');
// const corsSetup = cors({
//     origin:true, 
//     preflightContinue: true,
//     exposedHeaders: ["GET,DELETE,POST,PUT,OPTIONS,PATCH"],
//     allowedHeaders:["X-Requested-With, Content-type,Accept,X-Access-Token,X-Key"]});
// app.use(corsSetup);
// // app.use(cors({ origin: "http://localhost:3000" , allowedHeaders:["Allow-origin"], preflightContinue:true}))


//app.options('*',cors({origin:'http://localhost:3000'}));
let allowCrossDomain = function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || "*");

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization,apikey');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
    // // intercept OPTIONS method
    // if ('OPTIONS' == req.method) {
    //   res.send(204);
    // }
    // else {
    //   next();
    // }
};
app.all('*',allowCrossDomain);
app.options('*',cors());

//View engine
app.set('view engine', 'html');
//Http logger
app.use(morgan(':remote-addr - :remote-user :method :url :status :res[content-length] - :response-time ms'));

//JSON body
//app.use(express.json({limit:"10mb"}));
app.use(express.json({verify: (req,res,buf) => { req.rawBody = buf }, limit:"10mb"}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
let store = new MongoDBStore({
    uri: config.Database.URI,
    databaseName: config.Database.DBName
  });
  
// Catch errors
store.on('error', function(error) {
    console.log(error);
  });
  
app.use(session({
    resave : false,
    secret : "CAYPHSRDgBWrdkCzfA7TNjrW5jGULqZR",
    cookie : {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
      },    
    store: store,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

// error handler
// app.use(errorHandler);
// app.use((err, req, res, next) => {
//     errorHandler(err, req, res, next);
// });

module.exports = app ;
