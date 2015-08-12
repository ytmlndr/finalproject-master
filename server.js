var passport = require('passport');
    require('./config/passport')(passport);
var app = require('./config/middlewares')(passport);
var router = require('./routes')(passport);

// initialize routes
app.use(router);

// setting port variable for express router
app.set('port', (process.env.PORT || 3000));

// start server
    console.log('listening on port', server.address().port);
app.listen(app.get('port'), function () {
});