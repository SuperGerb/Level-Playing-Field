//a dedicated worker (standard workers that are utilized by a single script). Its context is represented by a DedicatedWorkerGlobalScope object. A dedicated worker is only accessible from the script that first spawned it. (Vs shared workers)

//I can use data storage mechanisms like IndexedDB and the Firefox OS-only Data Store API

//Data is sent between workers and the main thread via a system of messages — both sides send their messages using the postMessage() method, and respond to messages via the onmessage event handler (the message is contained within the Message event's data attribute.) The data is copied rather than shared.

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

//Message received by the worker with an onmessage event handler:
onmessage = function(e){
	console.log("Message received from main script");
	//getParticularMatch(matchday); For all matchdays <= currentMatch
	//And add the results
	var workerResult = "Result: " + e.data[0] + " and " + e.data[1];

	//Start by calculating the goals for and against

	//Message sent back to the main script with the postMessage() method:
	console.log("Posting message back to main script");
	postMessage(workerResult);	
}