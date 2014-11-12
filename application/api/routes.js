var methods = require('./methods.js');
var oAuth = require('./oAuth');

/**
 * Api application routes initialization with authentication
 * @param app
 */
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

    app.put('/api/createuser', function (req, res) {
        methods.createuser.apply(methods, arguments);
    });

    app.get('/api/payment/:userId', function (req, res) {
        methods.payment.apply(methods, arguments);
    });

    app.get('/api/payment', function (req, res) {
        methods.payment.apply(methods, arguments);
    });

    app.get('/api/paymentdone/:paymentId/:userId', function (req, res) {
        methods.paymentdone.apply(methods, arguments);
    });


    app.post('/api/searchad', function (req, res) {
        methods.searchad.apply(methods, arguments);
    });

    /*Private*/

    /*Users*/
    app.put('/api/createad', function (req, res) {
        methods.createad.apply(methods, arguments);
    });


    app.delete('/api/removead/:id', function (req, res) {
        methods.removead.apply(methods, arguments);
    });

    app.get('/api/pmdialogs', function(req, res){
        methods.pmdialogs.apply(methods, arguments);
    });

    app.get('/api/pmdialogs/:dialogId', function(req, res){
        methods.pmdialogs.apply(methods, arguments);
    });

    app.post('/api/edituserinfo', function (req, res) {
        methods.edituserinfo.apply(methods, arguments);
    });

    app.post('/api/pmsend', function (req, res) {
        methods.pmsend.apply(methods, arguments);
    });

    app.post('/api/pmsend/:receiver', function (req, res) {
        methods.pmsend.apply(methods, arguments);
    });

    app.get('/api/getuserads', function(req, res){
        methods.getuserads.apply(methods, arguments);
    });

    /* Admin */



    app.delete('/api/removeuser/:id', function (req, res) {
        methods.removeuser.apply(methods, arguments);
    });

    app.post('/api/edituserinfo/:userId', function (req, res) {
        methods.edituserinfo.apply(methods, arguments);
    });

    app.post('/api/editad/:adId', function (req, res) {
        methods.editad.apply(methods, arguments);
    });

    app.get('/api/getuserads/:id', function(req, res){
        methods.getuserads.apply(methods, arguments);
    });

    /*Error handling*/
    app.use('/api/*', function (err, req, res, next) {

        console.error(err.stack);

        res.status(500);

        return res.json(err);

    });
}
