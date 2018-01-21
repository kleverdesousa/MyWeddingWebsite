$(function () {
    $("#fr_FR").click(function (e) {
        if (lang != "fr") {
            lang = "fr";
            loadLang('/login/lang/');
        }
    });

    $("#br_PT").click(function (e) {
        if (lang != "pt") {
            lang = "pt";
            loadLang('/login/lang/');
        }
    });

    $('#sbForm').submit(function (e) {
        e.preventDefault();
        var proceed = true;
        //simple validation at client's end
        //loop through each field and we simply change border color to red for invalid fields		
        $("#sbForm input[required]").each(function () {
            $(this).css('background-color',''); 
            if(!$.trim($(this).val())){ //if this field is empty 
                $(this).css('background-color','#FFDEDE'); //change border color to #FFDEDE   
                proceed = false; //set do not proceed flag
            }
            //check invalid email
            var email_reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/; 
            if($(this).attr("type")=="email" && !email_reg.test($.trim($(this).val()))){
                $(this).css('background-color','#FFDEDE'); //change border color to #FFDEDE   
                proceed = false; //set do not proceed flag				
            }
        });
       
        if (proceed) {
            var infos;
            $.get("https://freegeoip.net/json/?callback=?", function (data) {
                infos = data;
            }, "json").done(function () {
                var output,
                    post_data = {
                        'id': $('#sb input[name=email]').val(),
                        'firstName': $('#sb input[name=firstName]').val(),
                        'lastName': $('#sb input[name=lastName]').val(),
                        'phone': $('#sb input[name=tel]').val(),
                        'infos': JSON.stringify(infos)
                    };
                $.post('users/subscribe', post_data, function (response) {
                    if (response.error) { //load json data from server and output message     
                        output = '<div class="alert alert-danger fade in">' + response.error + '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
                        $("#sbForm").append(output).slideDown();
                    } else {
                        $('#lg input[name=email]').val($('#sb input[name=email]').val());
                        $("#sbForm input").each(function () {
                            $(this).val('');
                            $(this).css('background-color', '');
                        });

                        output = '<div class="alert alert-success fade in"> Ok! Login now. Password:' + response.password + '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div><br>';
                        $("#sbForm").append(output).slideDown();
                    }
                }, 'json');
            });
        } else {
            var output = '<div class="alert alert-danger fade in">Please enter all required fields <a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
            $("#sbForm").append(output).slideDown();
        }
    });
    
    $('#lgForm').submit(function (e) {
        e.preventDefault();
        var proceed = true;
        //simple validation at client's end
        //loop through each field and we simply change border color to red for invalid fields		
        $("#lgForm input[required]").each(function () {
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

        if (proceed) {
            var infos;
            $.getJSON("http://freegeoip.net/json/?callback=?", function (data) {
                infos = data;
                var now = new Date();
                infos.dateTime = now.toString();
            }).then(function () {
                var output,
                    post_data = {
                        'id': $('#lgForm input[name=email]').val(),
                        'firstName': $('#lgForm input[name=firstName]').val(),
                        'lastName': $('#lgForm input[name=lastName]').val(),
                        'phone': $('#lgForm input[name=tel]').val(),
                        'infos': JSON.stringify(infos),
                        'lang': lang
                    };
                $.post('/login/users', post_data, function
                    (response) {
                    if (response.error) { //load json data from server and output message     
                        output = '<div class="alert alert-danger fade in">' + response.error + '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
                        $("#lgForm").append(output).slideDown();
                    } else {
                        window.location = response.redirect;
                    }
                }, 'json');
            });
        } else {
            var output;
            if (lang == "fr")
                output = '<div class="alert alert-danger fade in">Merci de vérifier tous les champs du formulaire.<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
            else
                output = '<div class="alert alert-danger fade in">Por favor verifique todas informaçoes do formulario.<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a></div>';
            $("#lgForm").append(output).slideDown();
        };
    });
});
