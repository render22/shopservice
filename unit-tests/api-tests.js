var assert = require('chai').assert;
var rest = require('restler');
var unitConfig = require('./config.json');


suite('Test', function () {
    var lastInsertedId = [];
    var accessToken;
    if (unitConfig.api) {
        for (var testName in unitConfig.api) {
            if (unitConfig.api[testName].ignore === true)
                continue;
            (function (name, unitConfig) {
                test(name, function (done) {
                    var options = {
                        headers: {'Content-type': 'application/json'},
                        timeout: 5000
                    };

                    var schema = (process.env.NODE_APP_LOCATION === 'local') ? unitConfig.local.schema : unitConfig.remote.schema;
                    var domain = (process.env.NODE_APP_LOCATION === 'local') ? unitConfig.local.domain : unitConfig.remote.domain;

                    var url = schema + '://' + domain + unitConfig.api[name]['url'];
                    url.split('/').slice(3).forEach(function (part) {
                        if (~part.indexOf(':'))
                            url = url.replace(part, lastInsertedId[part]);

                    });

                    console.log(url);
                    if (unitConfig.api[name].options && unitConfig.api[name].options.body)
                        options.data = JSON.stringify(unitConfig.api[name].options.body);

                    if (accessToken)
                        options.headers.Authorization = 'Bearer ' + accessToken;

                    rest[unitConfig.api[name]['requestType']](url, options)
                        .on('success', function (data) {

                            if (data.data && (Object.keys(data.data).length || data.data.length)) {

                                data.data.length = Object.keys(data.data).length;
                                if (data.data.id) lastInsertedId[':' + name] = data.data.id;

                            }

                            if (data.access_token && data.access_token.length) {
                                accessToken = data.access_token
                            }


                            assert(eval(unitConfig.api[name]['condition']), unitConfig.api[name]['error'] + ', ' + JSON.stringify(data) + ' returned instead');
                            done();
                        }).on('fail', function (data) {

                            assert(eval(unitConfig.api[name]['condition']), unitConfig.api[name]['error'] + ', ' + JSON.stringify(data) + ' returned instead');

                            done();
                        })

                        .on('error', function () {
                            assert(false, 'request failed');

                            done();
                        })
                });
            })(testName, unitConfig)

        }
    }


});
