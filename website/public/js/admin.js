$(document).ready(function () {
    $.getJSON("/admin/data", function (aData) {
        if (aData.users) {
            var html = "", totalViews = 0;
            aData.users.forEach(function (aUser, aInd) {
                html += "<tr>";
                html += (aUser.id) ? "<td>" + aUser.id + "</td>" : "<td></td>";
                html += (aUser.firstName) ? "<td>" + aUser.firstName + "</td>" : "<td></td>";
                html += (aUser.lastName) ? "<td>" + aUser.lastName + "</td>" : "<td></td>";
                html += (aUser.phone) ? "<td>" + aUser.phone + "</td>" : "<td></td>";
                if (aUser.viewsCounter) {
                    html += "<td>" + aUser.viewsCounter + "</td>";
                    totalViews += parseInt(aUser.viewsCounter);
                } else
                    html += "<td></td>";
                if (aUser.infos) {
                    html += "<td><table><tbody>";
                    for (var i = aUser.infos.length - 3, len = aUser.infos.length; i < len; i++) {
                        if (i >= 0) {
                            html += "<tr>";
                            html += "<td> IP :</td>";
                            html += "<td>" + aUser.infos[i].ip + "</td>";
                            html += "</tr>";

                            html += "<tr>";
                            html += "<td> Data :</td>";
                            html += "<td>" + aUser.infos[i].dateTime + "</td>";
                            html += "</tr>";

                            html += "<tr>";
                            html += "<td> Pays :</td>";
                            html += "<td>" + aUser.infos[i].country_name + "</td>";
                            html += "</tr>";

                            html += "<tr>";
                            html += "<td> Cidade :</td>";
                            html += "<td>" + aUser.infos[i].city + "</td>";
                            html += "</tr>";

                            html += "<tr>";
                            html += "<td> Lat :</td>";
                            html += "<td>" + aUser.infos[i].latitude + "</td>";
                            html += "</tr>";

                            html += "<tr>";
                            html += "<td> Long :</td>";
                            html += "<td>" + aUser.infos[i].longitude + "</td>";
                            html += "</tr>";
                        }
                    }
                    html += "</tbody></table></td>";
                } else
                    html += "<td></td>";
                html += (aUser.usersSearch) ? "<td>" + aUser.usersSearch + "</td>" : "<td></td>";
                html += (aUser.usersAnswers) ? "<td>" + aUser.usersAnswers + "</td>" : "<td></td>";
                html += "</tr>";
            });
            $("#tableUsers tbody").append(html);
            $("[href$='#A']").text("Visitas " + totalViews);
        }


        if (aData.guests) {
            var html = "", totalConfirmed = 0, totalAnswer = 0;
            aData.guests.forEach(function (aGuest, aInd) {
                html += "<tr>";
                html += "<td>" + aInd + "</td>";
                html += (aGuest.firstName) ? "<td>" + aGuest.firstName + "</td>" : "<td></td>";
                html += (aGuest.lastName) ? "<td>" + aGuest.lastName + "</td>" : "<td></td>";
                html += (aGuest.childsAllowed) ? "<td>" + aGuest.childsAllowed + "</td>" : "<td></td>";
                html += (aGuest.linked) ? "<td>" + aGuest.linked + "</td>" : "<td></td>";
                if (aGuest.status) {
                    totalAnswer++;
                    if (aGuest.status == _('Aceitar com prazer'))
                        totalConfirmed++;
                    html += "<td>" + aGuest.status + "</td>";
                } else
                    html += "<td></td>";

                html += (aGuest.childsConfirmed) ? "<td>" + aGuest.childsConfirmed + "</td>" : "<td></td>";
                html += (aGuest.date) ? "<td>" + aGuest.date + "</td>" : "<td></td>";
                html += (aGuest.id) ? "<td>" + aGuest.id + "</td>" : "<td></td>";
                html += "</tr>";
            });
            $("#tableGuests tbody").append(html);
            $("[href$='#B']").text("Convidados (" + totalConfirmed + " / " + totalAnswer + ") Total :"+ aData.guests.length);
        }
    });
});
