$(document).ready(function () {
  var season = { id: 455, year: 2017 };
  //455 = 2017-2018 season
  //436 = 2016-2017 season
  var currentMatchdayNumber;

  var salaries = {
		/* Salary info from: https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1/plus/?saison_id=2017, in pounds.
		Must be added manually */
    //2016-2017:
    2016: [
      { team: "Deportivo Alavés", salary: 39.80 },
      { team: "Athletic Club", salary: 151.60 }, // = Bilbao
      { team: "Club Atlético de Madrid", salary: 456.70 },
      { team: "FC Barcelona", salary: 787.20 },
      { team: "RC Celta de Vigo", salary: 95.50 },
      { team: "RC Deportivo La Coruna", salary: 92.80 },
      { team: "SD Eibar", salary: 52.10 },
      { team: "RCD Espanyol", salary: 84.70 },
      { team: "Sporting Gijón", salary: 50.50 },
      { team: "Granada CF", salary: 85.50 },
      { team: "CD Leganes", salary: 47.30 },
      { team: "UD Las Palmas", salary: 55.90 },
      { team: "Málaga CF", salary: 80.60 },
      { team: "CA Osasuna", salary: 36.90 },
      { team: "Real Betis", salary: 76.80 },
      { team: "Real Madrid CF", salary: 743.10 },
      { team: "Real Sociedad de Fútbol", salary: 110.50 },
      { team: "Sevilla FC", salary: 236.40 },
      { team: "Valencia CF", salary: 286.40 },
      { team: "Villarreal CF", salary: 158.70 }
    ],
    //2017-2018:
    2017: [
      { team: "Deportivo Alavés", salary: 38.05 }, //-
      { team: "Athletic Club", salary: 167.60 }, // = Bilbao
      { team: "Club Atlético de Madrid", salary: 512 }, //-
      { team: "FC Barcelona", salary: 681.50 }, //-
      { team: "RC Celta de Vigo", salary: 110.40 },
      { team: "RC Deportivo La Coruna", salary: 63.20 }, //-
      { team: "SD Eibar", salary: 64.80 }, //-
      { team: "RCD Espanyol", salary: 65.90 }, //-
      { team: "Getafe CF", salary: 32.30 }, //-
      { team: "Girona FC", salary: 25.50 }, //-
      { team: "Levante UD", salary: 27.35 }, //-
      { team: "CD Leganes", salary: 40.70 }, //-
      { team: "UD Las Palmas", salary: 95.70 }, //-
      { team: "Málaga CF", salary: 64.65 }, //-
      { team: "Real Betis", salary: 74.10 }, //-
      { team: "Real Madrid CF", salary: 714.80 }, //-
      { team: "Real Sociedad de Fútbol", salary: 155.50 }, //-
      { team: "Sevilla FC", salary: 222.50 }, //-
      { team: "Valencia CF", salary: 154.10 }, //-
      { team: "Villarreal CF", salary: 180.20 } //-
    ]
  };

  // Init:
  // Set currentMatchDayNumber,
  // Get current match day results table, and adjusted results table
  // Get league table, and adjusted league table
  function init() {
    var seasonId = season.id;
    var seasonYr = season.year;
    $.ajax({
      url: '/api/competitions/' + seasonId + '/leagueTable',
      dataType: 'json',
      type: 'GET',
    }).done(function (response) {
      //Set the global variable to the current match day:
      //I added -1 because there are often a lot of matches that haven't been played yet since we're in a different time zone. To do: make a better solution!!  
      currentMatchdayNumber = response.matchday;
      //Display current match day results:
      getParticularMatchdayResults(currentMatchdayNumber);
      console.log("Current matchday = " + currentMatchdayNumber);
      displayCurrentLeagueTable(response, seasonYr);
      //Send the current match day to the web worker so it can start calculating the adjusted league table: 
      calculateAdjustedLeagueTable();
    });
  }

  //To get the results of a particular match day: 
  function getParticularMatchdayResults(matchday) {
    var seasonId = season.id;
    $.ajax({
      url: '/api/competitions/' + seasonId + '/fixtures?matchday=' + matchday,
      dataType: 'json',
      type: 'GET',
    }).done(function (response) {
      displayMatchdayResults(response, matchday);
    });
  }

  function calculateAdjustedLeagueTable() {
    if (window.Worker) {
      //Creates a web worker to do the calculations for the league table in order to run the script in a background thread. The worker thread can perform tasks without interfering with the user interface.
      //Reference : https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
      var calculateLeagueTableWorker = new Worker("js/worker.js?2");

      //Message sent to worker with postMessage() method:
      calculateLeagueTableWorker.postMessage([currentMatchdayNumber, season, salaries]);
      console.log('Message posted to worker');

      //And received by the onmessage event handler:
      //The message is available in the message event's data attribute.
      calculateLeagueTableWorker.onmessage = function (e) {
        var salaryArrayWithAdjustedStatsAdded = e.data;
        console.log("Message received from worker", salaryArrayWithAdjustedStatsAdded);
        displayAdustedLeagueTable(salaryArrayWithAdjustedStatsAdded);
      }
    }
  }

  //To get the list of division 1 teams:
  function getListOfTeams() {
    var seasonId = season.id;
    $.ajax({
      headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
      url: '/api/competitions/' + seasonId + '/teams',
      dataType: 'json',
      type: 'GET',
    }).done(function (response) {
      $.each(response.teams, function (index, value) {
        //console.log(value.name);
      })
    });
  }

  function lookupTeamSalary(team, year) {
    var salary = 0;
    $.each(salaries, function (index, value) {
      if (index == year) {
        $.each(value, function (i, val) {
          if (value[i].team == team) {
            salary = value[i].salary;
          }
        });
      }
    });
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

  function displayCurrentLeagueTable(json, year) {
    var season = year + "-" + (year + 1);
    var stats = '<table class="results-list table table-striped table-bordered table-sm">';
    stats += '<thead>';
    stats += '<tr>';
    stats += '<th>Team</th>';
    stats += '<th>MP</th>'; //Matches played
    stats += '<th>W</th>'; //Wins
    stats += '<th>D</th>'; //Draws
    stats += '<th>L</th>'; //Losses
    stats += '<th>GF</th>'; //Goals for
    stats += '<th>GA</th>'; //Goals against
    stats += '<th>GD</th>'; //Goal difference
    stats += '<th>PTS</th>'; //Points
    stats += '</tr>';
    stats += '</thead>';
    stats += '</tbody>';

    $.each(json.standing, function (index, value) {
      var team = value.teamName;
      var matchesPlayed = value.playedGames;
      var wins = value.wins;
      var draws = value.draws;
      var losses = value.losses;
      var goalsFor = value.goals;
      var goalsAgainst = value.goalsAgainst;
      var goalDifference = value.goalDifference;
      var points = value.points;
      stats += '<tr>';
      stats += '<td>' + team + '</td>';
      stats += '<td>' + matchesPlayed + '</td>';
      stats += '<td>' + wins + '</td>';
      stats += '<td>' + draws + '</td>';
      stats += '<td>' + losses + '</td>';
      stats += '<td>' + goalsFor + '</td>';
      stats += '<td>' + goalsAgainst + '</td>';
      stats += '<td>' + goalDifference + '</td>';
      stats += '<td>' + points + '</td>';
      stats += '</tr>';
    });

    stats += '</tbody';
    stats += '</table>';
    $('.year-league').html(season);
    $('#results').html(stats);
    //fillMatchSelectField(lastMatchPlayed);
  }

  function displayAdustedLeagueTable(adjustedStats) {
    var year = season.year;
    var stats = '';
    var currentYearsAdjStats = adjustedStats[year];

    // Sort the teams in order of descreasing pts: 
    // If number of pts the same, sort by descending goal differential (gd).
    // And if goal differential is the same, sort by goals for (gf).
    //To compare numbers,the compare function can simply subtract b from a:
    /*The compareFunction can be invoked multiple times per element within the array. Depending on the compareFunction's nature, this may yield a high overhead. The more work a compareFunction does and the more elements there are to sort, the wiser it may be to consider using a map for sorting.*/
    currentYearsAdjStats.sort(function (a, b) {
      if (b.pts != a.pts) {
        return b.pts - a.pts;
      } else if (b.gd != a.gd) {
        return b.gd - a.gd;
      } else {
        return b.gf - a.gf;
      }
    });

    stats += '<table class="results-list table table-striped table-bordered table-sm">';
    stats += '<thead>';
    stats += '<tr>';
    stats += '<th>Team</th>';
    stats += '<th>MP</th>'; //Matches played
    stats += '<th>W</th>'; //Wins
    stats += '<th>D</th>'; //Draws
    stats += '<th>L</th>'; //Losses
    stats += '<th>GF</th>'; //Goals for
    stats += '<th>GA</th>'; //Goals against
    stats += '<th>GD</th>'; //Goal difference
    stats += '<th>PTS</th>'; //Points
    stats += '</tr>';
    stats += '</thead>';
    stats += '</tbody>';

    $.each(currentYearsAdjStats, function (index, value) {
      var team = value.team;
      var matchesPlayed = currentMatchdayNumber;
      var wins = value.w;
      var draws = value.d;
      var losses = value.l;
      var goalsFor = value.gf;
      var goalsAgainst = value.ga;
      var goalDifference = value.gd;
      var points = value.pts;
      stats += '<tr>';
      stats += '<td>' + team + '</td>';
      stats += '<td>' + matchesPlayed + '</td>';
      stats += '<td>' + wins + '</td>';
      stats += '<td>' + draws + '</td>';
      stats += '<td>' + losses + '</td>';
      stats += '<td>' + goalsFor + '</td>';
      stats += '<td>' + goalsAgainst + '</td>';
      stats += '<td>' + goalDifference + '</td>';
      stats += '<td>' + points + '</td>';
      //To do: add a class if the results are different from the non-adjusted league table's results
      stats += '</tr>';
    });

    stats += '</tbody';
    stats += '</table>';
    $('#adjusted-results').html(stats);
    $('.loader-wrap').hide();
  }

  //Generates the table for the match day results as well as for the adjusted matchday results. (Displays the same table twice, since the tables are predominantly the same, and hides the extra scores columns with css):
  function displayMatchdayResults(json, matchday) {
    console.log("Displaying match results for matchday " + matchday);
    var y = new Date(json.fixtures[0].date);
    var season = y.getFullYear();
    var year = y.getFullYear();
    var stats = '<table class="results-list matchday-results-table table table-striped table-bordered table-sm">';
    stats += '<thead>';
    stats += '<tr>';
    stats += '<th>Date</th>';
    stats += '<th>Home team</th>';
    stats += '<th>Salary</th>';
    stats += '<th>Goals</th>';
    stats += '<th>Goals</th>';
    stats += '<th>Salary</th>';
    stats += '<th>Away team</th>';
    stats += '</tr>';
    stats += '</thead>';
    stats += '<tbody>';

    //For each match in the fixtures table, fill in the 
    $.each(json.fixtures, function (index, value) {
      if (value.status === "FINISHED") {
        var team1 = value.homeTeamName;
        var team2 = value.awayTeamName;
        var score1 = value.result.goalsHomeTeam;
        var score2 = value.result.goalsAwayTeam;
        var adjusted_scores = {};
        var team1_salary = lookupTeamSalary(team1, year);
        var team2_salary = lookupTeamSalary(team2, year);
        var d = new Date(value.date);
        var day = d.getDate();
        var mon = d.getMonth();
        var monthName = ["Jan", "Feb", "March", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
        var month = monthName[mon];
        var scoreIs = "";

        adjusted_scores = adjustmentSchemes['adjustScores1'](team1_salary, score1, team2_salary, score2);

        if (adjusted_scores.score1 != score1 || adjusted_scores.score2 != score2) {
          scoreIs = "different";
        }

        stats += '<tr>';
        stats += '<td>' + month + " " + day + '</td>';
        stats += '<td>' + team1 + '</td>';
        stats += '<td>' + team1_salary + '</td>';
        stats += '<td class="score">' + score1 + '</td>';
        stats += '<td class="score">' + score2 + '</td>';
        stats += '<td class="adjusted-score ' + scoreIs + '">' + adjusted_scores.score1 + '</td>';
        stats += '<td class="adjusted-score ' + scoreIs + '">' + adjusted_scores.score2 + '</td>';
        stats += '<td>' + team2_salary + '</td>';
        stats += '<td>' + team2 + '</td>';
        stats += '</tr>';
        stats += '</tbody>';
      }
    });

    stats += '</table>';
    $('.year').html(season);
    $('.match').html(matchday);
    $('#results-match').html(stats);
    $('#adjusted-match-results').html(stats);
  }

  // function fillMatchSelectField(lastMatchPlayed){
  // 	var matchSelectBox = 'Get standings for match: <select id="matchSelection">';
  // 	for(var i = 1; i <= lastMatchPlayed; i++){
  // 		matchSelectBox += '<option>' + i + '</option>';
  // 	}
  // 	matchSelectBox += '</select>';
  // 	$("#selects-zone").html(matchSelectBox);
  // }

  //This has to be before the on change event, otherwise the latter doesn't fire. Why?
  //fillMatchSelectField(38); 

  // $("#matchSelection").on("change", function(){
  // 	console.log("Changed");
  // 	var matchday = $("#matchSelection option:selected").val();
  // 	console.log(matchday);
  // 	getParticularMatchdayResults(matchday);
  // });

  //$("#adjust-results").on("click", init());

  init();

});