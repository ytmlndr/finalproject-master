var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');
var appointments = require('../../app/models/appointment');

router.get('/', auth.authenticate, function (req, res) {
    var query = appointments.find({});
    query.where('doctorID').equals(parseInt(req.session.user.user_id)).exec(function (err, appointments) {
        appointments.sort(utils.compare_appointments);
        var nextAppointments = appointments.filter(utils.remove_old_appointments);
        res.render('doctorSchedule', {appointments: nextAppointments});
    });
});

