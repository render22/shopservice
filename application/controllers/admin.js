var formidable = require('formidable');
var flashGenerator = require('../../library/flashGenerator.js');
var Users = require('../models/users.js');
var Ads = require('../models/ad.js');
var ValidationErrors = require('../models/exceptions/validation.js').ValidationErrors;
var q = require('q');
var fs = require('fs');

/**
 * Admin area controller
 * @type {{
 * init: Function,
 * indexAction: Function,
 * loginAction: Function,
 * removeuserAction: Function,
 * removeadAction: Function,
 * adsAction: Function,
 * _reseivePhoto: Function,
 * usersAction: Function,
 * statsAction: Function
 * }}
 */
module.exports = {

    /**
     * Initializing on router startup
     * @param app
     */
    init: function (app) {
        this.app = app;
        this.bookshelf = app.get('bookshelf');
        this.config = app.get('config');

    },
    indexAction: function (req, res) {
        res.render(
            'admin/index',
            {
                layout: "admin"
            }
        );
    },

    loginAction: function (req, res) {
        var self = this;
        if (req.method === 'POST') {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                if (err) {

                    flashGenerator.setAppError(req.session);
                    return res.redirect(303, '/admin/login');
                }

                Users(self.bookshelf, fields)
                    .validateData()
                    .then(function (model) {
                        model.auth(req.session, 'admin')
                            .then(function () {
                                res.redirect(303, '/admin');
                            }, function () {
                                flashGenerator.setMessage(req.session, "login or password incorrect", "danger");
                                return res.redirect(303, '/admin/login');
                            })


                    }, function (validationErrors) {
                        flashGenerator.setErrors(req.session, validationErrors, fields);
                        res.redirect(303, '/admin/login');
                    }).catch(function (e) {
                        console.log(e);
                    });


            });
        } else {
            res.render('admin/login',
                {
                    layout: "admin"
                });
        }


    },

    removeuserAction: function (req, res) {
        Users(this.bookshelf, {id: parseInt(req.params.id)}).destroy();
        Ads(this.bookshelf, {userId: parseInt(req.params.id)}).destroy();
        res.redirect(303, req.header('referer'));
    },

    removeadAction: function (req, res) {

        Ads(this.bookshelf, {id: parseInt(req.params.id)}).destroy();
        res.redirect(303, req.header('referer'));
    },

    adsAction: function (req, res) {
        var defer = q.defer();
        var self = this;
        if (req.method === 'POST') {
            if (req.query.action === 'update') {
                var form = new formidable.IncomingForm();
                form.parse(req, function (error, fields, files) {
                    if (error) {
                        return res.json({
                            status: 'error'
                        });

                    }

                    if (files.photo.size && !self._reseivePhoto(fields, files)) {
                        return res.json({
                            status: 'error',
                            errors: {
                                photo: 'Invalid file'
                            }
                        });
                    }


                    Ads(self.bookshelf, fields).save().then(function () {
                        return res.json({
                            status: 'ok'
                        });
                    }).catch(function (error) {
                        console.log(error);
                        return res.json({
                            status: 'error'
                        });
                    });

                });
            } else if (req.query.action === 'create') {
                var form = new formidable.IncomingForm();
                form.parse(req, function (error, fields, files) {
                    if (error) {
                        return res.json({
                            status: 'error'
                        });

                    }

                    if (files.photo.size && !self._reseivePhoto(fields, files)) {
                        return res.json({
                            status: 'error',
                            errors: {
                                photo: 'Invalid file'
                            }
                        });
                    }

                    Ads(self.bookshelf, fields).validateData()
                        .then(function (model) {
                            model.save().then(function () {
                                return res.json({
                                    status: 'ok'
                                });
                            }).catch(function (err) {
                                console.log(err);
                                return res.json({
                                    status: 'error',
                                    errors: err.error
                                });
                            });

                        }, function (error) {
                            return res.json({
                                status: 'error',
                                errors: error
                            });
                        });


                });
            } else {
                Ads(this.bookshelf, {
                    id: req.query.adId
                }).fetch().then(function (data) {

                    res.json({
                        name: data.attributes.name,
                        shortDescription: data.attributes.shortDescription,
                        description: data.attributes.description,
                        price: data.attributes.price,
                        photo: data.attributes.photo


                    });
                }).catch(function (error) {
                    console.log(error);
                    return res.json({
                        status: 'error'
                    });
                });
            }
        } else {
            Ads(this.bookshelf).fetchAll().then(function (data) {

                defer.resolve(data.toArray());
            }).catch(function (error) {
                defer.rejected(error);
            });

            defer.promise.then(function (data) {
                res.render('admin/ads',
                    {
                        ads: data,
                        layout: "admin"
                    });
            }, function (error) {
                flashGenerator.setAppError(req.session, error);
                res.render('admin/ads',
                    {
                        layout: "admin"
                    });
            });

        }

    },

    _reseivePhoto: function (fields, files) {
        var allowedFileMimes = ['image/jpeg', 'image/png', 'image/gif']

        if ((~allowedFileMimes.indexOf(files.photo.type) && files.photo.size < 2000000)) {

            var newName = Math.floor((Math.random() * 10000000) + 1) + '_' + files.photo.name;
            var uploadDir = this.app.get('projectRoot') + '/' + this.app.get('config').files.uploadDir;
            fs.renameSync(files.photo.path, uploadDir + '/' + newName);
            fields.photo = newName;
            return true;

        } else

            return false;
    },

    usersAction: function (req, res) {
        var defer = q.defer();
        var self = this;
        if (req.method === 'POST') {
            if (req.query.action === 'update') {
                var form = new formidable.IncomingForm();
                form.parse(req, function (error, fields) {
                    if (error) {
                        return res.json({
                            status: 'error'
                        });

                    }

                    Users(self.bookshelf, fields).save().then(function () {
                        return res.json({
                            status: 'ok'
                        });
                    }).catch(function (error) {
                        console.log(error);
                        return res.json({
                            status: 'error'
                        });
                    });

                });
            } else if (req.query.action === 'create') {
                var form = new formidable.IncomingForm();
                form.parse(req, function (error, fields) {
                    if (error) {
                        return res.json({
                            status: 'error'
                        });

                    }

                    Users(self.bookshelf, fields).validateData(true)
                        .then(function (model) {
                            model.save().then(function () {
                                return res.json({
                                    status: 'ok'
                                });
                            }).catch(function (err) {
                                console.log(err);
                                return res.json({
                                    status: 'error',
                                    errors: err.error
                                });
                            });

                        }, function (error) {
                            return res.json({
                                status: 'error',
                                errors: error
                            });
                        });


                });
            } else {
                Users(this.bookshelf, {
                    id: req.query.userId
                }).fetch().then(function (data) {

                    res.json({
                        firstname: data.attributes.firstname,
                        lastname: data.attributes.lastname,
                        email: data.attributes.email
                    });
                }).catch(function (error) {
                    console.log(error);
                    return res.json({
                        status: 'error'
                    });
                });
            }

        } else {
            Users(this.bookshelf).fetchAll().then(function (data) {

                defer.resolve(data.toArray());
            }).catch(function (error) {
                defer.rejected(error);
            });

            defer.promise.then(function (data) {
                res.render('admin/users',
                    {
                        users: data,
                        layout: "admin"
                    });
            }, function (error) {
                flashGenerator.setAppError(req.session, error);
                res.render('admin/users',
                    {

                        layout: "admin"
                    });
            });
        }


    },

    statsAction: function (req, res) {
        var defer1 = q.defer();
        var defer2 = q.defer();
        var stats = {};
        var self = this;

        Users(this.bookshelf).getStat(
            req.query.datefrom,
            req.query.dateto,
            self.config
        ).then(function (data) {
                data[0].then(function(result){
                    stats.users = result[0].count;
                    stats.payments= data[1].payments;
                    defer1.resolve(stats);
                },function(error){
                    flashGenerator.setAppError(req.session, error);
                    defer1.reject(error);
                });

            }, function (error) {
                flashGenerator.setAppError(req.session, error);
                defer1.reject(error);
            }).catch(function (error) {
                console.log(error);
                defer1.reject(error);
            });

        Ads(this.bookshelf)
            .getStat(
            req.query.datefrom,
            req.query.dateto
        ).then(function (data) {
                stats.adscount = data[0].count;
                defer2.resolve(stats);
            }).catch(function (err) {
                console.log(err);
                defer2.reject(err);
            });

        q.all([defer1.promise, defer2.promise]).then(function (data) {

            res.render('admin/stats',
                {
                    datefrom: req.query.datefrom,
                    dateto: req.query.dateto,
                    data: data[0],
                    layout: "admin"
                });
        }, function (error) {
            console.log(error);
            flashGenerator.setAppError(req.session, err);
            res.render('admin/stats',
                {
                    layout: "admin"
                });
        }).catch(function (error) {
            console.log(error.stack);
            flashGenerator.setAppError(req.session, err);
            res.render('admin/stats',
                {
                    layout: "admin"
                });
        });

    }


}
