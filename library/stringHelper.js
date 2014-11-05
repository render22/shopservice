module.exports.strip_tags = function (str) {	// Strip HTML and PHP tags from a string
    //
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)

    return (str && str.replace) ? str.replace(/<\/?[^>]+>/gi, '') : str;
}

module.exports.validateEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports.stripSpaces = function (string) {
    return (str && str.replace) ? str.replace(/\s/g, '') : str;
}
