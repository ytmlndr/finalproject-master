var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');

router.get('/', auth.authenticate, function (req, res) {
    res.render('doctor_profile', {user: req.user, message: ""});
});
