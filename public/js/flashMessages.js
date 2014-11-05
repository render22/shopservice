$(document).ready(function () {

    if (errors.length > 0) {
        var err = JSON.parse(errors);
        var message = '';

        if (err) {

            var fields = (inputData.length) ? JSON.parse(inputData) : '';
            for (var k in fields) {
                var field = $('form [name="' + k + '"]');
                field.val(fields[k]);
            }

            for (var k in err) {
                var field = $('form [name="' + k + '"]');
                if(field){
                    var label = field.parents().eq(0).prev().text();

                    field.css({
                        "border": "2px solid red"
                    });

                    message += '<p><b>' + label + ': </b> ' + err[k] + '</p>';
                }else{
                    message += '<p>' + err[k] + '</p>';
                }

            }

            $('.alert').addClass('alert-danger');
        } else if (err.apperror) {
            $('.alert').addClass('alert-warning');
            message = '<p>' + err.apperror + '</p>';

        }

        $('.alert').html(message);

    } else if (notification.length > 0) {
        notification = JSON.parse(notification);
        $('.alert').html(notification.message);
        $('.alert').addClass('alert-' + notification.type);
    }


});


