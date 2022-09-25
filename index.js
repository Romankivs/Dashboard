var express = require('express');
var http = require('http');
var ws = require('ws');
var uuid = require('uuid');
var path = require('path');

const app = express();

app.use('/static', express.static(`${__dirname}/static`));

app.locals.connections = [];

const server = http.createServer(app);
const wss = new ws.Server({ server });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});

function broadcastConnections(sendOffersId = null) {
    console.log(`broadcast ${sendOffersId}`);
    let ids = app.locals.connections.map(c => c._connId);
    app.locals.connections.forEach(c => {
        c.send(JSON.stringify({ type: 'ids', sendOffersId: sendOffersId, listOfIds: ids }));
    });
}

wss.on('connection', (ws) => {
    console.log("new websocket client connected");
    app.locals.connections.push(ws);
    ws._connId = `conn-${uuid.v4()}`;

    // give client his id
    ws.send(JSON.stringify({ type: 'connection', id: ws._connId }));

    // update list of connection to clients
    broadcastConnections(ws._connId);

    ws.on('close', () => {
        console.log("websocket client has disconnected");
        let index = app.locals.connections.indexOf(ws);
        app.locals.connections.splice(index, 1);

        // update list of connection to clients
        broadcastConnections();
    });

    ws.on('message', (message) => {
        console.log(`websocket client has sent us: ${message}`)
        for (let i = 0; i < app.locals.connections.length; i++) {
            if (app.locals.connections[i] !== ws && JSON.parse(message).toId === app.locals.connections[i]._connId) {
                console.log(`we send to clients: ${message}`)
                app.locals.connections[i].send(JSON.stringify(message));
            }
        }
    });

});

server.listen(process.env.PORT || 8081, () => {
    console.log(`started server on port ${server.address().port}`);
});
