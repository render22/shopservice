var qs = require('querystring');
var formidable = require('formidable');
var Ad = require('../models/ad.js');
var ValidationErrors = require('../models/exceptions/validation.js').ValidationErrors;
var flashGenerator = require('../../library/flashGenerator.js');
var fs = require('fs');


module.exports = {
    init: function (app) {
        this.app = app;
        this.bookshelf = app.get('bookshelf');
        this.winston = app.get('winston');
        this.config = app.get('config');

    },

    indexAction: function (req, res) {

        var curPage = (req.query.page) ? req.query.page : 1;

        if (req.query.q) {
            Ad(this.bookshelf).search(function (data) {
                res.render('index', {
                    ads: data

                });
            }, req.query.q);
        } else {
            Ad(this.bookshelf).fetchAds(function (data) {
                    var pages = {};

                    for (var i = 0; i < data.pagesCount; i++) {
                        var p = i;
                        pages[i] = {
                            page: (p+1),
                            comparePage: [(p+1), curPage]
                        }
                    }

                    res.locals.pages = pages;

                    res.render('index', {
                        ads: data

                    });
                }, null,
                (req.query.page) ? (--req.query.page) : 0,
                this.config.pagination.perPage);
        }


    },

    removeadAction: function (req, res) {

        Ad(this.bookshelf, {id: parseInt(req.params.id)}).destroy();
        res.redirect(303, req.header('referer'));
    },

    adAction: function (req, res) {

        Ad(this.bookshelf).fetchAds(function (data) {
            res.render('ad', {ad: data[0]});
        }, {"ads.id": parseInt(req.params.id)});


    },


    createadAction: function (req, res) {
        var self = this;
        if (req.method === 'POST') {
            var form = new formidable.IncomingForm();

            form.parse(req, function (err, fields, files) {
                if (err) {

                    flashGenerator.setAppError(req.session);
                    res.redirect(303, '/');
                }
                fields.userId = req.session.user.id;

                if (files.photo.size) {

                    var allowedFileMimes = ['image/jpeg', 'image/png', 'image/gif']

                    if ((~allowedFileMimes.indexOf(files.photo.type) && files.photo.size < 2000000)) {

                        var newName = Math.floor((Math.random() * 10000000) + 1) + '_' + files.photo.name;
                        var uploadDir = req.app.get('projectRoot') + '/' + req.app.get('config').files.uploadDir;
                        fs.renameSync(files.photo.path, uploadDir + '/' + newName);
                        fields.photo = newName;


                    } else {

                        flashGenerator.setErrors(req.session, {

                                photo: "Invalid file provided"
                            }
                        );

                        return res.redirect(303, '/createad');
                    }

                }

                Ad(self.bookshelf, fields).validateData()
                    .then(function (model) {
                        model.save().then(function () {
                            res.redirect(303, '/');
                        }).catch(function (err) {
                            console.log(err);
                            flashGenerator.setAppError(req.session);
                            res.redirect(303, '/createad');
                        });

                    }, function (errors) {

                        flashGenerator.setErrors(req.session, errors, fields);
                        res.redirect(303, '/createad');
                    });


            })


        } else {

            res.render('createad');

        }


    }


}

