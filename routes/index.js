var datejs = require('datejs'); // DO NOT DELETE THIS
var express = require('express');
var router = express.Router();
var token = GLOBAL.token; //tokenID will be here

module.exports = function(passport) {

    // home page routing
    router.use('/',require('./root/main'));

    // user routing
    router.use('/login',require('./user/login')(passport));
    router.use('/register',require('./user/register'));

    // patient routing
    router.use('/profile',require('./patient/profile'));
    router.use('/cancel_app',require('./patient/cancel_app'));
    router.use('/edit_details',require('./patient/edit_details'));
    router.use('/search_doctor',require('./patient/search_doctor'));

    // doctor routing
    router.use('/doctor_profile',require('./doctor/profile'));
    router.use('/doctor_schedule',require('./doctor/schedule'));
    router.use('/doctor_edit_details',require('./doctor/edit_details'));

    return router;
};
