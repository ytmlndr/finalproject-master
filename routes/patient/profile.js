var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');
var appointments = require('../../app/models/appointment');
var utils = require('../../common/utils');

router.get('/', auth.authenticate, function (req, res) {
    var query = appointments.find({});
    query.where('patientID').equals(parseInt(req.session.user.user_id)).exec(function (err, appointments) {
        appointments.sort(utils.compare_appointments);
        var nextAppointments = appointments.filter(utils.remove_old_appointments);
        res.render('profile', {user: req.user, appointments: nextAppointments});
    });
});

module.exports = router;