var user = require('./models/user');
var patient = require('./models/patient');
var doctor = require('./models/doctor');
var Appointment = require('./models/appointment');
var medicalFields = require('./models/medicalfield');
var languages = require('./models/languages');
var pushHandler = require('./pushHandler') // do not include the dot js
var async = require('async');
var datejs = require('datejs'); // DO NOT DELETE THIS
var utils = require('./functionsUtils');
var delayNotification = require('../config/delayNotifierComponent');
GLOBAL.token; //tokenID will be here

module.exports = function (passport) {

    app.get('/doctoreditdetails', ensureAuthenticated, function (req, res) {
        res.render('doctoreditdetails', {user: req.user, message: ""});
    });

    app.get('/appSummary', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        res.render('appSummary', {user: req.user, pid: query.pid, pname: query.pname, date: query.date});

    });

    app.post('/appSummary', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        var q = Appointment.find({});
        q.where('patientID', 'doctorID').equals(parseInt(query.pid), parseInt(req.session.user.user_id)).exec(function (err, appointments) {
            appointments.sort(utils.compare_appointments);
            var nextAppointment = appointments.filter(utils.remove_old_appointments);
            nextAppointment = nextAppointment[0];
            var today = new Date();
            if (nextAppointment && ((nextAppointment.date.split('/')[1] - 1) == today.getMonth() &&
                nextAppointment.date.split('/')[0] == today.getDate())) {
                Appointment.update({
                    doctorID: parseInt(req.session.user.user_id, 10),
                    patientID: parseInt(query.pid, 10),
                    date: nextAppointment.date,
                    startTime: nextAppointment.startTime
                }, {
                    $set: {
                        "summary": req.body.sum
                    }
                }, function (err) {
                    if (err) {
                        res.render('appSummary');
                    } else {
                        console.log("summary update successful");
                        res.redirect("/doctorprofile");
                    }
                });
            }
        });
    });

    app.post('/doctorprofile', ensureAuthenticated, function (req, res) {
            var query = Appointment.find({});

            if (req.body.pid.length == 29) { // Maccabi
                req.body.pid = req.body.pid.substring(8, 17);
            }
            if (req.body.pid.length == 33) { // Clallit
                req.body.pid = req.body.pid.substring(19, 28);
            }
            if (req.body.pid.length == 38) { // Meaohedet
                req.body.pid = req.body.pid.substring(8, 17);
            }
            if (req.body.pid.length == 21) { // Leomit
                req.body.pid = req.body.pid.substring(3, 12);
            }
            query.where('patientID', 'doctorID').equals(parseInt(req.body.pid), parseInt(req.session.user.user_id)).exec(function (err, appointments) {
                if (appointments) {
                    appointments.sort(utils.compare_appointments);
                    var nextAppointment = appointments.filter(utils.remove_old_appointments);
                    nextAppointment = nextAppointment[0];
                    var today = new Date();
                    today.addMinutes(180); //add for c9 GMT time
                    if (nextAppointment && ((nextAppointment.date.split('/')[1] - 1) == today.getMonth() &&
                        nextAppointment.date.split('/')[0] == today.getDate())) {
                        res.redirect('/appSummary?pid=' + nextAppointment.patientID + "&pname=" + nextAppointment.patientName + "&date=" + nextAppointment.date);


                        //////
                        ////////

                        doctor.findOne({}).where('user_id').equals(parseInt(parseInt(nextAppointment.doctorID))).exec(function (err, doctor) {
                            if (!err) {
                                var realminute;
                                if (today.getMinutes() < 10) {
                                    realminute = '0' + today.getMinutes();
                                }
                                else {
                                    realminute = today.getMinutes();
                                }
                                nextAppointment.realStartTime = today.getHours() + ':' + realminute;
                                delayNotification.patientEnter(nextAppointment, doctor.appointmentDuration);
                            }
                        });


                    } else {
                        res.render('doctorprofile', {message: "Patient Dose Not Have Appointments Today"});
                    }
                }
                else {
                    console.log("Not Found Appointments");
                    res.render('doctorprofile', {message: "Patient Dose Not Have Appointments Today"});
                }
            });
        });

    app.post('/register', function (req, res) {
        var user = new user({userID: parseInt(req.body.username, 10), password: req.body.password});
        user.save(function (err) {
            if (err) {
                console.log('error while trying to save new user to db: ' + err);
                req.session.message = 'could not create user';
                return res.redirect('/');
            } else {
                console.log('user ' + user.user_id + ' saved');
                req.session.message = 'login with new user';
                return res.redirect('/');
            }
        });
    });

    app.post('/doctoreditdetails', ensureAuthenticated, function (req, res) {
        if (req.body.city != "" && req.body.street != "" && req.body.phone != "" && req.body.minutes != "") {
            doctor.update({userID: parseInt(req.session.user.user_id, 10)}, {
                $set: {
                    "ClinicAddress.city": req.body.city,
                    "ClinicAddress.street": req.body.street,
                    "PhoneNumber": req.body.phone,
                    "appointmentDuration": req.body.duration
                }
            }, function (err) {
                if (err) {
                    res.render('doctoreditdetails', {message: "All Fields Must Be Not Empty"});
                } else {
                    console.log("doctor update successful");
                }
            });

            return res.redirect('/doctorprofile');
        } else {
            res.render('doctoreditdetails', {message: "All Fields Must Be Not Empty"});
        }
    });

    app.post('/scheduleAppointment', ensureAuthenticated, function (req, res) {
        console.log('inside scheduleAppointment');
        console.log('trying to schedule for user ' + req.body.doctorID);
        doctor.findOne({}).where('user_id').equals(parseInt(req.body.doctorID)).exec(function (err, doctor) {
            if (!err) {
                var appointment = new Appointment();
                appointment.patientID = parseInt(req.session.user.user_id);
                appointment.patientName = req.session.user.f_name + ' ' + req.session.user.l_name;
                appointment.doctorID = parseInt(req.body.doctorID);
                appointment.doctorName = req.body.doctorName;
                appointment.date = req.body.date;
                appointment.day = req.body.day;
                appointment.startTime = req.body.start;
                appointment.realStartTime = req.body.start;

                appointment.endTime = appointment.startTime;
                var hh = appointment.endTime.toString().split(":")[0];
                var mm = appointment.endTime.toString().split(":")[1];
                
                appointment.endTime = pushHandler.calctNotificationSendTime(req.body.date, hh, mm, doctor.appointmentDuration * (-1));
                appointment.endTime = appointment.endTime.toString().split(" ")[4];
                appointment.endTime = appointment.endTime.toString().substr(0, 5);
                appointment.realEndTime = appointment.endTime;
                appointment.delayTime = 0;
                //push send:
                //var msg="you have an appiuntment at "+appointment.date+" "+appointment.startTime+"!";
                patient.findOne({}).where('user_id').equals(parseInt(req.session.user.user_id)).exec(function (err, pat) {
                    if (!err) {
                        var msg = "You have an appiontment at " + appointment.date + " " + appointment.realStartTime + "!";      // TO DO - choose better msg :)
                        var NotificationCode = pushHandler.sendPush(appointment.date, appointment.realStartTime, pat.minutes_to_be_notify_before, pat.token_id, msg).then(function (notificationCode) {
                            console.log("the NotificationCode is:  " + notificationCode); // TODO <<NotificationCode>> need to be saved in the DB!
                            appointment.pushID = notificationCode;
              
                            appointment.save(function (err) {
                                console.log('inside save callback');
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('appointments scheduled');
                                    console.log(appointment);
                                    res.send({redirect: '/profile'});
                                }
                            });
                            
                                                    
// removing patient preferred appointment 
                           //kfir
                            Appointment.find({}).where('doctorID').equals(parseInt(req.body.doctorID)).exec(function (err, appointments) {
                            appointments.sort(utils.compare_appointments);
                            var UpcomingAppointments = appointments.filter(utils.remove_old_appointments);
                            for(var i=0;i<UpcomingAppointments.length;i++){ //removing user_id from all next appoinmet preferd list with the corrent doctor
                                
                                var j = UpcomingAppointments[i].waitingPatientArray.indexOf(parseInt(req.session.user.user_id));
                                if(j != -1) {
                                	UpcomingAppointments[i].waitingPatientArray.splice(j, 1);
                                	
                                	//TODO update!!!
                                	Appointment.update({'_id': UpcomingAppointments[i]._id}, {
                                        $set: {
                                            "waitingPatientArray": UpcomingAppointments[i].waitingPatientArray
                                        }
                                    }, function (err) {
                                        if (err) {
                                            res.render('scheduleAppointment', {message: "error please contac someone?! :)"}); // TODO :)
                                        } else {
                                            console.log("preferd for patient with the doctoer were deleted!");// TODO change message?
                                        }
                                    });
                                }
                            }
                            
                            });//find
                           //parseInt(req.body.doctorID)                    
//
          
                            return notificationCode;
                        });
                    }
                });

                //end
            } else {
                console.log(err);
            }
        });
    });

    app.get('/appHistory', ensureAuthenticated, function (req, res) {
        res.render("appHistory", {"appointments": {}});
    });

    app.post('/appHistory', ensureAuthenticated, function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        var q = Appointment.find({});
        q.where('patientID', 'doctorID').equals(parseInt(req.body.pid), parseInt(req.session.user.user_id)).exec(function (err, appointments) {
            var oldAppointment = appointments.filter(utils.getOldAppointments);
            if (oldAppointment.length > 0) {
                res.render("appHistory", {"appointments": oldAppointment});
            } else {
                res.render("appHistory", {"appointments": {}});
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.post('/doctorAvaApp', function (req, res) {
        var url_parts = URL.parse(req.url, true);
        var query = url_parts.query;
        var fhour = query.fhour;
        var thour = query.thour;
        var days = query.days;
        days = days.split(',');
        var docID = query.user_id;
        console.log(fhour);
        console.log(thour);
        console.log(days);
        
        var day;
        // TODO - this is a copy pase from router.get('/doctorAvaApp'... - need to move to utils
        for(var i=0;i<days.length;i++){
              switch (days[i]) {
                                    case "Sunday":
                                        day = 0;
                                        break;
                                    case "Monday":
                                        day = 1;
                                        break;
                                    case "Tuesday":
                                        day = 2;
                                        break;
                                    case "Wednesday":
                                        day = 3;
                                        break;
                                    case "Thursday":
                                        day = 4;
                                        break;
                                    case "Friday":
                                        day = 5;
                                        break;
                                }
            
            
            var apodate = new Date();
            console.log(apodate);
            apodate.addMinutes(180); // to UTC time dut to c9 server
            var adddays = day - apodate.getDay();
            if (adddays<0){
                adddays+=7;
            }
            apodate.addDays(adddays);
            
            // TODO copy code! need to be seperate!!!
            var year = apodate.getFullYear();  
            var month = apodate.getMonth() + 1;
            if (month < 10)
                month = '0' + month;
            day = apodate.getDate();
            
            apodate = day + '/' + month + '/' + year;
            // KFIR WORK
            Appointment.find({}).where('doctorID', 'date').equals(docID, apodate).exec(function (err, appointments) {
                console.log('UPDATING prefer appo');
                
                 for(var i=0;i<appointments.length;i++){
                   if (appointments[i].realStartTime >= fhour && appointments[i].realStartTime <= thour){
                       if(appointments[i].waitingPatientArray.indexOf(req.session.user.user_id)== -1){
                       appointments[i].waitingPatientArray.push(req.session.user.user_id);
                       Appointment.update({'_id': appointments[i]._id}, {
                        $set: {
                            "waitingPatientArray": appointments[i].waitingPatientArray
                        }
                        }, function (err) {
                            if (err) {
                                res.render('doctorAvaApp', {message: "error please contac someone?! :)"}); // TODO :)
                            } else {
                                console.log("preferd appointment updated successfully");
                            }
                        });
                       } // push if  
                   }//if
                }//for
            });//find

        }
    });

    app.get('/doctorAvaApp', ensureAuthenticated, function (req, res) {
        async.waterfall([
                function (callback) {
                    var url_parts = URL.parse(req.url, true);
                    var query = url_parts.query;
                    doctor.findOne({}).where('user_id', parseInt(query.user_id)).exec(function (err, doc) {
                        callback(null, doc, parseInt(query.user_id));
                    });
                },
                function (doctor, userID, callback) {
                    Appointment.find({}).where('doctorID', userID).exec(function (err, apps) {
                        callback(null, doctor, userID, apps);
                    });
                },
                function (doctor, userID, doctorAppointments, callback) {
                    var url_parts = URL.parse(req.url, true);
                    var query = url_parts.query;
                    var availableApps = [];
                    for (var i = 0; i < doctor.WorkDay.length; i++) {
                        if (query.days.indexOf(doctor.WorkDay[i].day) > -1) {
                            console.log('workday ' + i);
                            var startTimeOfWorkDay = new Date();
                            var endTimeOfWorkDay = new Date();
                            var hourStart = parseInt(doctor.WorkDay[i].startTime.split(':')[0]);
                            var mintStart = parseInt(doctor.WorkDay[i].startTime.split(':')[1]);
                            var hourEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[0]);
                            var mintEnd = parseInt(doctor.WorkDay[i].endTime.split(':')[1]);
                            var day;
                            var diff;
                            startTimeOfWorkDay.at({hour: hourStart, minute: mintStart});
                            endTimeOfWorkDay.at({hour: hourEnd, minute: mintEnd});
                            switch (doctor.WorkDay[i].day) {
                                case "Sunday":
                                    day = 0;
                                    break;
                                case "Monday":
                                    day = 1;
                                    break;
                                case "Tuesday":
                                    day = 2;
                                    break;
                                case "Wednesday":
                                    day = 3;
                                    break;
                                case "Thursday":
                                    day = 4;
                                    break;
                                case "Friday":
                                    day = 5;
                                    break;
                            }
                            if (startTimeOfWorkDay.getDay() <= day) {
                                diff = day - startTimeOfWorkDay.getDay();
                            }
                            else {
                                diff = 7 - (startTimeOfWorkDay.getDay() - day);
                            }
                            startTimeOfWorkDay.addDays(diff);
                            endTimeOfWorkDay.addDays(diff);
                            var hourIsInDoctorAppointments;
                            while (startTimeOfWorkDay.compareTo(endTimeOfWorkDay)!=1){
                                var date = new Date();
                                var appointmentTime = startTimeOfWorkDay.toTimeString().split(':')[0].toString() + ":" + startTimeOfWorkDay.toTimeString().split(':')[1].toString();
                                var appointmentDate = startTimeOfWorkDay.getDate() + '/' + (startTimeOfWorkDay.getMonth() + 1) + '/' + startTimeOfWorkDay.getFullYear();
                                //console.log('j is ' + appointmentDate + ' ' + appointmentTime);
                                hourIsInDoctorAppointments = false;

                                // check if there is an appointment at hour j exists
                                for (var t = 0; t < doctorAppointments.length; t++) {
                                    var diffBetweenAppo = utils.diffInMinutesBetweenTwoHours(doctorAppointments[t].startTime, appointmentTime);
                                    //console.log('comparing between ' + doctorAppointments[t].date + ' ' + appointmentDate + ' and between ' + doctorAppointments[t].startTime + ' ' + appointmentTime);
                                    if ((doctorAppointments[t].date.split('/')[0] == startTimeOfWorkDay.getDate())
                                        && (doctorAppointments[t].date.split('/')[1] == (startTimeOfWorkDay.getMonth() + 1))
                                        && (doctorAppointments[t].date.split('/')[2] == startTimeOfWorkDay.getFullYear())
                                        && (diffBetweenAppo >= 0 && diffBetweenAppo < doctor.appointmentDuration)) {
                                        // && (doctorAppointments[t].startTime == appointmentTime)) {
                                        hourIsInDoctorAppointments = true;
                                        console.log('found hour as an appointment: ' + appointmentTime);
                                        break;
                                    }
                                }
                                if (hourIsInDoctorAppointments == false) {

                                    if (startTimeOfWorkDay.toString("HH:mm") >= query.fhour && startTimeOfWorkDay.toString("HH:mm") <= query.thour) {
                                        availableApps.push({
                                            date: startTimeOfWorkDay.toString("dd/MM/yyyy"),
                                            day: doctor.WorkDay[i].day,
                                            startTime: startTimeOfWorkDay.toString("HH:mm"),
                                            realStartTime: startTimeOfWorkDay.toString("HH:mm"),
                                            endTime: startTimeOfWorkDay.addMinutes(doctor.appointmentDuration).toString("HH:mm"),
                                            realEndTime: startTimeOfWorkDay.toString("HH:mm"),  //this is the starttimr + appointment duration as we did in the line before
                                            dateObj: startTimeOfWorkDay
                                        });

                                    } else {
                                        startTimeOfWorkDay.addMinutes(doctor.appointmentDuration);
                                    }
                                } else {
                                    startTimeOfWorkDay.addMinutes(doctor.appointmentDuration);
                                }
                            }
                        }
                    }

                    availableApps.sort(utils.compare_appointments);
                    var nextavailableApps = availableApps.filter(utils.remove_old_appointments);
                    user.findOne({}).where('user_id').equals(userID).exec(function (err, user) {
                        callback(null, nextavailableApps, {userVals: user, docVals: doctor});
                    });
                }
            ], function (err, nextavailableApps, doctor) {
                if (!err) {
                    console.log("going to render");
                    if (nextavailableApps.length == 0) {
                        res.render('doctorAvaApp', {
                            doctor: doctor,
                            availableappointments: nextavailableApps,
                            message: "There is no available appointments in this selected " +
                            "houres whould you like to be notified in case a place will be available?"
                        });

                    } else {
                        res.render('doctorAvaApp', {
                            doctor: doctor,
                            availableappointments: nextavailableApps,
                            message: ""
                        });
                    }
                }
            }
        );
    });

    function ensureAuthenticated(req, res, next) {
        console.log('ensuring authentication');
        if (req.isAuthenticated()) {
            console.log('user authenticated');
            return next();
        }
        console.log('user is not authenticated');
        res.redirect('/');
    }

};