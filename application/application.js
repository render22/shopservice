var express = require('express');
var path = require('path');
var config = require('./config/application.json');
var routes = require('../library/routes.js');
var session = require('express-session');
var q = require('q');
var winston = require('winston');
var engine = express();


var projectRoot = path.normalize(__dirname + '/../');
var applicationPath = __dirname;
engine.set('projectRoot', projectRoot);
engine.set('appPath', applicationPath);
engine.set('libPath', projectRoot + '/library');
engine.set('config', config);
engine.set('winston', winston);
engine.set('port', process.env.PORT || config.server.port || 3000);

var api = require(applicationPath + '/api');

function Start() {

    initDb(engine);

    initMiddlewares(engine);

    initView(engine);

    routes.initRoutes(engine, config.routes);

    api.initRoutes(engine);

    initErrorRoutes(engine);


    engine.listen(engine.get('port'), function () {
        console.log('Server started ' + engine.get('port'));
    });


}


try {
    Start();
} catch (e) {
    console.log(e.message);
    console.log(e.stack);
}


function initDb(app) {
    var dbConf = app.get('config').credentials.db.pg;

    var pg = require('knex')({
        client: 'pg',
        connection: (process.env.NODE_APP_LOCATION === 'local') ?
            dbConf.local.connectionLink
            :
            dbConf.remote.connectionLink
        //  debug:true
    });

    app.set('pg', pg);
    var bookshelf = require('bookshelf')(pg);

    app.set('bookshelf', bookshelf);


}

function initMiddlewares(app) {
    app.use(express.static(app.get('projectRoot') + '/public'));
    //app.use('/users/paymentdone', require('body-parser')());
    app.use(require('cookie-parser')(config.credentials.cookieSecret));
    var pgSession = require('connect-pg-simple')(session);
    var dbConf = app.get('config').credentials.db.pg;
    var pg = require('pg');
    app.use(session({
        store: new pgSession({
            pg: pg,
            conString: (process.env.NODE_APP_LOCATION === 'local') ?
                dbConf.local.connectionLink
                :
                dbConf.remote.connectionLink
        }),
        secret: config.credentials.cookieSecret,
        cookie: {maxAge: 30 * 24 * 60 * 60 * 1000} // 30 days
    }));
    // app.use(session());
    app.use(function (request, response, next) {

        if (request.session.flash) {

            if (request.session.flash.error) {

                response.locals.error = request.session.flash.error;

            }

            if (request.session.flash.notification) {

                response.locals.info = JSON.stringify(request.session.flash.notification);

            }
        }

        request.session.flash = null;

        next();
    });

    app.use(function (request, response, next) {
        response.locals.messagesCount = 0;
        if (request.session.user) {
            response.locals.isAuth = true;
            response.locals.isAdmin = request.session.user.role === 'admin' ? true : false;
            response.locals.firstname = request.session.user.firstname;
            response.locals.uid = request.session.user.id;

            var bookshelf = request.app.get('bookshelf');

            bookshelf.knex('messages')
                .where({
                    receiverId: request.session.user.id,
                    readed: 0
                })
                .count('id')
                .then(function (data) {
                    response.locals.messagesCount = data[0].count;
                    next();
                });

        } else {
            next();
        }


    });

    app.use(require('./models/accessControl.js'));

}

function initView(app) {
    app.set('views', app.get('appPath') + '/views');
    app.set('layouts', app.get('appPath') + '/views');
    var handlebars = require('express3-handlebars')
        .create(
        {
            extname: 'hbs',
            partialsDir: app.get('appPath') + '/views/partials',
            layoutsDir: app.get('appPath') + '/views/layouts',
            defaultLayout: 'main',
            helpers: require(applicationPath + '/helpers/handlebars.js')

        }
    );

    app.engine('hbs', handlebars.engine);

    app.set('view engine', 'hbs');


}

function initErrorRoutes(engine) {
    engine.use(function (req, res, next) {

        res.status(404);

        return res.send('404');

    });

    // 500 error handler (middleware)

    engine.use(function (err, req, res, next) {

        console.error(err.stack);

        res.status(500);

        return res.send('500');

    });
}