var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');

router.get('/', auth.authenticate, function (req, res) {
    res.render('doctoreditdetails', {user: req.user, message: ""});
});
