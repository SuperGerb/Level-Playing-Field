const express = require('express');
const path = require('path');
const cache = require('memory-cache');

const app = express();
const absPathToIndex = path.join(__dirname, '..', 'app');

//To serve a static page (index.htm):
app.use(express.static(absPathToIndex));


app.get('/', function(req, res){
    res.sendFile(path.join(absPathToIndex, 'index.html'));
});

app.listen(8080);
