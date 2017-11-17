const express = require('express');
const path = require('path');
const memoryCache = require('memory-cache');
const request = require('request-promise');

const app = express();
const absPathToIndex = path.join(__dirname, '..', 'app');
const minutes = 60000;
const cacheTimeout = 60 * minutes;

//To serve a static page (index.html):
app.use(express.static(absPathToIndex));

app.get('/', function(req, res){
    res.sendFile(path.join(absPathToIndex, 'index.html'));
});

app.get('/api/competitions/:seasonId/:subService', function(req, res) {
    const {seasonId, subService} = req.params;
    console.log('>>> seasonId: ', seasonId);

    //Just for testing. Remove:
    memoryCache.clear();

    //Url is used as key, in order to support request with varying parameters:
    var cachedResponse = memoryCache.get(req.url);

    //Check whether the requested information exists in cache. If so, send it to the browser and exit (return):
    if (cachedResponse !== null) {
        console.info(`Returning cached content for ${req.url}`);
        res.send(cachedResponse);
        return;
    }
    
    const url = `http://api.football-data.org/v1/competitions/${seasonId}/${subService}`;
    
    //If not, request the information from the API server and save it to cache. (Syntax is a request with promises (uses request-promise module):
    var options = {
        method: 'GET',
        uri: url,
        qs: req.query,
        resolveWithFullResponse: true,
        headers: {
            'X-Auth-Token': '7ff8904b117547748572064ac1e28265'
        }
    }; 
    console.info(`Retrieving content remotely at ${url}`);

    request(options)
        .then((response) => {
            console.log('>>> response: ', response.body);
            memoryCache.put(req.url, response.body, cacheTimeout);
            res.send(response.body);
        })
        .catch((error) => {
            console.error(error);
            res.status(error.response.statusCode).send(error.response.body);
        });
});


app.listen(8080);
