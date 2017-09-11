<?php 
$pageTitle="Level playing field";
include("inc/header.php"); ?>

	<p class="adj-desc">If the ratio of the two teams' salaries is greater than 3, adjustments will be made!! <span><em>*Unless the poorer team is the home team and the ratio isn't more than 6.</em></span></p>
	
	<div class="results-wrap">
		<h2><span class="year"></span> Match <span class="match"></span> Results</h2>
		<div id="results-match"></div>
	</div>
	<div class="results-wrap">
		<h2><span class="year"></span> Match <span class="match"></span> Adjusted Results</h2>
		<div id="adjusted-match-results"></div>
	</div>

	<div id="selects-zone"></div>

	<div class="results-wrap">
		<h2><span class="year-league"></span> La Liga Season Results</h2>
		<div id="results"></div>
	</div>
	<div class="results-wrap">
		<h2><span class="year-league"></span> La Liga Adjusted Results</h2>
		<div class="loader-wrap">
			<div class="loader"></div>
			<p>Calculating adjusted league table results...</p>
		</div>
		<div id="adjusted-results"></div>
	</div>

<?php include("inc/footer.php"); ?>