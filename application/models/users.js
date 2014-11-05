var stringHelper = require('../../library/stringHelper.js');
var q = require('q');
var bcrypt = require('bcrypt-nodejs');
var paypal = require('paypal-rest-sdk');

/**
 * Users model
 * @param bookshelf
 * @param properties
 * @returns {Users}
 */
module.exports = function (bookshelf, properties) {
    var Users = bookshelf.Model.extend({
        tableName: 'users',
        filterParams: function (params) {
            for (var k in params)
                params[k] = stringHelper.strip_tags(params[k]);
            if (params[k].trim)
                params[k] = params[k].trim();
        }
    });

    Users.prototype.testMode=false;
    Users.prototype.setTestMode=function(){
        this.testMode=true;
        return this;
    }

    /**
     * Authentication method which takes optionally role for separate login for admin or customers
     * @param session
     * @param role
     * @returns {*}
     */
    Users.prototype.auth = function (session, role) {
        var defer = q.defer();

        var self = this;
        var condition={
            email: this.attributes['email'],
            role: (role) ? role : "customer"
        };

        if(!this.testMode)
            condition.active=1;


        bookshelf.knex.select('*').from('users').where(
            condition
            ).then(function (result) {

                if (!result.length)
                    defer.reject(false);

                if (bcrypt.compareSync(self.attributes['password'], result[0]['password'])) {

                    session.user = result[0];
                    defer.resolve();
                } else {
                    defer.reject(false);
                }


            }).catch(function (error) {
                defer.reject(error);
            });

        return defer.promise;

    }

    /**
     * Changing user email and password if both new and old password provided and old password match
     * @param session
     * @returns {*}
     */
    Users.prototype.changeCred = function (session) {
        var defer = q.defer();
        session.user.email = this.attributes['email'];
        if (this.attributes['old_password'] && this.attributes['old_password'].length) {

            if (!this.attributes['new_password'].length)
                defer.reject({new_password: 'field should not be empty'});


            if (!bcrypt.compareSync(this.attributes['old_password'], session.user.password))
                defer.reject({old_password: 'wrong password'});


            this.set({"password": bcrypt.hashSync(this.attributes['new_password'])});
            session.user.password = bcrypt.hashSync(this.attributes['new_password']);

        }

        delete this.attributes['old_password'];
        delete this.attributes['new_password'];

        this.save().then(function () {
            defer.resolve();
        });

        return defer.promise;

    }

    /**
     * Creating request for creating payment on paypal sandbox using NodeJs-paypal-sdk
     */
    Users.prototype.pay = function (config, session) {
        var defer = q.defer();
        paypal.configure(config.credentials.paypal.api);
        var payment = {
            "intent": "authorize",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": config.credentials.paypal.urls,
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Ads account creation",
                        "price": config.user.accountCreationCost,
                        "currency": config.user.accountCreationCostCurrency,
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": config.user.accountCreationCostCurrency,
                    "total": config.user.accountCreationCost
                },
                "description": config.user.description
            }]
        };
        var self=this;

        paypal.payment.create(payment, function (error, payment) {
            if (error) {
                console.log(error);
                defer.reject(error);
            } else {

                session.paymentId = payment.id;

                defer.resolve([payment['links'][1].href, payment.id]);
            }
        });


        return defer.promise;
    },



    /**
     * Getting response from paypal sandbox, checking payment status
     * and updating users db record with active status if payment correct
     */
    Users.prototype.confirmPayment = function (config, paymentId, session) {

        var defer = q.defer();
        paypal.configure(config.credentials.paypal.api);
        var self = this;
        paypal.payment.get(paymentId, function (error, payment) {
            delete session.paymentId;

            if (error) {
                defer.reject(error);
            } else {
                if (payment.state != 'created') {
                    defer.reject(error);
                }

                self.set({"id": session.userId})
                    .save({"active": 1}, {patch: true})
                    .then(function () {
                        defer.resolve();
                    }).catch(function (error) {
                        defer.reject(error);
                    });


                delete session.userId;
            }
        });

        return defer.promise;
    },

    /**
     * Getting count of registered users
     */
        Users.prototype.getStat = function (startDate, endDate, config) {

            var query = bookshelf.knex('users')
                .count();
            if (startDate) {
                var parts = startDate.split('/');
                var newDate = parts[2] + '-' + parts[0] + '-' + parts[1];

                startDate = newDate.replace('-0', '-');
                query.where(bookshelf.knex.raw('"regDate" >= \'' + startDate + '\'::date'));
            }


            if (endDate) {

                query.where(bookshelf.knex.raw('"regDate" <= \'' + endDate + '\'::date'));
            }

            var listPayment = {
                'count': '1',
                'start_index': '1'
            };

            /*paypal.generateToken(config.credentials.paypal.api,function(err,token){

             console.log(token);
             var https = require('https');
             var options = {
             host: 'api.sandbox.paypal.com',
             path: '/v1/payments/payment',
             headers:{
             'Authorization': token,
             'Content-type':'application/json'
             }
             };

             var req = https.get(options, function(res) {
             console.log('STATUS: ' + res.statusCode);
             console.log(req.headers);
             console.log('HEADERS: ' + JSON.stringify(res.headers));


             // Buffer the body entirely for processing as a whole.
             var bodyChunks = [];
             res.on('data', function(chunk) {
             // You can process streamed parts here...
             bodyChunks.push(chunk);
             }).on('end', function() {
             var body = Buffer.concat(bodyChunks);
             console.log('BODY: ' + body);
             // ...and/or process the entire body here.
             })
             });

             req.on('error', function(e) {
             console.log('ERROR: ' + e.message);
             });
             });

             */

            /*paypal.payment.list(listPayment, function (error, payment) {
             if (error) {
             throw error;
             } else {
             console.log("List Payments Response");
             console.log(payment);
             }
             });*/

            return query;
        }

    /**
     * Validating and filtering input data
     * @param isRegistration
     * @returns {*}
     */
    Users.prototype.validateData = function (isRegistration) {
        var defer = q.defer();

        if (!Object.keys(this.attributes).length) {

            defer.reject('No data provided');
        } else {
            this.filterParams(this.attributes);

            var errors = {};
            for (var prop in this.attributes) {
                if (prop == 'new_password' || prop == 'old_password')
                    continue;
                if (this.attributes[prop].length === 0) {
                    errors[prop] = 'field should not be empty';
                } else if (
                    (prop === 'firstname' || prop === 'lastname')
                    &&
                    (this.attributes[prop].length < 3 || this.attributes[prop].length > 50)
                ) {
                    errors[prop] = 'length should be longer than 3 and less than 50 characters';
                } else if (prop === 'email' && !stringHelper.validateEmail(this.attributes[prop])) {
                    errors[prop] = 'Please check your email address';
                } else if (isRegistration && prop === 'password'
                    &&
                    (this.attributes[prop].length < 6 || this.attributes[prop].length > 25)
                ) {
                    errors[prop] = 'password should be longer than 6 and less than 25 characters';
                } else if (prop === 'password_repeat' && (this.attributes[prop] !== this.attributes['password'])) {
                    errors[prop] = 'password and password repeat field should be match';
                }


            }


            if (Object.keys(errors).length > 0) {

                defer.reject(errors);

            }

            if (isRegistration) {
                delete this.attributes['password_repeat'];
                this.attributes['password'] = bcrypt.hashSync(this.attributes['password']);
            }


            if (isRegistration) {
                var self = this;
                bookshelf.knex.select('id').from('users').where({
                    email: self.attributes['email']
                }).limit(1).then(function (data) {

                    if (data.length)
                        defer.reject({email: 'This email already exists in database'});

                    defer.resolve(self);
                });
            } else {
                defer.resolve(this);
            }
        }


        return defer.promise;


    }


    var UsersObj = new Users(properties);
    UsersObj.on('saving', function (model, attrs, options) {


    });

    return UsersObj

}



