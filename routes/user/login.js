var express = require('express');
var router = express.Router();

module.exports = function(passport)
{
    router.post('/', function (req, res, next) {
        passport.authenticate('local-login', function (err, user, info) {
            if (err) {
                console.log('encountered error');
                return next(err);
            }
            if (!user) {
                console.log('user object is false');
                req.session.messages = [info.message];
                return res.redirect('/');
            }
            req.logIn(user, function (err) {
                if (err) {
                    console.log('encountered error');
                    return next(err);
                }
                req.session.user = user;
                if (user.isDoctor) {
                    return res.render('doctor_profile', {user: req.user, message: ""});
                } else {
                    if (GLOBAL.token) {
                        patient.update({userID: user.user_id}, {
                            $set: {
                                TokenID: GLOBAL.token //set Token
                            }
                        }, function (err) {
                            if (err) {
                                console.log("err");
                            } else {
                                console.log("Token Updated");
                            }
                        });
                    }
                    return res.redirect('/profile');
                }
            });
        })(req, res, next);
    });

    return router;
}