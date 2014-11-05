var assert = require('chai').assert;
var rest = require('restler');
var unitConfig = require('./config.json');


suite('Test', function () {
    var lastInsertedId = [];
    if (unitConfig.api) {
        for (var testName in unitConfig.api) {
            (function (name, unitConfig) {
                test(name, function (done) {
                    var options = {
                        headers: {'Content-type': 'application/json'},
                        timeout: 5000
                    };
                    var url = unitConfig.schema + '://' + unitConfig.domain + unitConfig.api[name]['url'];
                    url.split('/').slice(3).forEach(function (part) {
                        if (~part.indexOf(':'))
                            url = url.replace(part, lastInsertedId[part]);

                    });

                    if (unitConfig.api[name].options && unitConfig.api[name].options.body)
                        options.data = JSON.stringify(unitConfig.api[name].options.body);

                    rest[unitConfig.api[name]['requestType']](url, options)
                        .on('success', function (data) {

                            if (data.data && !data.data.length) {
                                data.data.length = Object.keys(data.data).length;
                                if (data.data.id) lastInsertedId[':' + name] = data.data.id;

                            }


                            assert(eval(unitConfig.api[name]['condition']), unitConfig.api[name]['error']);
                            done();
                        }).on('error', function () {
                            console.log('request failed');
                            done();
                        })
                });
            })(testName, unitConfig)

        }
    }


});
