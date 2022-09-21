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

// starting index
app.locals.index = 100000000000;

app.get('/', (req, res) => {
    app.locals.index++;
    let id = app.locals.index.toString(36);
    res.redirect(`/${id}`);
});

app.get('/:roomId', (req, res) => {
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
    console.log("new client connected");
    app.locals.connections.push(ws);
    ws._connId = `conn-${uuid.v4()}`;

    // send the local id for the connection
    ws.send(JSON.stringify({ type: 'connection', id: ws._connId }));

    // send the list of connection ids
    broadcastConnections(ws._connId);

    ws.on('close', () => {
        console.log("the client has connected");
        let index = app.locals.connections.indexOf(ws);
        app.locals.connections.splice(index, 1);

        // send the list of connection ids
        broadcastConnections();
    });

    ws.on('message', (message) => {
        console.log(`Client has sent us: ${message}`)
        for (let i = 0; i < app.locals.connections.length; i++) {
            if (app.locals.connections[i] !== ws && JSON.parse(message).toId === app.locals.connections[i]._connId) {
                console.log(`We send: ${message}`)
                app.locals.connections[i].send(JSON.stringify(message));
            }
        }
    });

});

server.listen(process.env.PORT || 8081, () => {
    console.log(`Started server on port ${server.address().port}`);
});
