$(document).ready(function(){

	var salaries =
	[
		{
			team: "almeria",
			salary: 11.7	
		},
		{
			team: "athletic",
			salary: 49.9
		},
		{
			team: "atletico",
			salary: 105
		},
		{
			team:"celta",
			salary: 18.7
		},
		{
			team: "cordoba",
			salary: 14.2
		},
		{
			team: "deportivo",
			salary: 15.3
		},
		{
			team: "eibar",
			salary: 12.8
		},
		{
			team: "elche",
			salary: 12.5
		},
		{
			team: "espanyol",
			salary: 32.2
		},
		{
			team: "barcelona",
			salary: 347.9
		},
		{
			team: "getafe",
			salary: 18.7
		},
		{
			team: "granada",
			salary: 22.8
		},
		{
			team: "levante",
			salary: 17
		},
		{
			team: "malaga",
			salary: 27.5
		},
		{
			team: "rayo",
			salary: 15.8
		},
		{
			team: "madrid",
			salary: 328
		},
		{
			team: "realsociedad",
			salary: 38.9
		},
		{
			team: "sevilla",
			salary: 78.6
		},
		{
			team: "valencia",
			salary: 73
		},
		{
			team: "villareal",
			salary: 44.2
		}
	];
	
	function init(){
	$.getJSON('https://footballdb.herokuapp.com/api/v1/event/es.2014_15/round/1?callback=?', displayResults);
	
	}

	function lookupTeamSalary(team){
	
		var salary = 0;
			
		$.each(salaries, function(index,value){
	
			if(salaries[index].team === team){
			
				salary = salaries[index].salary;
	
			}

		});
		
		return salary;
	
	};
	
	function getSalaryRatio(team1_salary, team2_salary){
		
		var salary_ratio = team1_salary/team2_salary;
		
		return salary_ratio;
	};

	var adjustmentSchemes = {
		//paul
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

		},
		adjustScores2: function(team1_salary, score1, team2_salary, score2){
	
			var adjusted_scores = {
				score1: score1,
				score2: score2
			};
		
			var salary_ratio = getSalaryRatio(team1_salary, team2_salary);
		
			if (salary_ratio > 1){ 
				//Team1 is the richer team.
				adjusted_scores.score1 = Math.round(score1/salary_ratio);
			
			}else if (salary_ratio < 1){
				//Team2 is the richer team.
				adjusted_scores.score2 = Math.round(score2*salary_ratio);
		
			}
		
			return adjusted_scores;
	
		}
	
	};
	
	function displayResults (json){
	    
	    var stats = '<table class="results-list">'
	    
	    stats += '<tr>';
	    
	    stats += '<td>Date</td>';
	    
	    stats += '<td>Home team</td>';
	    
	    stats += '<td>Goals</td>';
	    
	    stats += '<td>Goals</td>';
	    
	    stats += '<td>Away team</td>';
	    
	    stats += '</tr>';
	    
	    $.each(json.games, function(index,value){		
	    
	    	var team1 = value.team1_key;
	    	var team2 = value.team2_key;
	    	var score1 = value.score1;
	    	var score2 = value.score2;
	    	var adjusted_scores = {};
	    	var team1_salary = lookupTeamSalary(value.team1_key);
	    	var team2_salary = lookupTeamSalary(value.team2_key);
	    	var totalAdjustmentSchemes = Object.keys(adjustmentSchemes).length;
	    	
	    	//The Object.keys() method returns an array of a given object's own enumerable properties
			
			for(i=1; i <= totalAdjustmentSchemes; i++){
				if ($('#scheme' + i).is(':checked')){
					adjusted_scores = adjustmentSchemes['adjustScores' + i](team1_salary, score1, team2_salary, score2);
				}
			}
	    	
	    	stats += '<tr>';
	    	
	    	stats += '<td>' + value.play_at + '</td>';
	    	
	    	stats += '<td>' + value.team1_title + '</td>';
	    	
	    	stats += '<td class="score">' + score1 + '</td>';
	    	
	    	stats += '<td class="score">' + score2 + '</td>';
	    	
	    	stats += '<td class="adjusted-score">' + adjusted_scores.score1 + '</td>';
	    	
	    	stats += '<td class="adjusted-score">' + adjusted_scores.score2 + '</td>';
	    	
	    	stats += '<td>' + value.team2_title + '</td>';
	    	
	    	stats += '</tr>';
	    
	    });
	    
	    stats += '</table>';
	    
	    $('#results').html(stats);
	    
	    $('#adjusted-results').html(stats);
	    
	};
	
	init();
			
	$("#adjust-results").on("click", init);
	
});