$(function () {
    $("#fr_FR").click(function (e) {
        if (lang != "fr") {
            lang = "fr";
            loadLang('/home/lang/');
        }
    });

    $("#br_PT").click(function (e) {
        if (lang != "pt") {
            lang = "pt";
            loadLang('/home/lang/');
        }
    });

});