var passport = require('passport');
    require('./config/passport')(passport);
var app = require('./config/middlewares')(passport);
var router = require('./routes')(passport);

// initialize routes
app.use(router);

// setting port variable for express router
app.set('port', (process.env.PORT || 3000));

// start server
app.listen(app.get('port'), function () {
    console.log('listening on port', app.get('port'));
});