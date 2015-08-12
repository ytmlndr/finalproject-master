var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

module.exports = function(passport){

    console.log('configuring middlewares');

    app.use(logger('dev'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');

    app.use(session(
        {
            secret: 'yotamlenderkfiryahalommichaelabramov',
            resave: true,
            saveUninitialized: false
        })); //THIS IS GOLD!!

    app.use(express.static(path.join(__dirname, '../js')));
    app.use(express.static(path.join(__dirname, '../views/css')));

    app.use(passport.initialize());
    app.use(passport.session());

    return app;
};
