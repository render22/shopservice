var methods = require('./methods.js');
var oAuth = require('./oAuth');
module.exports = function (app) {
    /*
     Initialize api controller on router startup
     */
    methods.init(app);
    oAuth.init(app);

    app.use('/api/*', require('body-parser').json());


    app.post('/api/getclienttoken', oAuth.getClientToken());
    app.post('/api/getusertoken', oAuth.getUserToken());


    app.use(new RegExp('/api/(' + app.get('config').api.private.join('|') + ')/?(.*)'), oAuth.authenticateBearer('user'));
    app.use(new RegExp('/api/(' + app.get('config').api.privateAdmin.join('|') + ')/?(.*)'), oAuth.authenticateBearer('user', 'admin'));
    app.use('/api/*', function (req, res, next) {
        if (!req.user) {
            oAuth.authenticateBearer('client').apply(this, arguments);
        } else {
            next();
        }

    });

    /*app.post('/api/gettoken', oAuth.gettoken());*/
    /*app.use('/api*/
    /*', oAuth.passport.authenticate('bearer', {session: false}));*/


    /*Public*/
    app.get('/api/ads', function (req, res) {
        methods.ads.apply(methods, arguments);
    });


    app.get('/api/ads/:id', function (req, res) {
        methods.ads.apply(methods, arguments);
    });

    app.get('/api/payment/:userId', function (req, res) {
        methods.payment.apply(methods, arguments);
    });

    app.get('/api/paymentdone/:paymentId/:userId', function (req, res) {
        methods.paymentdone.apply(methods, arguments);
    });

    app.post('/api/login', function (req, res) {
        methods.login.apply(methods, arguments);
    });


    /*Private*/

    /*Users*/
    app.put('/api/createad', function (req, res) {
        methods.createad.apply(methods, arguments);
    });


    app.delete('/api/removead/:dialogId', function (req, res) {
        methods.removead.apply(methods, arguments);
    });

    app.get('/api/pmdialogs', function(req, res){
        methods.pmdialogs.apply(methods, arguments);
    });

    app.get('/api/pmdialogs/:dialogId', function(req, res){
        methods.pmdialogs.apply(methods, arguments);
    });



    /* Admin */
    app.put('/api/createuser', function (req, res) {
        methods.createuser.apply(methods, arguments);
    });


    app.delete('/api/removeuser/:id', function (req, res) {
        methods.removeuser.apply(methods, arguments);
    });


    app.use('/api/*', function (err, req, res, next) {

        console.error(err.stack);

        res.status(500);

        return res.json(err);

    });
}
