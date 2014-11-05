var stringHelper = require('../../library/stringHelper.js');
var ValidationError = require('./exceptions/validation.js').ValidationErrors;


module.exports = function (bookshelf, properties) {
    var Pm = bookshelf.Model.extend({
        tableName: 'messages',
        filterParams: function (params) {
            for (var k in params) {
                params[k] = stringHelper.strip_tags(params[k]);
                if(params[k].trim){
                    params[k]=params[k].trim();
                }
            }
        }
    });


    var PmObj = new Pm(properties);
    PmObj.on('saving', function (model, attrs, options) {

        this.filterParams(model.attributes);

        var errors = {};
        for (var prop in model.attributes) {
            if (model.attributes[prop].length === 0) {
                errors[prop] = 'field should not be empty';
            }

        }


        if (Object.keys(errors).length > 0) {

            throw new ValidationError({validation: errors});

        }

    });

    return PmObj;

}



