$(document).ready(function(){
	var season = {id: 436, year: 2016}; //436 = 2016-2017 season
	var responseObj;
	var currentMatchNumberSet = false;
	var currentMatchNumber = 0;

	var salaries = {
		/* Salary info from: https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1/plus/?saison_id=2017, in pounds.
		Must be added manually */
		//2016-2017:
		2016: [
			{team: "Deportivo Alavés", salary: 39.80},
			{team: "Athletic Club", salary: 151.60}, // = Bilbao
			{team: "Club Atlético de Madrid", salary: 456.70},
			{team: "FC Barcelona", salary: 787.20},
			{team: "RC Celta de Vigo", salary: 95.50},
			{team: "RC Deportivo La Coruna", salary: 92.80},
			{team: "SD Eibar", salary: 52.10},
			{team: "RCD Espanyol", salary: 84.70},
			{team: "Sporting Gijón", salary: 50.50},
			{team: "Granada CF", salary: 85.50},
			{team: "CD Leganes", salary: 47.30},
			{team: "UD Las Palmas", salary: 55.90},
			{team: "Málaga CF", salary: 80.60},
			{team: "CA Osasuna", salary: 36.90}, 
			{team: "Real Betis", salary: 76.80},
			{team: "Real Madrid CF", salary: 743.10},
			{team: "Real Sociedad de Fútbol", salary: 110.50},
			{team: "Sevilla FC", salary: 236.40},
			{team: "Valencia CF", salary: 286.40},
			{team: "Villarreal CF", salary: 158.70}
		],
		//2017-2018:
		2017: [
			{team: "Deportivo Alavés", salary: 38.05},
			{team: "Athletic Club", salary: 167.60}, // = Bilbao
			{team: "Club Atlético de Madrid", salary: 512},
			{team: "FC Barcelona", salary: 681.50},
			{team: "RC Celta de Vigo", salary: 110.40},
			{team: "RC Deportivo La Coruna", salary: 63.20},
			{team: "SD Eibar", salary: 64.80},
			{team: "RCD Espanyol", salary: 65.90},
			//Getafe {team: "getafe", salary: 32.30},
			//Girona {team: "girona", salary: 25.50},
			{team: "Sporting Gijón", salary: 1.44},//Asturias Sporting Gijón or simply Sporting, 2 division
			{team: "Granada CF", salary: 1.08},
			//Levante {team: "levante", salary: 27.35},
			{team: "CD Leganes", salary: 40.70},
			{team: "UD Las Palmas", salary: 95.70},
			{team: "Málaga CF", salary: 64.65},
			{team: "CA Osasuna", salary: 0.916}, //Pamplona, 2 division
			{team: "Real Betis", salary: 74.10},
			{team: "Real Madrid CF", salary: 714.80},
			{team: "Real Sociedad de Fútbol", salary: 155.50},
			{team: "Sevilla FC", salary: 222.50},
			{team: "Valencia CF", salary: 154.10},
			{team: "Villarreal CF", salary: 180.20}
		]
	};

	function lookupTeamSalary(team, year){
		var salary = 0;
		$.each(salaries, function(index,value){
			if(index == year){
				$.each(value, function(i, val){
					if(value[i].team == team){
						salary = value[i].salary;

					}
				});
			}
		});
		return salary;
	};

	function init(){
		/* Question about asynchronous programming :
		How to get getParticularMatch(currentMatchNumber) has to happen once getCurrentMatchNumber() is completed? 
		Either return currentMatchNumer in getCurrentMatchNumer and write
		getParticularMatch(getCurrentMatchNumber());
		Or call getParticularMatch() inside getCurrentMatchNumber(), which is what I ended up doing. I just want to call getCurrentMatchNumber once on init, and save the result to a global variable that I can use various times... Does it confuse things to be calling getParticularMatch inside of getCurrentMatchNumber (as a callback function)? I think it's correct.
		*/
		//getParticularMatch(getCurrentMatchNumber()); //This way doesn't work. Because Ajax already has its own callback?
		//getParticularMatch(currentMatchNumber);
		getCurrentMatchNumber(); //#1 in the call stack
		getCurrentLeagueTable();
	}

	//Get current match number (ie. what was the last match played):
	function getCurrentMatchNumber(){
		var seasonId = season.id;
		var seasonYr = season.year;
		var seasonYrSpan = seasonYr + "-" + seasonYr + 1;
		$.ajax({
		  	headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
		 	url: 'http://api.football-data.org/v1/competitions/' + seasonId + '/leagueTable',
		   	dataType: 'json',
		   	type: 'GET',
		 }).done(function(response) {
		 	//Set the global variable to the current match day:
		 	currentMatchNumber = response.matchday;
		 	console.log("Current match number = " + currentMatchNumber);
		 	//Send the current match day to the web worker so it can calculate the adjusted league table: (Might as well call it as soon as possible because it's going to be working in the background and will just notify me when it's finished):
		 	calculateAdjustedLeagueTable();
		 	//#2 in the call stack:
		 	//And display current match results:
		 	getParticularMatch(currentMatchNumber); //I couldn't call this elsewhere... see question on asynchronous programming
		 }); 
	}

	//To get league table/current standing:
	function getCurrentLeagueTable(){
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
	function getParticularMatch(matchday){
		var seasonId = season.id;
		$.ajax({
		  	headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
		 	url: 'http://api.football-data.org/v1/competitions/' + seasonId + '/fixtures?matchday=' + matchday,
		   	dataType: 'json',
		   	type: 'GET',
		 }).done(function(response) {
		   	displayMatchResults(response, matchday);
		 }); 
	}

	function calculateAdjustedLeagueTable(){
		if(window.Worker){
			//Create a web worker to do the calculations for the league table in order to run the script in a background thread. The worker thread can perform tasks without interfering with the user interface:
			//Reference : https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
			var calculateLeagueTableWorker = new Worker("js/worker.js");

			//Message sent to worker with postMessage() method:
			calculateLeagueTableWorker.postMessage([currentMatchNumber, season, salaries]);
			console.log('Message posted to worker');

			//And received by the onmessage event handler:
			//The message is available in the message event's data attribute.
			calculateLeagueTableWorker.onmessage = function(e){
				console.log("Message " + e.data + " received from worker");
			}
		}
	}

	function fillMatchSelectField(lastMatchPlayed){
		var matchSelectBox = 'Get standings for match: <select id="matchSelection">';
		for(var i = 1; i <= lastMatchPlayed; i++){
			matchSelectBox += '<option>' + i + '</option>';
		}
		matchSelectBox += '</select>';
		$("#selects-zone").html(matchSelectBox);
	}

	//This has to be before the on change event, otherwise the latter doesn't fire. Why?
	//fillMatchSelectField(38); 
	
	$("#matchSelection").on("change", function(){
		console.log("Changed");
		var matchday = $("#matchSelection option:selected").val();
		console.log(matchday);
		getParticularMatch(matchday);
	});

	//To get the list of 1 division teams:
	function getListOfTeams(){
		$.ajax({
		 	headers: { 'X-Auth-Token': '7ff8904b117547748572064ac1e28265' },
			url: 'http://api.football-data.org/v1/competitions/455/teams',
		  	dataType: 'json',
		  	type: 'GET',
		}).done(function(response) {
			$.each(response.teams, function(index, value){
				console.log(value.name);
			})
		}); 
	}
	
	function getSalaryRatio(team1_salary, team2_salary){
		var salary_ratio = team1_salary/team2_salary;
		return salary_ratio;
	};

	var adjustmentSchemes = {
		//Paul's adjustment scheme:
		adjustScores1: function(team1_salary, score1, team2_salary, score2){
			var adjusted_scores = {
				score1: score1,
				score2: score2
			};	
			var salary_ratio = getSalaryRatio(team1_salary, team2_salary);

			if (salary_ratio <= 1/6){
				//The salary ratio is 6, and the poorer team is the home team. 
				adjusted_scores.score1 ++;  
			}else if (salary_ratio >= 6){
				//The salary ratio is 6, and the poorer team is the away team.
				adjusted_scores.score2 = score2 + 2;
			}else if (salary_ratio > 3 && salary_ratio < 6){
				//The salary ratio is 3, and the poorer team is the away team.
				adjusted_scores.score2 ++;
			}
			return adjusted_scores;
		}
	};
	
	function displayCurrentLeagueTable(json, year){
		var year = year;
		var season = year + "-" + (year+1);
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
			//Use the web worker to calculate and display the adjusted league table instead of doing it here:
			//stats += '<td class="adjusted-score">' + adjusted_scores.score1 + '</td>';
			//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
			//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
			//stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
			stats += '</tr>';
		});

		stats += '</tbody';
		stats += '</table>';
		$('.year-league').html(season);
		$('#results').html(stats);
		//$('#adjusted-results').html(stats);
		fillMatchSelectField(lastMatchPlayed);
	}

	function displayMatchResults(json, matchday){
		console.log("Called for match " + matchday);
		var y = new Date(json.fixtures[0].date);
		var season = y.getFullYear();
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
	
	init();
			
	//$("#adjust-results").on("click", init());
	
});