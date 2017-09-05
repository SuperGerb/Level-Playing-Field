//a dedicated worker (standard workers that are utilized by a single script). Its context is represented by a DedicatedWorkerGlobalScope object. A dedicated worker is only accessible from the script that first spawned it. (Vs shared workers)

//I can use data storage mechanisms like IndexedDB and the Firefox OS-only Data Store API

//Data is sent between workers and the main thread via a system of messages — both sides send their messages using the postMessage() method, and respond to messages via the onmessage event handler (the message is contained within the Message event's data attribute.) The data is copied rather than shared.

//Message received by the worker with an onmessage event handler:
onmessage = function(e){
	console.log("Message received from main script");
	var currentMatch = e.data[0];
	//The season object: 
	var season = e.data[1];
	var seasonId = e.data[1].id;
	var seasonYear = e.data[1].year;
	//The salaries object:
	var salaries = e.data[2];
	//getParticularMatch(matchday); For all matchdays <= currentMatch
	
	//And add the results.
	//Start by calculating the goals for and against

	//Message sent back to the main script with the postMessage() method:
	var workerResult = "Result: " + e.data[0] + ", " + e.data[1].id + ", " + e.data[2] ;
	console.log("Posting message back to main script");
	postMessage(workerResult);	

	//Display current league table and adjusted league table:
	getCurrentLeagueTable(season);
}

//

//To get league table/current standing:
function getCurrentLeagueTable(season){
	var seasonId = season.id;
	var seasonYr = season.year;
	var seasonYrSpan = seasonYr + "-" + seasonYr + 1;
	$.ajax({
	  	headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
	 	url: 'http://api.football-data.org/v1/competitions/' + seasonId + '/leagueTable',
	   	dataType: 'json',
	   	type: 'GET',
	 }).done(function(response) {
	 	responseObj = response;
	   	displayCurrentLeagueTable(responseObj, seasonYr);
	 }); 
}

//To get a particular match: 
function getParticularMatch(matchday, seasonId){
	$.ajax({
	  	headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
	 	url: 'http://api.football-data.org/v1/competitions/' + seasonId + '/fixtures?matchday=' + matchday,
	   	dataType: 'json',
	   	type: 'GET',
	 }).done(function(response) {
	   	calculateMatchResults(response, matchday);
	 }); 
}

function calculateMatchResults(json, matchday){
	console.log("Called for match " + matchday);
	var y = new Date(json.fixtures[0].date);
	var season = y.getFullYear() + "-" + (y.getFullYear()+1);
	var year = y.getFullYear();
    var stats = '<table class="results-list table table-striped table-bordered table-sm">';
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

    //.each : Iterate over a jQuery object, executing a function for each matched element.
    $.each(json.fixtures, function(index,value){		
    	var team1 = value.homeTeamName;
    	var team2 = value.awayTeamName;
    	var score1 = value.result.goalsHomeTeam;
    	var score2 = value.result.goalsAwayTeam;
    	var adjusted_scores = {};
    	var team1_salary = lookupTeamSalary(team1, year);
    	var team2_salary = lookupTeamSalary(team2, year);
    	var totalAdjustmentSchemes = Object.keys(adjustmentSchemes).length;
    	//The Object.keys() method returns an array of a given object's own enumerable properties
    	var d = new Date(value.date);
    	var day = d.getDate();
    	var mon = d.getMonth();
    	var monthName = ["Jan", "Feb", "March", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    	var month = monthName[mon];
    	var scoreIs = "";

		adjusted_scores = adjustmentSchemes['adjustScores1'](team1_salary, score1, team2_salary, score2);

		if(adjusted_scores.score1 != score1 || adjusted_scores.score2 != score2){
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
    	stats += '<td>' + team1_salary + '</td>';
    	stats += '<td>' + team2 + '</td>';
    	stats += '</tr>';
    	stats += '</tbody>';
    });
    
    stats += '</table>';
    $('.year').html(season);
    $('.match').html(matchday);
    $('#results-match').html(stats);
    $('#adjusted-match-results').html(stats);
};

function displayCurrentLeagueTable(json, year){
	var year = year;
	var lastMatchPlayed = json.matchday;
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

	$.each(json.standing, function(index,value){
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
		//What adjustment scheme do we use for the league table?
		//stats += '<td class="adjusted-score">' + adjusted_scores.score1 + '</td>';
		//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
		//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
		//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
		stats += '</tr>';
	});

	stats += '</tbody';
	stats += '</table>';
	$('.year').html(year);
	$('#results').html(stats);
	$('#adjusted-results').html(stats);
	fillMatchSelectField(lastMatchPlayed);
}
