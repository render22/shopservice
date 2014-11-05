var formidable = require('formidable');
var flashGenerator = require('../../library/flashGenerator.js');
var Users = require('../models/users.js');
var Pm = require('../models/pm.js');
var q = require('q');
var Ad = require('../models/ad.js');
var crypto = require('crypto');
var url = require('url');

/**
 * Api methods
 *
 * @type {{
 * init: Function,
 * createuser: Function,
 * login: Function,
 * payment: Function,
 * paymentdone: Function,
 * pmmessages: Function,
 * edituserinfo: Function,
 * getuserads: Function,
 * ads: Function,
 * removead: Function,
 * createad: Function
 * }}
 */
module.exports = {
    /**
     * Initializing then router startup
     * @param app
     */
    init: function (app) {
        this.app = app;
        this.bookshelf = app.get('bookshelf');
        this.winston = app.get('winston');
        this.config = app.get('config');

    },

    //--------------------- USERS

    /**
     * Creating user
     * @param req
     * @param res
     */
    createuser: function (req, res) {
        var self = this;

        Users(self.bookshelf, req.body).validateData(true)
            .then(function (model) {
                model.save().then(function (data) {

                    res.json({
                        status: "ok",
                        data: data
                    });
                }).catch(function (err) {
                    res.json({
                        status: "error",
                        "message": err
                    });

                });
            }, function (validationErrors) {
                res.json({
                    status: "error",
                    "message": validationErrors
                });

            }).catch(function (e) {
                console.log(e);
                res.json({
                    status: "error",
                    "message": e
                });
            });


    },

    /**
     * Remove user from db and all users ads
     * @param req
     * @param res
     */
    removeuser: function (req, res) {
        if (isNaN(parseInt(req.params.id))) {
            return res.json({
                status: "error",
                message: "Id not given"

            });
        }
        Users(this.bookshelf, {id: parseInt(req.params.id)}).destroy();
        Ad(this.bookshelf, {userId: parseInt(req.params.id)}).destroy();
        res.json({
            status: "ok"
        });
    },

    /**
     * Authorization with given email and password
     * @param req
     * @param res
     */
    login: function (req, res) {
        var self = this;
        Users(self.bookshelf, req.body)
            .validateData()
            .then(function (model) {
                model.setTestMode().auth(req.session)
                    .then(function () {
                        res.json({
                            status: "ok",
                            data: {
                                sessionId: req.sessionID
                            }
                        });
                    }, function () {
                        console.log(1);
                        res.json({
                            status: "error",
                            "message": "login or password incorrect"
                        });

                    })


            }, function (validationErrors) {
                res.json({
                    status: "error",
                    "message": validationErrors
                });
            }).catch(function (e) {
                console.log(e);
                res.json({
                    status: "error",
                    "message": e
                });
            });


    },

    /**
     * Creating payment on paypal sandbox for activation user accout
     * @param req
     * @param res
     */
    payment: function (req, res) {

        if (isNaN(parseInt(req.params.userId))) {

            return res.json({
                status: "error",
                message: "userID not given"

            });
        }


        Users(this.bookshelf)
            .pay(this.config, req.session)
            .then(function (data) {

                res.json({
                    status: "ok",
                    data: {
                        paymentRedirectLink: data[0],
                        id: data[1]
                    }
                });

            }, function (error) {
                console.log(error);
                res.json({
                    status: "error",
                    "message": error
                });
            });


    },

    /**
     * After redirecting from sandbox page we check some data for make sure that payment is succesfull
     * @param req
     * @param res
     */
    paymentdone: function (req, res) {
        if (!req.params.paymentId || isNaN(parseInt(req.params.userId))) {

            return res.json({
                status: "error",
                message: "userId  or paymentId not given"

            });
        }
        var paymentId = req.params.paymentId;
        req.session.userId = parseInt(req.params.userId);
        console.log(paymentId);
        Users(this.bookshelf)
            .confirmPayment(this.config, paymentId, req.session)
            .then(function () {
                res.json({
                    status: "ok"

                });
            }, function (error) {
                console.log(error);
                res.json({
                    status: "error",
                    "message": error
                });
            })
            .catch(function (error) {
                res.json({
                    status: "error",
                    "message": error
                });
            });

    },

    /**
     * User personal messages list
     * @param req
     * @param res
     */
    pmmessages: function (req, res) {
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
                    res.json({
                        status: "ok",
                        data: data
                    });
                });

            });
    },

    /**
     * Changing user email and password
     * @param req
     * @param res
     */
    edituserinfo: function (req, res) {

        Users(self.bookshelf, req.body)
            .validateData()
            .then(function (model) {
                model.changeCred(req.session)
                    .then(function () {
                        res.json({
                            status: "ok"

                        });
                    }, function (errors) {
                        res.json({
                            status: "error",
                            "message": errors
                        });
                    });
            }, function (errors) {
                res.json({
                    status: "error",
                    "message": errors
                });
            })
            .catch(function (error) {
                console.log(error.message, error.stack);
                res.json({
                    status: "error",
                    "message": error
                });
            });


    },

    /**
     * Geting user advertisements
     * @param req
     * @param res
     */
    getuserads: function (req, res) {
        Ad(this.bookshelf)
            .where({userId: req.body.userId})
            .fetchAll()
            .then(function (data) {
                page.ads = data.toArray();
                res.json({
                    status: "ok",
                    data: data.toArray()

                });
            });
    },


    // -------------------------------------- ADS

    /**
     * Getting list of advertisements or single advertisement through providing ad's id
     * @param req
     * @param res
     */
    ads: function (req, res) {

        var curPage = (req.body.page) ? req.body.page : 1;

        if (req.body.q) {
            Ad(this.bookshelf).search(function (data) {
                res.json({
                    status: "ok",
                    data: data

                });
            }, req.body.q);
        } else if (req.params.id) {
            Ad(this.bookshelf).fetchAds(function (data) {

                res.json({
                    status: "ok",
                    data: data[0]
                });
            }, {"ads.id": parseInt(req.params.id)});
        } else {
            Ad(this.bookshelf).fetchAds(function (data) {
                    var pages = {};
                    for (var i = 1; i <= data.pagesCount; i++) {

                        pages[i] = {
                            page: i,
                            comparePage: [i, curPage]
                        }
                    }

                    res.json({
                        status: "ok",
                        data: data

                    });
                }, null,
                (req.body.page) ? (--req.body.page) : 0,
                this.config.pagination.perPage);
        }


    },

    /**
     * Removing advertisement
     * @param req
     * @param res
     */
    removead: function (req, res) {

        if (isNaN(parseInt(req.params.id))) {
            return res.json({
                status: "error",
                message: "Id not given"

            });
        }

        Ad(this.bookshelf, {id: parseInt(req.params.id)}).destroy().then(function (data) {

        });
        res.json({
            status: "ok"

        });
    },


    /**
     * Creating advertisement
     * @param req
     * @param res
     */
    createad: function (req, res) {
        var self = this;

        Ad(self.bookshelf, req.body).validateData()
            .then(function (model) {
                model.save().then(function (data) {
                    res.json({
                        status: "ok",
                        data: data
                    });
                }).catch(function (err) {
                    console.log(err);
                    res.json({
                        status: "error",
                        "message": err
                    });
                });

            }, function (errors) {
                res.json({
                    status: "error",
                    "message": error
                });
            });

    }


}