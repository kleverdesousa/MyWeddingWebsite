var user, arrUsers = [];
var search = function (aName) {
    var obj;
    var getData = {
        id: aName.toUpperCase().replace(" ", "-")
    }
    var showUsers = function () {
        delInfo();
        var html = '';

        arrUsers.forEach(function (aUser, aInd) {
            html += '<div class="info" id="user' + aUser.id + 'Container">\
                    <h5 class="name">'+ aUser.firstName + ' ' + aUser.lastName + '</h5>\
                    <input id="yes' + aUser.id + '" type="radio" value="' + _('Aceitar com prazer') + '" name="attending' + aUser.id + '" ' + ' />\
                    <label for="yes' + aUser.id + '" class="side-label">' + _('Aceitar com prazer') + '</label>\
                    <input id="no' + aUser.id + '" type="radio" value="' + _('Recusar com pesar') + '" name="attending' + aUser.id + '" ' + ' />\
                    <label for="no' + aUser.id + '" class="side-label">' + _('Recusar com pesar') + '</label>\
               </div>';

            // Add childs options
            if (aInd == 0 && aUser.childsAllowed > 0) {
                html += '<h5 id="userChildsLabel" class="name"> ' + _('Crianças') + ' </h5>\
                                <select class="form-control" id="user' + aUser.id + 'Childs">';
                for (var i = 0; i <= aUser.childsAllowed; i++)
                    html += '<option>' + i + '</option>'
                html += '</select>';
            }
        });

        $(html).insertAfter('#custom-search-input');

        // Show message
        $('.message-comments').css({
            "opacity": "1",
            "margin-top": "30px",
            "height": "auto"
        });

        // Show button
        $("#divBtnRSVP").show();
    }

    $.get('/users/search', getData, function (aRes) {
        if (!aRes.err) {
            obj = JSON.parse(aRes);
        } else {
            delInfo();
            arrUsers = [];
            var output = '<div class="alert alert-danger fade in">' + _('Oups, houve um problema. Tente novamente.') + '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
            $("#contact_results").append(output).slideDown();
        }
    }).done(function () {
        if (obj.noObj) {
            delInfo();
            arrUsers = [];
            var output = '<div class="alert alert-danger fade in">' + _('Oups, não lhe encontramos na lista. Vérifique seu nome e tente novamente.') + '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
            $("#contact_results").append(output).slideDown();
        } else
            user = obj;

        if (user && $('#user' + user.id+'Container').length == 0) {
            arrUsers = [];
            arrUsers.push(user);
            if (user.linked) {
                var arrLinked = user.linked.split(";");
                arrLinked.forEach(function (aId, aInd) {
                    $.get('/users/search', {
                        id: aId
                    }, function (aRes) {
                        arrUsers.push(JSON.parse(aRes));
                    }).done(function () {
                        if (aInd == arrLinked.length - 1) {
                            showUsers();
                        }
                    })
                });
            } else {
                showUsers();
            }
        }
    })
};

var delInfo = function () {
    $("#divBtnRSVP").hide();
    $('.message-comments').css({
        "opacity": "0",
        "margin-top": "auto",
        "height": "0"
    });
    $('[id^="user"]').remove();
    $("#contact_results").empty();
}

$(document).ready(function () {
    $("#divBtnRSVP").hide();

    $("#rsvp_form .form-group").slideDown();

    $("#searchInput").keyup(function (e) {
        if (e.which == 13)
            search($.trim($("#searchInput").val()));
        if ($.trim($("#searchInput").val()) == "")
            delInfo();
    });
    
    $("#searchBtn").click(function (e) {
        search($.trim($("#searchInput").val()));
    });

    $("#submit_rsvp").click(function () {
        var proceed = true;

        //simple validation at client's end
        //loop through each field and we simply change border color to red for invalid fields		
        $("#rsvp_form .form-group input[required], #rsvp_form .form-group textarea[required]").each(function () {
            $(this).css('background-color', '');
            if (!$.trim($(this).val())) { //if this field is empty 
                $(this).css('background-color', '#FFDEDE'); //change border color to #FFDEDE   
                proceed = false; //set do not proceed flag
            }
            //check invalid email
            var email_reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
            if ($(this).attr("type") == "email" && !email_reg.test($.trim($(this).val()))) {
                $(this).css('background-color', '#FFDEDE'); //change border color to #FFDEDE   
                proceed = false; //set do not proceed flag				
            }
        });

        if (user && proceed) { //everything looks good! proceed...
            //get input field values data to be sent to server
            var post_data = {};
            var date = new Date;
            arrUsers.forEach(function (aUser, aInd) {
                aUser.status = ($('#user' + aUser.id + 'Container input:checked').length > 0) ? $('#user' + aUser.id + 'Container input:checked').val() : "";
                aUser.date = date.toString();
                if ($('#user' + aUser.id + 'Childs').length > 0)
                    aUser.childsConfirmed = $('#user' + aUser.id + 'Childs option:selected').text();
            });

            post_data.users = JSON.stringify(arrUsers);
            post_data.date = date.toString();
            post_data.msg = $('#rsvp_form textarea[name=message]').val();

            //Ajax post data to server
            $.post('/user/rsvp', post_data, function (response) {
                delInfo();
                arrUsers = [];
                if (response.type == 'error' || response.error || response.redirect) {
                    window.location = response.redirect;
                } else {
                    //reset values in all input fields
                    $("#rsvp_form  input[required=true], #rsvp_form textarea[required=true]").val('');
                    $('html, body').animate({ scrollTop: $("#rsvp_form .form-group").offset().top - 150 }, 2000);
                };
            }, 'json');
        };
    });

    //reset previously set border colors and hide all message on .keyup()
    $("#rsvp_form  input[required=true], #rsvp_form textarea[required=true]").keyup(function () {
        $(this).css('background-color', '');
        $("#result").slideUp();
    });
});