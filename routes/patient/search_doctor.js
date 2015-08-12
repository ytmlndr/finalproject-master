var express = require('express');
var router = express.Router();
var auth = require('../user/authenticate');
var async = require('async');

// models
var medical_fields = require('../../app/models/medicalfield');
var languages = require('../../app/models/languages');
var doctor = require('../../app/models/doctor');
var user = require('../../app/models/user');

router.get('/', auth.authenticate, function (req, res) {
    async.waterfall([
        function (callback) {
            languages.find({}, function (err, docs) {
                callback(null, docs);
            });
        },
        function (langs, callback) {
            medical_fields.find({}, function (err, mfs) {
                callback(null, mfs, langs, "", "", null);
            });
        }
    ], function (error, mfs, langs) {
        if (error) {
            res.render("search_doctor");
        }
        res.render("search_doctor", {
            "doctors": {},
            "mfs": mfs,
            "langs": langs,
            "fhour": "",
            "thour": "",
            "days": {}
        });
    });
});

router.post('/', auth.authenticate, function (req, res) {
    async.waterfall([
        // function to get all languages from db
        function (callback) {
            languages.find({}, function (err, docs) {
                callback(null, docs);
            });
        },
        // function to get all medical fields from db
        function (langs, callback) {
            medical_fields.find({}, function (err, docs) {
                callback(null, langs, docs);
            });
        },
        // function to get all users from db with first and last name filtering
        function (langs, mfs, callback) {
            user.find({
                "f_name": new RegExp(req.body.fname, 'i'),
                "l_name": new RegExp(req.body.lname, 'i')
            }, function (err, docs) {
                callback(null, docs, langs, mfs);
            });
        },
        // function to get all doctors from db with filtering
        function (users, langsToView, mfsToView, callback) {
            var query = doctor.find({});
            var userIds = [];
            var doctors = [];
            var updateIds = [];

            // generating array of userIDs for query
            users.forEach(function (user) {
                userIds.push(user.user_id);
            });

            // filtering doctors by userIDs
            console.log("filtering with " + userIds);
            query.where('user_id').in(userIds);

            // filtering doctors by medical fields
            if (req.body.mfs) {
                var mfs = [];
                if (req.body.mfs instanceof Array) {
                    req.body.mfs.forEach(function (mf) {
                        mfs.push(mf);
                    });
                } else {
                    mfs.push(req.body.mfs);
                }
                console.log("filtering with " + mfs);
                query.where('MedicalField').in(mfs);
            }

            // filtering doctors by languages
            if (req.body.langs) {
                var langs = [];
                if (req.body.langs instanceof Array) {
                    req.body.langs.forEach(function (lang) {
                        langs.push(lang);
                    });
                } else {
                    langs.push(req.body.langs);
                }
                console.log("filtering with " + langs);
                query.where('Languages').in(langs);
            }

            if (req.body.days) {
                var days = [];
                if (req.body.days instanceof Array) {
                    req.body.days.forEach(function (day) {
                        days.push(day);
                    });
                } else {
                    days.push(req.body.days);
                }
                console.log("filtering with " + days);
                query.where('WorkDay.day').in(days);
            }

            // executing query
            query.exec(function (err, docs, days) {
                // searching doctor in Users collection to retrieve user data
                if (docs) {
                    var is_doctor;
                    docs.forEach(function (doc) {
                        for (var i = 0; i < users.length; i++) {
                            if (users[i].user_id == doc.user_id) {
                                is_doctor = false;
                                for (var j = 0; j < doc.WorkDay.length; j++) {
                                    if (req.body.days == undefined) {
                                        req.body.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                                    }
                                    if (req.body.days.indexOf(doc.WorkDay[j].day) > -1
                                        &&
                                        (
                                            (doc.WorkDay[j].startTime <= req.body.fhour && doc.WorkDay[j].endTime >= req.body.thour)
                                            ||
                                            (doc.WorkDay[j].startTime <= req.body.fhour && doc.WorkDay[j].endTime <= req.body.thour
                                                && doc.WorkDay[j].endTime >= req.body.fhour)
                                            ||
                                            (doc.WorkDay[j].startTime >= req.body.fhour
                                                && doc.WorkDay[j].endTime >= req.body.thour
                                                && doc.WorkDay[j].startTime <= req.body.thour)
                                            ||
                                            (doc.WorkDay[j].startTime >= req.body.fhour
                                                && doc.WorkDay[j].endTime <= req.body.thour )
                                        ))
                                    {
                                        if (is_doctor == false) {
                                            is_doctor = true;
                                            doctors.push({
                                                "docVals": doc,
                                                "userVals": users[i]
                                            });

                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log("doctors.length = " + doctors.length);
                    callback(null, doctors, mfsToView, langsToView);
                }
                else {
                    console.log(err);
                    callback(null, {}, mfsToView, langsToView);
                }
            });
        }
    ], function (error, doctors, mfs, langs) {
        if (error) {
            res.render("search_doctor", {
                "doctors": {},
                "mfs": mfs,
                "langs": langs,
                "fhour": null,
                "thour": null,
                "days": null
            });
        }
        res.render("search_doctor", {
            "doctors": doctors,
            "mfs": mfs,
            "langs": langs,
            "fhour": req.body.fhour,
            "thour": req.body.thour,
            "days": req.body.days
        });
    });
});

module.exports = router;
