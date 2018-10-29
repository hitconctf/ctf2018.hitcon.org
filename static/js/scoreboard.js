var update_scoreboard = function(){
    $.getJSON( "scoreboard_data", function(data) {
        var entries = "";
        var teamstat = data.teamstat;
        var challenges = data.challenges;
        var hide_country = data.hide_country;

        var rank = 1
        for ( var t in teamstat ) {
            team = teamstat[t];
            entries += "<tr class='entry'>";
            entries += "<td>" + rank + "</td>";
            entries += "<td style='word-wrap:break-word;'><a class='team-url' href='/team/" + team.id + "'>"
                + escape_html(team.name) + "</a></td>";
            if ( !hide_country ) {
                if ( team.country )
                    entries += "<td><img src='" + static_url + "flags/" + team.country + ".gif'></img></td>";
                else
                    entries += "<td>-</td>";
            }
            entries += "<td>" + team.score + "</td>";
            rank += 1;

            // solved challenge
            for ( var c in challenges ) {
                chal = challenges[c];
                var solved_chal = 0;
                var solved = false;
                var firstblood = false;
                for ( s in team.solved_challenge ) {
                    solved_chal = team.solved_challenge[s];
                    if ( solved_chal == chal.id ) {
                        solved = true;
                        if ( chal.first_solved_team == team.id )
                            firstblood = true;
                        break;
                    }
                }
				if ( firstblood ) {
					entries += "<td class='firstblood show-on-hover'>";
					entries += "<div class='label label-danger'>FirstBlood - " + escape_html(chal.name) + "</div>";
				} else if ( solved ) {
					entries += "<td class='solved show-on-hover'>";
					entries += "<div class='label label-success'>" + escape_html(chal.name) + "</div>";
                } else {
                    entries += "<td></td>";
                }
            }
            entries += "</tr>";
        }

        thead_tr =  '<th style="width:50px;">Rank</th>'
        thead_tr += '<th style="width:160px;">Team Name</th>'
        if ( !hide_country )
            thead_tr += '<th style="width:65px;">Country</th>'
        thead_tr += '<th style="width:65px;">Score</th>';

        for ( var c in challenges ) {
            chal = challenges[c];
            thead_tr += '<th class="flag show-on-hover"><span class="glyphicon glyphicon-flag"></span><div>' + escape_html(chal.name) +
                " (" + chal.score + ")" + "<p>" + chal.solved_times + " solves</p></div></th>";
        }

        $("#scoreboard thead tr").html(thead_tr);
        $("#scoreboard tbody").html(entries);
        $("#last-update").text("Last Update: " + data.last_update);
    });
};
update_scoreboard();
setInterval(update_scoreboard, refresh_interval);;
