var formidable = require('formidable');
var flashGenerator = require('../../library/flashGenerator.js');
var Users = require('../models/users.js');
var Pm = require('../models/pm.js');
var q = require('q');
var Ad = require('../models/ad.js');
var crypto = require('crypto');
var url = require('url');

module.exports = {
    init: function (app) {
        this.app = app;
        this.bookshelf = app.get('bookshelf');
        this.winston = app.get('winston');
        this.config = app.get('config');

    },

    logoutAction: function (req, res) {
        req.session.user = null;
        res.redirect(303, '/');

    },

    loginAction: function (req, res) {

        var self = this;
        if (req.method === 'POST') {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                if (err) {
                    flashGenerator.setAppError(req.session);
                    return res.redirect(303, '/users/login');
                }

                Users(self.bookshelf, fields)
                    .validateData()
                    .then(function (model) {

                        model.auth(req.session)
                            .then(function () {
                                res.redirect(303, '/');
                            }, function () {
                                flashGenerator.setMessage(req.session, "login or password incorrect", "danger");
                                return res.redirect(303, '/users/login');
                            })


                    }, function (validationErrors) {
                        flashGenerator.setErrors(req.session, validationErrors, fields);
                        res.redirect(303, '/users/login');
                    }).catch(function (e) {
                        console.log(e);
                    });

            });
        } else {
            res.render('users/login');
        }


    },

    registrationAction: function (req, res) {
        var self = this;
        if (req.method === 'POST') {
            var form = new formidable.IncomingForm();
            var defer = q.defer();
            form.parse(req, function (err, fields, files) {

                if (err) {
                    flashGenerator.setAppError(req.session);
                    return res.redirect(303, '/users/registration');
                }

                Users(self.bookshelf, fields).validateData(true)
                    .then(function (model) {
                        model.save().then(function (data) {
                            req.session.userId = data.attributes.id;
                            defer.resolve();
                        }).catch(function (err) {
                            flashGenerator.setAppError(req.session);
                            defer.resolve();
                        });
                    }, function (validationErrors) {
                        flashGenerator.setErrors(req.session, validationErrors, fields);
                        defer.resolve();
                    }).catch(function (e) {
                        console.log(e);
                    });


                defer.promise.then(function (err) {
                    if (err)
                        res.redirect(303, '/users/registration');
                    else
                        res.redirect(303, '/users/payment');
                });

            });
        } else
            res.render('users/registration');
    },

    paymentcancelAction: function (req, res) {

        res.render('users/paymentcancel');
    },

    paymentAction: function (req, res) {

        if (!req.session.userId)
            res.redirect(303, '/users/registration');
        if (req.query.confirm === 'true') {
            Users(this.bookshelf)
                .pay(this.config, req.session)
                .then(function (paymentRedirectLink) {
                    res.redirect(303, paymentRedirectLink);
                }, function (error) {
                    console.log(error);
                    flashGenerator.setAppError(req.session);
                    res.render('users/payment');
                });


        } else
            res.render('users/payment');
    },

    paymentdoneAction: function (req, res) {

        var paymentId = req.query.paymentId;
        if (req.session.paymentId !== paymentId) {
            console.log(req.session.paymentId, paymentId);
            flashGenerator.setAppError(req.session);
            return res.redirect(303, '/users/paymentcancel');
        }
        Users(this.bookshelf)
            .confirmPayment(this.config, paymentId, req.session)
            .then(function () {
                flashGenerator.setMessage(req.session,
                    "Congratulations! Now you able to create your advertisement", "info");
                res.redirect(303, '/users/login');
            }, function (error) {
                console.log(error);
                flashGenerator.setAppError(req.session);
                res.redirect(303, '/users/paymentcancel');
            })
            .catch(function (errorr) {
                console.log(error);
            });

    },


    profileAction: function (req, res) {
        var defer = q.defer();
        var self = this;
        var page = {
            settings: false,
            ads: false,
            pm: false,
            default: false
        };


        if (req.query.action === 'settings') {
            var form = new formidable.IncomingForm();

            page.email = req.session.user.email;

            if (req.method === 'POST') {

                form.parse(req, function (err, fields, files) {
                    if (err) {
                        flashGenerator.setAppError(req.session);
                        return res.redirect(303, '/users/profile?action=settings');
                    }

                    fields.id = req.session.user.id
                    Users(self.bookshelf, fields)
                        .validateData()
                        .then(function (model) {
                            model.changeCred(req.session)
                                .then(function () {
                                    flashGenerator.setMessage(req.session, "Data successfully changed", "success");
                                    return res.redirect(303, '/users/profile?action=settings');
                                }, function (errors) {
                                    flashGenerator.setErrors(req.session, errors, fields);
                                    return res.redirect(303, '/users/profile?action=settings');
                                });
                        }, function (errors) {
                            flashGenerator.setErrors(req.session, errors, fields);
                            return res.redirect(303, '/users/profile?action=settings');
                        })
                        .catch(function (error) {
                            console.log(error.message, error.stack);
                        });

                });

            } else {
                defer.resolve();
            }

            page.settings = true;

        } else if (req.query.action === 'ads') {
            Ad(this.bookshelf)
                .where({userId: req.session.user.id})
                .fetchAll()
                .then(function (data) {
                    page.ads = data.toArray();

                    defer.resolve();
                });

            page.ads = true;

        } else if (req.query.action === 'pm') {

            page.pm = true;

            var s = this.bookshelf.knex.select(this.bookshelf.knex.raw('DISTINCT ON("dialogid") "dialogid"'), 'time', 'firstname')
                .from('messages')
                .leftJoin('users', 'messages.senderId', 'users.id')
                .orWhere({
                    receiverId: req.session.user.id

                })
                .orWhere({
                    senderId: req.session.user.id

                })
                .orderBy('dialogid', 'desc')
                .orderBy('time', 'desc')
                .then(function (data) {
                    var promises = [];

                    for (var i = 0; i < data.length; i++) {
                        var deferCnt = q.defer();
                        self.bookshelf.knex('messages').where({
                            dialogid: data[i].dialogid,
                            receiverId: req.session.user.id,
                            readed: 0
                        }).count().then(
                            function (key, defer) {
                                return function (result, i) {
                                    data[key].unread = result[0].count;
                                    defer.resolve(data[key]);
                                }
                            }(i, deferCnt)
                        );

                        promises[i] = deferCnt.promise;
                    }

                    q.all(promises).then(function (data) {

                        page.messages = data;
                        defer.resolve();
                    });

                });


        } else {
            defer.resolve();
            page.default = true;
        }

        defer.promise.then(function () {
            res.render('users/profile', page);
        });

    },

    //pm

    pmdialogAction: function (req, res) {
        var self = this;
        this.bookshelf.knex.select('*')
            .from('messages')
            .leftJoin('users', 'messages.senderId', 'users.id')
            .where({
                dialogid: req.params.dialogId

            })
            .orderBy('time', 'asc')

            .then(function (data) {
                self.bookshelf.knex('messages').where({
                    dialogid: req.params.dialogId,
                    receiverId: req.session.user.id

                }).update({
                    readed: 1
                }).then(function (data) {

                });

                var receiverId = null;
                for (var i in data) {
                    if (data[0].receiverId != req.session.user.id) {
                        receiverId = data[0].receiverId;
                        break;
                    }
                }

                if (!receiverId)
                    receiverId = data[0].senderId


                res.render('users/pmdialog', {
                    messages: data,
                    receiver: receiverId
                });
            });


    },

    pmAction: function (req, res, next) {
        var self = this;
        if (req.method === 'POST') {

            var form = new formidable.IncomingForm();
            var parts = url.parse(req.header('referer'));

            form.parse(req, function (err, fields, files) {
                if (err) {
                    res.json({status: "error"});
                }

                var msgHash;
                if (parts.pathname.split('/')[3]) {
                    msgHash = parts.pathname.split('/')[3];
                } else if (fields['msgHash']) {
                    msgHash = fields['msgHash'];
                    console.log(msgHash);
                } else {
                    msgHash = crypto.createHash('md5').
                        update("" + (new Date()).getTime() + Math.random()).
                        digest("hex");
                }


                Pm(self.bookshelf, {
                    senderId: req.session.user.id,
                    receiverId: fields.receiver,
                    message: fields.message,
                    dialogid: msgHash

                }).save().then(function () {
                    res.json({status: "ok"});
                }).catch(function (err) {

                    res.json({status: "error", errors: err.error});
                });


            });
        } else {
            if (req.query.action && req.query.action === 'getid') {
                Pm(self.bookshelf, {
                    receiverId: req.query.receiverId,
                    senderId: req.session.user.id
                }).fetch().then(function (data) {

                    res.json({
                        messageId: (data) ? data.attributes.dialogid : null
                    });
                });

            } else {
                next();
            }
        }

    }


}
