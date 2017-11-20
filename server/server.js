const config = require('dotenv').config();
const express = require('express');
const path = require('path');
const memoryCache = require('memory-cache');
const request = require('request-promise');

const app = express();
const absPathToIndex = path.join(__dirname, '..', 'app');
const minutes = 60000;
const days = 86400000;
const cacheTimeout = 60 * minutes;
//I wanted to specify a much longer timeframe for past match day data, however it seemed to be rejected by the cache:
//const longCacheTimeout = 30 * days;
//To do: what is the maximum I can put this to?:
const longCacheTimeout = 60 * minutes;



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
    //Just for testing:
    //memoryCache.clear();

    //Url (inherited from Node's http module) is used as key, in order to support request with varying parameters. It includes all parameters and query strings:
    var cachedResponse = memoryCache.get(req.url);

    //Check whether the requested information exists in cache. If so, send it to the browser and exit (return):
    if (cachedResponse !== null) {
        console.info(`Returning cached content for ${req.url}`);
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

    console.info(`Retrieving content remotely at ${url}`);

    request(options)
        .then((response) => {
            //This works, but will be more meaningful when there cacheTimeout and longCacheTimeout have different values:
            if (subService === "leagueTable") {
                currentMatchday = JSON.parse(response.body).matchday - 1;
                console.log("subService is: " + subService + " and currentMatchday is : " + currentMatchday);
                console.log("and req.url is ", req.url);
            } else if ((subService === "fixtures" && req.query.matchday == currentMatchday) || (subService === "fixtures" && req.query.matchday === undefined)) {
                console.log(req.query.matchday + " matches " + currentMatchday + " so short cacheTimeout being used");
                memoryCache.put(req.url, response.body, cacheTimeout);
                console.log("and req.url is ", req.url);
            } else {
                console.log(req.query.matchday + " doesn't match current match day: " + currentMatchday + " so LONG cacheTimeout being used");
                memoryCache.put(req.url, response.body, longCacheTimeout);
                console.log("and req.url is ", req.url);
            }
            console.log('>>> response being served from the API');
           // memoryCache.put(req.url, response.body, cacheTimeout);
            res.send(response.body);
        })
        .catch((error) => {
            console.error(error);
            res.status(error.response.statusCode).send(error.response.body);
        });
});


app.listen(8080);
