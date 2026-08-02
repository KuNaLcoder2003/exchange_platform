import express from "express";
import { WebSocket, WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { createClient } from "redis";
const app = express();
const httpServer = app.listen(8080);
const redisClient = createClient();
const wss = new WebSocketServer({ server: httpServer });
const clients = new Map();
wss.on('connection', async (ws, req) => {
    ws.on('error', (err) => console.error(err));
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        if (data.type == "Authenticate") {
            const token = data.token;
            const verified = jwt.verify(token, 'i3r80j23riunjer983jrijef');
            if (verified) {
                clients.set(verified.id, ws);
            }
            else {
                ws.send('Not verified');
            }
        }
    });
    const data = await redisClient.get('orderBook');
    if (data) {
        const orderBook = JSON.parse(data);
        ws.send(JSON.stringify(orderBook));
    }
    else {
        ws.send(JSON.stringify([]));
    }
});
async function sendNotifications() {
    await redisClient.connect();
    console.log('Connected to redis');
    await redisClient.subscribe('OrderBookUpdated', (message) => {
        console.log('message data is :', JSON.parse(message));
        const data = JSON.parse(message);
        // commented for testing purposes
        // clients.forEach(client => {
        //     client.send(JSON.stringify(data))
        // })
        wss.clients.forEach(client => {
            if (client.readyState == WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
}
sendNotifications();
//# sourceMappingURL=index.js.map