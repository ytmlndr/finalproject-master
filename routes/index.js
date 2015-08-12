var datejs = require('datejs'); // DO NOT DELETE THIS
var express = require('express');
var router = express.Router();
var token = GLOBAL.token; //tokenID will be here

module.exports = function(passport) {

    // home page routing
    router.use('/',require('./root/main'));

    // user routing
    router.use('/login',require('./user/login')(passport));

    // patient routing
    router.use('/profile',require('./patient/profile'));
    router.use('/cancel_app',require('./patient/cancel_app'));
    router.use('/edit_details',require('./patient/edit_details'));
    router.use('/search_doctor',require('./patient/search_doctor'));

    // doctor routing

    return router;
};
