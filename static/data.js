const wsConnection = new WebSocket('ws:127.0.0.1:8081', 'json');
wsConnection.onopen = (e) => {
    console.log(`wsConnection open to 127.0.0.1:8081`, e);
};
wsConnection.onerror = (e) => {
    console.error(`wsConnection error `, e);
};

var localId, peerIds;
var peerConnections = {};
var initiator = false;

wsConnection.onmessage = (e) => {
    console.log(`We received: ${e.data}`)
    const arr = JSON.parse(e.data).data;
    if (arr)
    {
        let newData = '';
        arr.forEach((element) => {
          newData+=String.fromCharCode(element);
        });
        console.log('newData ', newData);
        console.log("ws signal");
        var dat = JSON.parse(newData);
        signal(dat.id, dat.data);
    }
    let data = JSON.parse(e.data);
    console.log("TYPE: ", data.type);
    switch (data.type) {
        case 'connection':
            localId = data.id;
            break;
        case 'ids':
            peerIds = data.ids;
            connect();
            break;
        case 'signal':
            console.log("ws signal");
            signal(data.id, data.data);
            break;
    }
};

function connect() {
    // cleanup peer connections not in peer ids
    Object.keys(peerConnections).forEach(id => {
        if (!peerIds.includes(id)) {
            peerConnections[id].destroy();
            delete peerConnections[id];
        }
    });
    if (peerIds.length === 1) {
        initiator = true;
    }
    peerIds.forEach(id => {
        if (id === localId || peerConnections[id]) {
            return;
        }

        let peer = new SimplePeer({
            initiator: initiator
        });
        console.log("NEW PEER");
        peer.on('error', console.error);
        peer.on('signal', data => {
            console.log('SIGNAL');
            wsConnection.send(JSON.stringify({
                type: 'signal',
                id: localId,
                data
            }));
        });
        peer.on('connect', () => {
            console.log('CONNECT')
            peer.send('whatever' + Math.random());
          })
        peer.on('data', (data) => onPeerData(id, data));
        peerConnections[id] = peer;
    });
}

function signal(id, data) {
    if (peerConnections[id]) {
        peerConnections[id].signal(data);
    }
}

function broadcast(data) {
    Object.values(peerConnections).forEach(peer => {
        peer.send(data);
    });
}
