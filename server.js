const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
 
// create express application instance
const app = express()
 
// create and connect redis client to local instance.
const client = redis.createClient(6379)
 
// echo redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get result list
app.get('/search/:query', (req, res) => {
    searchtxt= req.params.query;	
    // key to store results in Redis store
    const redisKey = searchtxt;
 
    // Try fetching the result from Redis first in case we have it cached
    return client.get(redisKey, (err, result) => {
 
        // If that key exists in Redis store
        if (result) {
 
            return res.json({ source: 'cache', data: JSON.parse(result) })
 
        } else { // Key does not exist in Redis store
 
            // Fetch directly from remote api
            fetch('https://serpapi.com/search.json?q='+searchtxt+'&hl=en&gl=us')
                .then(response => response.json())
                .then(result => {
 
                    // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                    client.setex(redisKey, 3600, JSON.stringify(result))
 
                    // Send JSON response to client
                    return res.json({ source: 'api', data: result })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error to the client 
                    return res.json(error.toString())
                })
        }
    });
});
 
// start express server at 3000 port
app.listen(3000, () => {
    console.log('Server listening on port: ', 3000)
});
