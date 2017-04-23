var path = require('path'),
    express = require('express'),
    http = require('http'),
    /* This app uses sessions to remember whether the user is logged in or not
    Using sessions to keep track of users as they journey through site is
    key to any respectable app. Sessions will accessible through the request
    object in each route. */
    session = require('express-session'),
    /* When the node app restarts, all session related data will be lost.
    MongoStore allows us to store the Express sessions into MongoDB instead of
    using the MemoryStore, which is a store for development use only,
    bundled with Express. */
    MongoStore = require('connect-mongo')(session),
    /* The csurf middleware provides easy-to-use protection against
    Cross Site Request Forgeries. */
    csrf = require('csurf'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    /* Here we find an appropriate database to connect to, defaulting to
    localhost if we don't find one. */
    uristring = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/polls',
    /* The http server will listen to an appropriate port,
    or default to port 3000. */
    port = process.env.PORT || 3000,
    folder = process.env.NODE_ENV === 'production' ? 'dist' : 'src',
    favicon = require('serve-favicon'),
    compression = require('compression'),
    Poll = require(__dirname + '/app/models/poll'),
    app = express();
app.set('folder', folder);
app.use(favicon('./' + folder +'/favicon.ico'));
// Switch off the default 'X-Powered-By: Express' header
app.disable('x-powered-by');
// compress all requests
app.use(compression());
// Set mongoose.Promise to any Promise implementation
mongoose.Promise = global.Promise;
/* Makes connection asynchronously.  Mongoose will queue up database
operations and release them when the connection is complete. */
mongoose.connect(uristring, function (err, res) {
    var mongoStore = new MongoStore({
        db: mongoose.connection.db
    });
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
        app.use(
            session({
                secret: process.env.SESSION_SECRET || 'secret',
                store: new MongoStore({
                    db: mongoose.connection.db
                }),
                resave: false,
                saveUninitialized: true,
                cookie : {
                    maxAge : 7 * 24 * 60 * 60 * 1000 // seconds which equals 1 week
                }
            })
        );
        app.use(cookieParser());
        // Important : csrf should be added after cookie and session initialization.
        // Otherwise you will get 'Error: misconfigured csrf'
        app.use(csrf());
        app.use(function(req, res, next) {
            res.cookie('XSRF-TOKEN', req.csrfToken());
            next();
        });
        // error handler for csrf tokens
        app.use(function(err, req, res, next) {
            //return;
            if (err.code !== 'EBADCSRFTOKEN') {
                return next(err);
            }
            // handle CSRF token errors here
            res.status(403);
            res.send('Session has expired or form tampered with.');
        });
        require(__dirname +'/app/routes')(app, Poll);
        app.use(express.static(__dirname + '/' + folder));
        http.createServer(app).listen(port);
    }
});