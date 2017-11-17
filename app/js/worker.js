//a dedicated worker (standard workers that are utilized by a single script). Its context is represented by a DedicatedWorkerGlobalScope object. A dedicated worker is only accessible from the script that first spawned it. (Vs shared workers)

//I can use data storage mechanisms like IndexedDB and the Firefox OS-only Data Store API

//Data is sent between workers and the main thread via a system of messages — both sides send their messages using the postMessage() method, and respond to messages via the onmessage event handler (the message is contained within the Message event's data attribute.) The data is copied rather than shared.

var salaries = {};

//Message received by the worker with an onmessage event handler:
onmessage = function (e) {
    console.log("Message received from main script");
    var currentMatch = e.data[0];
    //The season object: 
    var season = e.data[1];
    var seasonId = e.data[1].id;
    var seasonYear = e.data[1].year;
    //The salaries object:
    salaries = e.data[2];

    //Adjust and sum team stats for all matchdays less than or equal to currentMatch:
    for (var i = 1; i <= currentMatch; i++) {
        getParticularMatchdayResults(i, seasonId);
    }

    //For testing. Make a unit test with this: 
    //getParticularMatchdayResults(1, seasonId);
}

function lookupTeamSalary(team, year) {
    var salary = 0;
    for (index in salaries) {
        var value = salaries[index];
        if (index == year) {
            for (i in value) {
                if (value[i].team == team) {
                    salary = value[i].salary;
                }
            };
        }
    };
    return salary;
}

function getSalaryRatio(team1_salary, team2_salary) {
    var salary_ratio = team1_salary / team2_salary;
    return salary_ratio;
}

var adjustmentSchemes = {
    //Paul's adjustment scheme:
    adjustScores1: function (team1_salary, score1, team2_salary, score2) {
        var adjusted_scores = {
            score1: score1,
            score2: score2
        };
        var salary_ratio = getSalaryRatio(team1_salary, team2_salary);

        if (salary_ratio <= 1 / 6) {
            //The salary ratio is 6, and the poorer team is the home team. 
            adjusted_scores.score1++;
        } else if (salary_ratio >= 6) {
            //The salary ratio is 6, and the poorer team is the away team.
            adjusted_scores.score2 = score2 + 2;
        } else if (salary_ratio > 3 && salary_ratio < 6) {
            //The salary ratio is 3, and the poorer team is the away team.
            adjusted_scores.score2++;
        }
        return adjusted_scores;
    }
}

//To get a particular match (in Javascript, because jQuery not accepted in web workers, since the DOM can't be directly manipulated from inside a worker): 
function getParticularMatchdayResults(matchday, seasonId) {
    var req = new XMLHttpRequest();
    req.open('GET', '/api/competitions/' + seasonId + '/fixtures?matchday=' + matchday);
    req.send();

    req.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            calculateMatchdayResults(response, matchday);
        }
    }
}

function calculateMatchdayResults(json, matchday) {
    console.log("Called in worker for matchday " + matchday);
    var y = new Date(json.fixtures[0].date);
    var year = y.getFullYear();
    var fixtures = json.fixtures;

    for (var index in fixtures) {
        var value = fixtures[index];
        var team1 = value.homeTeamName;
        var team2 = value.awayTeamName;
        var score1 = value.result.goalsHomeTeam;
        var score2 = value.result.goalsAwayTeam;
        //A blank object in which to store the adjusted scores, once calculated:
        var adjusted_scores = {};
        var team1_salary = lookupTeamSalary(team1, year);
        var team2_salary = lookupTeamSalary(team2, year);
        //Calculate the adjusted scores and save them to the adjusted_scores object:
        adjusted_scores = adjustmentSchemes['adjustScores1'](team1_salary, score1, team2_salary, score2);
        //Retrieve the adjusted scores:
        var adjusted_score1 = adjusted_scores.score1;;
        var adjusted_score2 = adjusted_scores.score2;
        //Calculate the goal differential: 
        var team1_goal_diff = adjusted_score1 - adjusted_score2;
        var team2_goal_diff = adjusted_score2 - adjusted_score1;
        //Calculate the other stats: 
        var team1_win = 0;
        var team1_draw = 0;
        var team1_loss = 0;
        var team1_pts = 0;
        var team2_win = 0;
        var team2_draw = 0;
        var team2_loss = 0;
        var team2_pts = 0;

        if (adjusted_score1 > adjusted_score2) {
            team1_win = 1;
            team2_loss = 1;
            team1_pts = 3;
        }
        if (adjusted_score1 < adjusted_score2) {
            team2_win = 1;
            team1_loss = 1;
            team2_pts = 3;
        }
        if (adjusted_score1 == adjusted_score2) {
            team1_draw = 1;
            team2_draw = 1;
            team1_pts = 1;
            team2_pts = 1;
        }
		/* Goal differential equation:
		The number of goals scored in all league matches minus the number of goals conceded.
		*/
		/* Pts equation:
		A win gives a team 3 points, a draw gives 1 point, a loss gives 0 points */

        //Store the stats for the team in the salaries array:
        addTeamStatsToSalariesArray(year, team1, matchday, team1_win, team1_draw, team1_loss, adjusted_score1, adjusted_score2, team1_goal_diff, team1_pts);

        addTeamStatsToSalariesArray(year, team2, matchday, team2_win, team2_draw, team2_loss, adjusted_score2, adjusted_score1, team2_goal_diff, team2_pts);
    };

    //Message sent back to the main script with the postMessage() method:
    //Send the updated salaries array. And the main js file will display the adjusted league table.
    var workerResult = salaries;
    //For testing:
    // var currentYearArray = salaries["2017"];
    // for(var index in currentYearArray){
    // 	var value = currentYearArray[index];
    // 	if(value.team == "FC Barcelona"){
    //console.log("Barcelona found. Its stats: ");
    //console.log("salary= " + value.salary);
    //console.log("w= " + value.w);
    //console.log("d= " + value.d);
    //console.log("l= " + value.l);
    //console.log("gf= " + value.gf);
    //console.log("ga= " + value.ga);
    //console.log("gd= " + value.gd);
    //console.log("pts= " + value.pts);
    // }
    //}	
    // Another example: var workerResult = "Result: " + e.data[0] + ", " + e.data[1].id + ", " + e.data[2] ;
    console.log("Posting message from worker back to main script");
    //The worker sends the updated salaries array to the main js file:
    postMessage(workerResult);
}

function addTeamStatsToSalariesArray(year, team, matchday, win, draw, loss, goals_for, goals_against, goal_diff, pts) {
    for (var index in salaries) {
        var value = salaries[index];
        if (index == year) {
            for (var i in value) {
                var val = value[i];
                if (val.team == team) {
                    //console.log("Team = " + val.team);
                    //If the keys for the new stats don't exist yet (mp, w, d, l, gf, etc), create them and set their values to 0:
                    if (!("mp" in val)) {
                        //console.log("Keys for new stats don't exist yet so adding them.");
                        val.mp = 0;
                        val.w = 0;
                        val.d = 0;
                        val.l = 0;
                        val.gf = 0;
                        val.ga = 0;
                        val.gd = 0;
                        val.pts = 0;
                    }
                    //console.log("Stats now being updated for " + val.team + ".");
                    val.mp = matchday;
                    val.w += win;
                    val.d += draw;
                    val.l += loss;
                    val.gf += goals_for;
                    val.ga += goals_against;
                    val.gd += goal_diff;
                    val.pts += pts;
                }
            };
        }
    };
}
