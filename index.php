<?php 

$pageTitle="Level playing field";

include("inc/header.php"); ?>

	<form id="adjust-results" method="get">
		
		<fieldset>
		
			<legend>Select an adjustment scheme:</legend>
			
			<input type="radio" name="adjustment-scheme" value="Paul" id="scheme1" checked/><span class="adj-title">The Paul:</span><p class="adj-desc">If the ratio of the two teams' salaries is greater than 3, adjustments will be made!!* <span><em>*Unless the poorer team is the home team and the ratio isn't more than 6.</em></span></p>

			<br>

			<input type="radio" name="adjustment-scheme" value="Imbrogno" id="scheme2" /><span class="adj-title">The Imbrogno:</span><p class="adj-desc">No mercy for the rich!! Divide the wealthier team's salary by the salary ratio every time.</p>

			<br>
		
		</fieldset>
		
	</form>
	
	<div class="results-wrap">
	
		<h2>Regular Season Results</h2>
		
		<div id="results"></div>
		
	</div>
	
	<div class="results-wrap">
	
		<h2>Adjusted Results</h2>
		
		<div id="adjusted-results"></div>
		
	</div>

<?php include("inc/footer.php"); ?>