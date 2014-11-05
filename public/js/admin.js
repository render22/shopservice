$(document).ready(function () {
    var part = window.location.toString().split('/').pop();
    $('.nav-stacked a[href$="' + part + '"]').parent().addClass('active');

    $('.removeUser').click(function (e) {
        if (confirm('Are you sure?')) {
            window.location = '/admin/removeuser/' + $(this).attr('data');
        }

        e.preventDefault();
    });

    $('.removeAd-admin').click(function (e) {

        if (confirm('Are you sure?')) {
            window.location = '/admin/removead/' + $(this).attr('data');
        }

        e.preventDefault();
    });

    $('.control-ads').click(function (e) {
        var adId = $(this).attr('id');
        $('.admin-ads form input[name="id"]').val(adId);
        $('.admin-ads').modal();
        $.ajax({
            url: '/admin/ads?action=getinfo&adId=' + adId,
            type: 'post',
            success: function (resp) {
                console.log(resp);
                if (resp.status === 'error') {

                    alert('It is some problems with your request now. Please try little bit later.');
                } else {
                    for (var name in resp) {
                        if (name === 'photo')
                            $('#photo').attr('src', '/uploads/' + resp[name]);
                        else
                            $('.admin-ads form input[name="' + name + '"], .admin-ads form textarea[name="' + name + '"]').val(resp[name]);
                    }

                }


            },

            error: function () {
                alert('It is some problems with your request now. Please try little bit later.');
            }
        });
        $('.save').click(function () {

            if (validateNotEmpty($('.admin-ads form')))
                return false;

            var fd = new FormData($('.admin-ads form')[0]);
            $.ajax({
                url: '/admin/ads?action=update',
                type: 'post',
                data: fd,
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                success: function (resp) {
                    if (resp.status === 'error') {
                        if (resp.errors) {
                            alert('Please enter correct data');
                        } else
                            alert('It is some problems with your request now. Please try little bit later.');
                    }

                    var prevContent = $('.modal-body').html();
                    $('.modal-body').html('Data have successfully changed');

                    setTimeout(function () {
                        $('.admin-ads').modal('hide');
                        window.location = window.location;
                    }, 1500);

                },

                error: function () {
                    alert('It is some problems with your request now. Please try little bit later.');
                }
            });

            $('.modal-body form')[0].reset();
        });

        e.preventDefault();
    });

    $('.create-ad').click(function (e) {
        $('.input-error').remove();
        $('.admin-create-ads').modal();

        $('.create').click(function () {

            if (validateNotEmpty($('.admin-create-ads form')))
                return false;

            var fd = new FormData($('.admin-create-ads form')[0]);
            $.ajax({
                url: '/admin/ads?action=create',
                type: 'post',
                data: fd,
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                success: function (resp) {
                    if (resp.status === 'error') {
                        if (resp.errors) {
                            for (var name in resp.errors) {
                                $('.admin-create-ads form input[name="' + name + '"]')
                                    .parent()
                                    .append('<span class="label input-error label-danger">' + resp.errors[name] + '</span>');
                            }

                        } else
                            alert('It is some problems with your request now. Please try little bit later.');
                    } else {
                        var prevContent = $('.modal-body').html();
                        $('.modal-body').html('User have successfully created');

                        setTimeout(function () {
                            $('.admin-users').modal('hide');
                            window.location = window.location;
                        }, 1500);
                    }


                },

                error: function () {
                    alert('It is some problems with your request now. Please try little bit later.');
                }
            });

            $('.modal-body form')[0].reset();
        });

        e.preventDefault();
    });

    $('.control-users').click(function (e) {
        var userId = $(this).attr('id');
        $('.admin-users form input[name="id"]').val(userId);
        $('.admin-users').modal();
        $.ajax({
            url: '/admin/users?action=getinfo&userId=' + userId,
            type: 'post',
            success: function (resp) {
                if (resp.status === 'error') {

                    alert('It is some problems with your request now. Please try little bit later.');
                } else {
                    for (var name in resp) {
                        $('.admin-users form input[name="' + name + '"]').val(resp[name]);
                    }

                }


            },

            error: function () {
                alert('It is some problems with your request now. Please try little bit later.');
            }
        });
        $('.save').click(function () {

            if (validateNotEmpty($('.admin-users form')))
                return false;


            $.ajax({
                url: '/admin/users?action=update',
                type: 'post',
                data: $('.admin-users form').serialize(),
                success: function (resp) {
                    if (resp.status === 'error') {
                        if (resp.errors) {
                            alert('Please enter correct data');
                        } else
                            alert('It is some problems with your request now. Please try little bit later.');
                    }

                    var prevContent = $('.modal-body').html();
                    $('.modal-body').html('Data have successfully changed');

                    setTimeout(function () {
                        $('.admin-users').modal('hide');
                        window.location = window.location;
                    }, 1500);

                },

                error: function () {
                    alert('It is some problems with your request now. Please try little bit later.');
                }
            });

            $('.modal-body form')[0].reset();
        });

        e.preventDefault();
    });

    $('.create-user').click(function (e) {
        $('.input-error').remove();
        $('.admin-create-users').modal();

        $('.create').click(function () {

            if (validateNotEmpty($('.admin-create-users')))
                return false;

            $.ajax({
                url: '/admin/users?action=create',
                type: 'post',
                data: $('.admin-create-users form').serialize(),
                success: function (resp) {
                    if (resp.status === 'error') {
                        if (resp.errors) {
                            for (var name in resp.errors) {
                                $('.admin-create-users form input[name="' + name + '"]')
                                    .parent()
                                    .append('<span class="label input-error label-danger">' + resp.errors[name] + '</span>');
                            }

                        } else
                            alert('It is some problems with your request now. Please try little bit later.');
                    } else {
                        var prevContent = $('.modal-body').html();
                        $('.modal-body').html('User have successfully created');

                        setTimeout(function () {
                            $('.admin-users').modal('hide');
                            window.location = window.location;
                        }, 1500);
                    }


                },

                error: function () {
                    alert('It is some problems with your request now. Please try little bit later.');
                }
            });

            $('.modal-body form')[0].reset();
        });

        e.preventDefault();
    });

});


function validateNotEmpty(form) {
    var errors = 0;
    $('.input-error').remove();
    form.find('input,textarea').each(function (i, el) {

        if ($(el).attr('type') !== 'file' && $(el).val().length === 0) {
            $(el).parent().append('<span class="label input-error label-danger">Field is empty</span>');
            ++errors;
        }

    });

    if (errors)
        return true;
    else
        return false;
}