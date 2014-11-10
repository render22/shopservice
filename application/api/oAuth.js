var passport = require('passport');
var oauth2orize = require('oauth2orize');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var Users = require('../models/users.js');
var Client = require('./models/client.js');
var AccessToken = require('./models/accessToken.js');
var RefreshToken = require('./models/refreshToken.js');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

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
        var self = this;
        this._initOAuthServer();
        passport.use(new BasicStrategy(
            function (username, password, done) {

                Client(self.bookshelf, {clientId: username}).fetch()
                    .then(function (client) {
                        if (!client) {
                            return done(null, false);
                        }
                        if (client.attributes.clientSecret != password) {
                            return done(null, false);
                        }

                        return done(null, client);
                    }).catch(function (error) {
                        console.log(error);
                    });

            }
        ));

        passport.use(new ClientPasswordStrategy(
            function (clientId, clientSecret, done) {

                Client(self.bookshelf, {clientId: clientId}).fetch()
                    .then(function (client) {
                        if (!client) {
                            return done(null, false);
                        }
                        if (client.attributes.clientSecret != clientSecret) {
                            return done(null, false);
                        }

                        return done(null, client);
                    }).catch(function (error) {
                        console.log(error);
                        done(error);
                    });


            }
        ));

        passport.use(new BearerStrategy(
            function (accessToken, done) {

                AccessToken(self.bookshelf, {token: accessToken}).fetch()
                    .then(function (token) {

                        if (!token) {
                            return done(null, false);
                        }
                        var tokenCrTimestamp=(new Date(token.attributes.created)).getTime();

                        if (Math.round((Date.now() - token.created) / 1000) > self.config.credentials.tokenLife) {
                            AccessToken(self.bookshelf)
                                .where({token: accessToken})
                                .destroy()
                                .catch(function (error) {
                                    console.log(error);
                                    return done(error);

                                });

                            return done(null, false, {message: 'Token expired'});
                        }

                        Users(self.bookshelf, {id: token.attributes.userId}).fetch()
                            .then(function (user) {

                                if (!user) {
                                    return done(null, false, {message: 'Unknown user'});
                                }
                                var info = {scope: '*'}
                                done(null, user, info);

                            })
                            .catch(function (error) {
                                console.log(error);
                                return done(error);

                            });


                    }).catch(function (error) {
                        console.log(error);
                        return done(error);

                    });


            }
        ));

        this.passport = passport;

    },

    _initOAuthServer: function () {

        // create OAuth 2.0 server
        var server = oauth2orize.createServer();
        var self = this;
        // Exchange username & password for access token.
        server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {

            Users(self.bookshelf, {email: username}).fetch()
                .then(function (user) {

                    if (!user) {
                        return done(null, false);
                    }

                    if (!bcrypt.compareSync(password, user.attributes['password'])) {
                        return done(null, false);
                    }

                    RefreshToken(self.bookshelf)
                        .where({userId: user.id, clientId: client.attributes.clientId})
                        .destroy()
                        .catch(function (error) {
                            console.log(error);
                            return done(error);
                        });

                    AccessToken(self.bookshelf)
                        .where({userId: user.id, clientId: client.attributes.clientId})
                        .destroy()
                        .catch(function (error) {
                            console.log(error);
                            return done(error);
                        });


                    var tokenValue = crypto.randomBytes(32).toString('base64');
                    var refreshTokenValue = crypto.randomBytes(32).toString('base64');
                    var token = new AccessToken(self.bookshelf, {
                        token: tokenValue,
                        clientId: client.attributes.clientId,
                        userId: user.id
                    });
                    var refreshToken = new RefreshToken(self.bookshelf, {
                        token: refreshTokenValue,
                        clientId: client.attributes.clientId,
                        userId: user.id
                    });
                    refreshToken.save().catch(function (error) {
                        console.log(error);
                        return done(error);
                    });
                    var info = {scope: '*'};
                    token.save().then(function () {
                        done(null, tokenValue, refreshTokenValue, {'expires_in': self.config.credentials.tokenLife});
                    }).catch(function (error) {
                        console.log(error);
                        return done(error);
                    });


                })
                .catch(function (error) {
                    console.log(error);
                    return done(error);
                });


        }));

// Exchange refreshToken for access token.
        server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {


            RefreshToken(self.bookshelf, {token: refreshToken}).fetch()
                .then(function (token) {
                    if (!token) {
                        return done(null, false);
                    }

                    Users(self.bookshelf, {id: token.userId}).fetch()
                        .then(function (user) {
                            if (!user) {
                                return done(null, false);
                            }

                            RefreshToken(self.bookshelf)
                                .where({userId: user.userId, clientId: client.attributes.clientId})
                                .destroy()
                                .catch(function (error) {
                                    return done(error);
                                });

                            AccessToken(self.bookshelf)
                                .where({userId: user.userId, clientId: client.attributes.clientId})
                                .destroy()
                                .catch(function (error) {
                                    return done(error);
                                });


                            var tokenValue = crypto.randomBytes(32).toString('base64');
                            var refreshTokenValue = crypto.randomBytes(32).toString('base64');
                            var token = new AccessToken(
                                self.bookshelf,
                                {
                                    token: tokenValue,
                                    clientId: client.attributes.clientId,
                                    userId: user.userId
                                });
                            var refreshToken = new RefreshToken(
                                self.bookshelf,
                                {
                                    token: refreshTokenValue,
                                    clientId: client.attributes.clientId,
                                    userId: user.userId
                                });
                            refreshToken.save().catch(function (error) {
                                console.log(error);
                                return done(error);
                            });
                            var info = {scope: '*'};
                            token.save().catch(function (error) {
                                console.log(error);
                                return done(error);
                            });

                            done(null, tokenValue, refreshTokenValue, {'expires_in': self.config.credentials.tokenLife});

                        })
                        .catch(function (error) {
                            console.log(error);
                            return done(err);
                        });


                })
                .catch(function (error) {
                    return done(err);
                });


        }));

        this.app.use('/api/*', passport.initialize());
        this.server = server;
    },

    gettoken: function () {
        return [
            this.passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
            this.server.token(),
            this.server.errorHandler()
        ];

    },

    userinfo: function (req, res) {
        console.log(this.passport.authenticate('bearer', {session: false}));
        res.send('ok');
    }


}

