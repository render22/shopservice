var stringHelper = require('../../library/stringHelper.js');
var ValidationError = require('./exceptions/validation.js').ValidationErrors;
var q = require('q');

/**
 * Personal messages model
 * @param bookshelf
 * @param properties
 * @returns {Pm}
 */
module.exports = function (bookshelf, properties) {
    var Pm = bookshelf.Model.extend({
        tableName: 'messages',
        filterParams: function (params) {
            for (var k in params)
                params[k] = stringHelper.strip_tags(params[k]);
            if (params[k].trim)
                params[k] = params[k].trim();
        }
    });

    /**
     * Filtering and validating input data
     * @returns {*}
     */
    Pm.prototype.validateData = function () {
        var defer = q.defer();
        var errors = {};
        if (!Object.keys(this.attributes).length) {

            defer.reject('No data provided');
        } else {
            this.filterParams(this.attributes);
            for (var prop in this.attributes) {
                if (this.attributes[prop].length === 0) {
                    errors[prop] = 'field should not be empty';
                }

            }

            if (Object.keys(errors).length > 0) {

                defer.reject(errors);

            }else{
                defer.resolve(this);
            }
        }


        return defer.promise
    };


    var PmObj = new Pm(properties);


    return PmObj;

}



