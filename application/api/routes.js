var methods = require('./methods.js');
var oAuth = require('./oAuth');
module.exports = function (app) {
    /*
     Initialize api controller on router startup
     */
    methods.init(app);
    oAuth.init(app);

    app.use('/api/*', require('body-parser').json());




    app.post('/api/gettoken', oAuth.gettoken());
    app.use('/api/*', oAuth.passport.authenticate('bearer', {session: false}));



    /* Ads  */
    app.get('/api/ads', function (req, res) {
        methods.ads.apply(methods, arguments);
    });

    app.get('/api/ads/:id', function (req, res) {
        methods.ads.apply(methods, arguments);
    });

    app.delete('/api/removead/:id', function (req, res) {
        methods.removead.apply(methods, arguments);
    });

    app.put('/api/createad', function (req, res) {
        methods.createad.apply(methods, arguments);
    });

    /* Users */
    app.put('/api/createuser', function (req, res) {
        methods.createuser.apply(methods, arguments);
    });

    app.get('/api/payment/:userId', function (req, res) {
        methods.payment.apply(methods, arguments);
    });

    app.get('/api/paymentdone/:paymentId/:userId', function (req, res) {
        methods.paymentdone.apply(methods, arguments);
    });

    app.delete('/api/removeuser/:id', function (req, res) {
        methods.removeuser.apply(methods, arguments);
    });

    app.post('/api/login', function (req, res) {
        methods.login.apply(methods, arguments);
    });


    app.use('/api/*', function (err, req, res, next) {

        console.error(err.stack);

        res.status(500);

        return res.json(err);

    });
}
