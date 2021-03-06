require('dotenv').config();
const express = require('express');
const path = require('path');
const memoryCache = require('memory-cache');
const request = require('request-promise');
const PORT = process.env.PORT || 8080;

const app = express();
const absPathToIndex = path.join(__dirname, '..', 'app');
const minutes = 60000;
const days = 86400000;
const cacheTimeout = 60 * minutes;
const longCacheTimeout = 2 * 24 * 60 * minutes;
//Theoretically no limit to the amount of time something can be stored in memory cache, however it was not caching anything when I set longCacheTimeout to 30 days
//const longCacheTimeout = 30 * days;

var currentMatchday;

//To serve a static page (index.html):
app.use(express.static(absPathToIndex));

app.get('/', function (req, res) {
  res.sendFile(path.join(absPathToIndex, 'index.html'));
});

app.get('/api/competitions/:seasonId/:subService', function (req, res) {
  const { seasonId, subService } = req.params;

  //Just for testing:
  //console.log("Number of items in memory cache: ", memoryCache.size());
  //Just for testing: Empty cache:
  //memoryCache.clear();

  //Url (inherited from Node's http module) is used as key, in order to support request with varying parameters. It includes all parameters and query strings:
  var cachedResponse = memoryCache.get(req.url);

  //Check whether the requested information exists in cache. If so, send it to the browser and exit (return):
  if (cachedResponse !== null) {
    console.info(`>>>Returning cached content for ${req.url}`);
    res.send(cachedResponse);
    return;
  }

  const url = `http://api.football-data.org/v1/competitions/${seasonId}/${subService}`;

  //If not, request the information from the API server and save it to cache. (Syntax is a request with promises (uses request-promise module)):
  var options = {
    method: 'GET',
    uri: url,
    qs: req.query,
    resolveWithFullResponse: true,
    headers: {
      'X-Auth-Token': process.env.MY_KEY
    }
  };
  //Recall req.query is an object containing a property for each query string parameter in the route 

  //console.info(`Retrieving content remotely at ${url}`);

  request(options)
    .then((response) => {
      //This works, but will be more meaningful when cacheTimeout and longCacheTimeout have different values:
      if (subService === "leagueTable") {
        currentMatchday = JSON.parse(response.body).matchday;
        memoryCache.put(req.url, response.body, cacheTimeout);
        //console.log("subService is: " + subService + ", currentMatchday is : " + currentMatchday + " and req.url is " + req.url);
      } else if ((subService === "fixtures" && req.query.matchday == currentMatchday) || (subService === "fixtures" && req.query.matchday === undefined)) {
        console.log(req.query.matchday + " is today's match day so short cacheTimeout will be used");
        memoryCache.put(req.url, response.body, cacheTimeout);
        //console.log("and req.url is ", req.url);
      } else {
        console.log(req.query.matchday + " isn't today's matchday, so long cacheTimeout will be used");
        memoryCache.put(req.url, response.body, longCacheTimeout);
        //console.log("and req.url is ", req.url);
      }
      console.log('>>> Response being served from the API');
      res.send(response.body);
    })
    .catch((error) => {
      console.log("Entered the catch of the request. Error: ", error);
      res.status(error.response.statusCode).send(error.response.body);
    });
});


app.listen(PORT);
