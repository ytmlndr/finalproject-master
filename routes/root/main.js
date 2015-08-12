var express = require('express');
var router = express.Router();
var url = require('url');
var mobile_identifier = require('../user/mobile_identifier');

router.get('/', function (req, res) {
    renderToIndexAfterLogin(req,res);
});

router.get('/login', function (req, res) {
    renderToIndexAfterLogin(req,res);
});

var renderToIndexAfterLogin = function (req, res) {

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    GLOBAL.token = query.tokenID; //GETTING TOKEN FROM url

    if (req.session.messages == null) {
        req.session.messages = '';
    }

    if(mobile_identifier.isMobile(req)) {
        res.render('index_mobile',{message:req.session.message});
    }
    else {
        res.render('index', {message: req.session.messages});
    }
}

module.exports = router;
