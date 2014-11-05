var util=require('util');
util.inherits(ValidationErrors,Error);

function ValidationErrors(object){

    Error.call(this);
    this.error=object;
}
exports.ValidationErrors=ValidationErrors;
