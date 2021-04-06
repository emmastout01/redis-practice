const express = require('express');
const axios = require('axios');
const redis = require('redis');
const responseTime = require('response-time');
const { promisify } = require('util');

const app = express();
app.use(responseTime());

const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
})

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

app.get('/rockets', async (req, res, next) => {
    try {
        const redisReply = await GET_ASYNC('rockets');
        if (redisReply) {
            console.log('using cached data');
            res.send(JSON.parse(redisReply))
            return;
        }
        const response = await axios.get('https://api.spacexdata.com/v4/rockets');
        const savedResult = await SET_ASYNC('rockets', JSON.stringify(response.data), 'EX', 3);
        console.log('new data has been cached', savedResult);
        res.send(response.data);
    } catch (error) {
        res.send(error.message);
    }
})

app.get('/rockets/:id', async (req, res, next) => {
    try {
        const redisReply = await GET_ASYNC(req.params.id);
        if (redisReply) {
            console.log('using cached data');
            res.send(JSON.parse(redisReply));
            return;
        }
        const response = await axios.get(`https://api.spacexdata.com/v4/rockets/${req.params.id}`)
        const savedResult = await SET_ASYNC(req.params.id, JSON.stringify(response.data), 'EX', 3);
        console.log('new data cached');
        res.send(response.data);
    } catch (error) {
        res.send(error);
    }
})


app.listen(3000, () => console.log('🚀 on port 3000'));