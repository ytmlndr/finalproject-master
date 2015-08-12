var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');

// models
var patient = require('../../app/models/patient');

router.get('/', auth.authenticate, function (req, res) {
    res.render('edit_details', {user: req.user, message: ""});
});

router.post('/', auth.authenticate, function (req, res) {
    if (req.body.city != "" && req.body.street != "" && req.body.zipcode != "" && req.body.phone != "" &&
        req.body.email != "" && req.body.minutes != "") {
        patient.update(
            {user_id: parseInt(req.session.user.user_id, 10)},
            {
                $set: {
                    "address.city": req.body.city,
                    "address.street": req.body.street,
                    "address.zip_code": req.body.zipcode,
                    "phone_number": req.body.phone,
                    "email": req.body.email,
                    "minutes_to_be_notify_before": req.body.minutes
                }
            },
            function (err) {
                if (err) {
                    res.render('editdetails', {message: "All Fields Must Be Not Empty"});
                } else {
                    console.log("patient update successful");
                }
            }
        );

        return res.redirect('/profile');
    }
    else {
        res.render('editdetails', {message: "All Fields Must Be Not Empty"});
    }
});

module.exports = router;