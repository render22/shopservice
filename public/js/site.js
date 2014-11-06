$(document).ready(function () {
    if (uid) {
        $('.contactUser[data="'+uid+'"]').remove();
    }else{
        $('.contactUser').remove();
    }
    $('.removeAd').click(function (e) {
        if (confirm('Are you sure?')) {
            window.location = '/removead/' + $(this).attr('id');
        }

        e.preventDefault();
    });

    $('.contactUser').click(function () {
        $('#message').modal();
        var receiverId = $(this).attr('data');
        var msgHash = null;
        $.ajax({
            async: false,
            type: 'get',
            url: '/users/pm?action=getid',
            data: 'receiverId=' + receiverId,
            success: function (data) {
                if (data.messageId)
                    msgHash = data.messageId;
            },

            error: function () {
                alert('It is some problems with your request now. Please try little bit later.');
            }
        });

        messageForm(receiverId, msgHash);


    });

    if (~window.location.toString().indexOf('pmdialog')) {
        var receiverId = $("#receiver").val();
        messageForm(receiverId, null, true);
    }

});


function messageForm(receiverId, msgHash, reload) {


    $('.send').click(function () {

        if (!$('#msg').val().length) {
            return alert('Please enter your message');
        }

        var dialogId = (msgHash) ? '&msgHash=' + msgHash : ''
        $.ajax({
            url: '/users/pm',
            type: 'post',
            data: 'message=' + $('#msg').val() + '&receiver=' + receiverId + dialogId,
            success: function (resp) {
                if (resp.status === 'error') {
                    if (resp.errors) {
                        alert('Please enter your message');
                    } else
                        alert('It is some problems with your request now. Please try little bit later.');
                }
                if (reload)
                    window.location = window.location;
                var prevContent = $('.modal-body').html();
                $('.modal-body').html('Your message has successfully sent');
                setTimeout(function () {
                    $('#message').modal('hide');
                    $('.modal-body').html(prevContent);
                }, 1500);

            },

            error: function () {
                alert('It is some problems with your request now. Please try little bit later.');
            }
        });

        $('.modal-body form')[0].reset();
    });
}