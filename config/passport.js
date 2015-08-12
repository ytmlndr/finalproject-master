var local_strategy = require('passport-local').Strategy;
var user          = require('../app/models/user');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        console.log('serializeing user ' + user.id);
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        user.findById(id, function (err, user) {
            console.log('deserializeing user ' + user.id);
            done(err, user);
        });
    });

    passport.use('local-login', new local_strategy({usernameField: 'username', passwordField: 'password'},
        function(username, password, done) {
            if(username.length!=9) return done(null, false, { message: 'length must be 9.'});
            user.findOne({user_id : parseInt(username,10)}, function(err, user) {
                if(err) { return done(err); }
                if(!user) { return done(null, false, { message: 'No user found.'}); }
                user.comparePassword(password, function (err, isMatch) {
                    if(err) return done(err);
                    if(isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Invalid password' });
                    }
                })
            });
        }));
};
