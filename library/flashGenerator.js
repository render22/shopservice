module.exports.setErrors= function(session,errors,fields){
    if(!session.flash)
        session.flash={};

    session.flash.error = {

        message: JSON.stringify(errors),

        fields: JSON.stringify(fields)

    };


}

module.exports.setAppError=function(session,error){
    if(!session.flash)
        session.flash={};

    var message = {
        "apperror": 'There was an error processing your submission. ' +
        'Please try again.'
    }

    session.flash.error = {


        message: JSON.stringify(message)

    };
}

module.exports.setMessage=function(session,message,type){
    if(!session.flash)
        session.flash={};

    session.flash.notification = {

        type: type,
        message: message

    };
}


module.exports.get= function(session){
    return session.flash;
}

module.exports.clear= function(session){
    delete session.flash;
}