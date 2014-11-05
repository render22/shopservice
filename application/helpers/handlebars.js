module.exports={
    formatDate: function (inputDate) {
        var date = new Date(inputDate);
        return '' + date.getFullYear()
        + ' ' + (date.getMonth() + 1)
        + ' ' + date.getDate()
        + ' ' + date.getHours()
        + ':' + date.getMinutes()
        + ':' + date.getSeconds();

    },

    isCurrentPage: function (comparePage) {

        if (comparePage[0] == comparePage[1])
            return 'active';
        else
            return '';
    }
}
