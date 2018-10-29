var md = window.markdownit();
var update_mini_scoreboard = function(){
    $.getJSON( "/dashboard/mini_scoreboard_data", function(data) {
        var entries = "";
        var teamstat = data['teamstat'];
        for( var t in teamstat ) {
            team = teamstat[t];
            entries += "<tr class='entry'>";
            entries += "<td>" + escape_html(team["name"]) + "</td>";
            entries += "<td>" + escape_html(team["score"]) + "</td>";
            entries += "</tr>";
        }
        $("#mini-scoreboard tbody").html(entries);
        $("#last-update").text("Last Update: " + data['last_update']);
    });
};
update_mini_scoreboard();

var update_dashboard_problems = function(){
    $.get("/dashboard/problem", function(data){
        $('#dashboard-problems').html(data);
        $('[data-toggle="tooltip"]').tooltip();
    });
};
update_dashboard_problems();


$("#flag_submit_button").on("click", function () {
    $(this).prop('disabled', true);
    $('#submit-status').text('');
    $('#submit-status').hide();

    setTimeout(function(){
        $("#flag_submit_button").prop('disabled', false);
    }, 1000);

    $.post ("/dashboard/submit_flag", {
        "flag": $("#flag_input").val().trim(),
        "id": $(this).data("href"),
    },
    function (data, textStatus, jqXHR) {
        if (data == 'error') {
            $('#submit-status').text('Slow down! submit your flag later.');
            $('#submit-status').show();
        } else if (data == 'duplicated') {
            $('#submit-status').text('You already submit this flag!');
            $('#submit-status').show();
            $('#flag').val('')
        } else if (data == 'wrong') {
            $('#submit-status').text('Wrong flag. Noooooo~');
            $('#submit-status').show();
        } else {
            var problem_obj = $("#flag-id-" + data);
            problem_obj.fadeOut(400, function(){
                problem_obj.addClass('solved');
                problem_obj.fadeIn(400);
            });
            $('#submit-form').hide('100');
            $('#submit-status').text('Correct flag. Grats!');
            $('#submit-status').show();
            update_announcements();
        }
    }).fail(function(){
        $('#submit-status').text('Submission error. Please try again later.');
        $('#submit-status').show();
    });
});

$("#flag_input").on("keyup", function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if ( code == 13 ) {
        $("#flag_submit_button").click();
    }
});

// handling function for successfully fetching announcements
function fetch_announcements_success(data)
{
    elem_ul = $("#dashboard-announcements > ul");
    curr_count = elem_ul.children().length;
    is_first_query = (curr_count == 0);

    for (index = data.length - curr_count - 1; index >= 0; index--) {
        announcement = data[index];

        elem_description = $("<div></div>")
            .text(announcement["description"])
            .css("display", "none");

        if ( announcement["description"].length )
            elem_title = $("<a></a>");
        else
            elem_title = $("<p></p>");
        
        elem_title.text(announcement["time"] + ": " + announcement["title"])
            .attr("href", "javascript:void(0)")
            .click(function() {
                $(this).parent().children("div").slideToggle('fast');
            });

        elem_entry = $("<li></li>")
            .append(elem_title)
            .append(elem_description);

        if (is_first_query) {
            elem_entry.prependTo(elem_ul);
        } else {
            elem_entry.prependTo(elem_ul).slideDown().fadeOut().fadeIn().fadeOut().fadeIn();
        }
    }
}

// handling function for failing to fetch announcements
function fetch_announcements_fail(jqXHR)
{
    console.error('failed to fetch announcements');
}

// periodly update announcements
function update_announcements()
{
    $.ajax({url: window.location.origin + "/dashboard/announcement_data",
        dataType: "json",
        success: fetch_announcements_success,
        error: fetch_announcements_fail});
}

update_announcements();

// problem info popup
$(document).on('click', '.problem-entry.unlocked', function(){
    var info_obj = $(this).children('.problem-info');
    var info = {
        'title': info_obj.children('.title').children('p').children('.tititle').text(),
        'description': md.render(info_obj.children('.description').text().trim()),
        'hint':info_obj.children('.hint').html().trim(),
        'solved_times': info_obj.children('.solved_times').html(),
        'author': info_obj.children('.author').text(),
    };
    var modal = $('#challenge-modal');
    modal.find('.modal-title').text(info.title);
    modal.find('#challenge-description').html(info.description);
    if ( info.author )
        modal.find('#challenge-author').text("Author: " + info.author);
    else
        modal.find('#challenge-author').text("");

    if ( info.hint ) {
        modal.find('#challenge-hint').html(info.hint);
        $('#challenge-hint').find(".hint-content").each(function(index,item){
            $(item).html(md.render($(item).text()))
        })
        modal.find('.modal-hint').show();
    }
    else {
        modal.find('#challenge-hint').html("");
        modal.find('.modal-hint').hide();
    }
    modal.find('#challenge-solved_times').html(info.solved_times);
    modal.find('#flag_input').val('');
    if ( info.title == "Lumosity" ) {
        modal.find('#flag_input').attr("placeholder", "hitcon{Th1s_f13ld-1s^r3qu1r3d}");
    } else {
        modal.find('#flag_input').attr("placeholder", "hitcon{......}");
    }
    modal.find('#submit-status').text('');
    modal.find('#submit-status').hide();
    // save challenge id to button's data-href
    var chall_id = this.id.split("-").pop();
    $('#flag_submit_button').data('href', chall_id);

    window.location.hash = "#" + chall_id;

    var solved_flag = $(this).find('.solved').length;
    var total_flag = $(this).find('.flag-list li').length;
    if ( solved_flag == total_flag ) {
        modal.find('#solved-message').html("You have already solved this challenge.");
        modal.find('#solved-message').show();
        modal.find('#submit-form').hide();
    }
    else {
        modal.find('#solved-message').hide();
        modal.find('#submit-form').show();
    }
    // we need set hint button related handler
    $('[data-toggle=confirmation]').confirmation({
        rootSelector: '[data-toggle=confirmation]',
        title: "Are you sure?",
        content: "Open hint will reduce 25% points of this challenge",
        btnOkLabel: "Yes, I'm definitely sure!",
        btnOkIcon: "glyphicon glyphicon-ok",
        btnOkClass:"btn-success",
        btnCancelLabel:"No, I'll do it by myself!",
        btnCancelIcon:"glyphicon glyphicon-remove",
        btnCancelClass:"btn-danger",
        onConfirm:function(){
            var hint_id = this[0].id.split("-").pop();
            $.post ("/dashboard/open_hint", {"hint_id": hint_id,},
                    function (data, textStatus, jqXHR) {
                        if (data.state == 'success') {
                            $('#submit-status').text('Hint opened.');
                            $('#submit-status').show();
                            msg = md.render(data.msg)
                            modal.find('#challenge-hint').find('#hint-'+hint_id).hide().html("<b>Hint:</b><br>" + msg).fadeIn(1500);
                            update_dashboard_problems();
                        }
                        else {
                            $('#submit-status').text(data.msg);
                            $('#submit-status').show();
                        }
                    }).fail(function(){
                        $('#submit-status').text('Open Hint failed. Please try again later.');
                        $('#submit-status').show();
                    });
        }
    });

    modal.modal('show');
});

