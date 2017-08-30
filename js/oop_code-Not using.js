		//save all the adjustment schemes as an "associative array" aka, in JavaScript, an object
	};
	//We can create objects easily using classes (object constructors), so we can create lots of instances (objects, which have been constructed via a class), which contain mostly the same data, except some little nuances. If I had a lot of adjustment schemes, would I create them using a class?
	//The foreach loop is used to iterate over each element of an object

	//I think what I should do is create a constructor function with an adjusted_scores property and a salary_ratio property. These are the same for all adjustment schemes. Then I'll give each adjustment scheme a unique method
	//Question: if I use a constructor function to create the different adjustment schemes, will I need to rework the entire rest of the code, or can an isolated constructor be incorporated in otherwise non-OOP code?
	//First I'm going to write them as an array of objects. --No, actually what Dan is suggesting is just making one object containing the two adjustment schemes as methods of that object. After that, I'll try creating them using a constructor function.
	//I should probably be rendering out the options with javascript, instead of hardcoding them in the html. Makes the app more extendible, and then maybe I would bind the html with the function at the time of displaying it. Attach the click handler inside the same loop, à la Treehouse OOP quiz app

	var adjustmentSchemes = [
		{ 
			thePaul : function(){
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
		}, //...not like this. Like this:

	
//Here they are as an object, with no constructor function:

var adjustmentSchemes = {

	adjustScores_paul: function(team1_salary, score1, team2_salary, score2){
	
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
	
	adjustScores_imbrogno: function(team1_salary, score1, team2_salary, score2){
	
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
	
}

//Using a constructor function:

function AdjustmentScheme(team1_salary, score1, team2_salary, score2, adjusted_scores){
		this.team1_salary = team1_salary;
		this.score1 = score1;
		this.team2_salary = team2_salary;
		this.score2 = score2;
		this.adjusted_scores = {
			score1: score1,
			score2: score2
		};	
	};
	
	AdjustmentScheme.prototype.getSalaryRatio = function(team1_salary, team2_salary){
		var salary_ratio = getSalaryRatio(team1_salary, team2_salary);
	};
	
	var adjustmentScheme = new AdjustmentScheme(
