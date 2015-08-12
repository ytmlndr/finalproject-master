
var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');
var url = require('url');

// models
var push_handler = require('../../app/pushHandler') // do not include the dot js
var patient = require('../../app/models/patient');
var appointments = require('../../app/models/appointment');

router.get('/', auth.authenticate, function (req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    if (query.app != undefined) {
        var i = parseInt(query.app);
        var q = appointments.find({});
        q.where('patientID').equals(parseInt(req.session.user.user_id)).exec(function (err, appointments) {

            appointments.sort(utils.compare_appointments);
            var next_appointments = appointments.filter(utils.remove_old_appointments);

            //adding the push of preferred appointment
            patient.find({}).where('user_id').in(next_appointments[i].waitingPatientArray).exec(function (err, patients) {
                if (!err) {
                    var tokenArray=[];
                    var now = new Date();

                    // TODO copy code! need to be separate!!!
                    var year = now.getFullYear();
                    var month = now.getMonth() + 1;
                    if (month < 10)
                        month = '0' + month;
                    var day = now.getDate();

                    now = day + '/' + month + '/' + year;

                    patients.forEach(function (pat) {
                        tokenArray.push(pat.token_id);

                    });

                    var msg = "Preferred appointment is now available on " +
                        next_appointments[i].date +
                        " at " +
                        next_appointments[i].realStartTime +
                        " check now!";
                    push_handler.sendPush(now, "06:00", 0, tokenArray, msg);
                }
            });

            //end of preferred appointment code
            appointments.where().findOneAndRemove(
                {
                    patientID: next_appointments[i].patientID,
                    doctorID: next_appointments[i].doctorID,
                    date: next_appointments[i].date,
                    day: next_appointments[i].day,
                    realStartTime: next_appointments[i].realStartTime
                },
                function (err) {
                    if (!err) {
                        push_handler.deletePush(next_appointments[i].pushID);
                        q.where('patientID').equals(parseInt(req.session.user.user_id)).exec(function (err, appoin) {
                            appoin.sort(utils.compare_appointments);
                            var nextAppointments = appoin.filter(utils.remove_old_appointments);
                            res.render('cancelApp', {user: req.user, appointments: nextAppointments});
                        })
                    } else {
                        console.log("Err in remove");
                        res.render('cancelApp', {user: req.user, appointments: next_appointments});
                    }
                }
            );
        });
    } else {
        logged_user = req.user;
        var query = appointments.find({});
        query.where('patientID').equals(parseInt(req.session.user.user_id)).exec(function (err, appointments) {
            appointments.sort(utils.compare_appointments);
            var nextAppointments = appointments.filter(utils.remove_old_appointments);
            res.render('cancelApp', {user: req.user, appointments: nextAppointments});
        });
    }
});

module.exports = router;