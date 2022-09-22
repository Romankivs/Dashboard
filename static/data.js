const wsConnection = new WebSocket('ws:https://dashboard-lab1.herokuapp.com:8081', 'json');
wsConnection.onopen = (e) => {
    console.log(`wsConnection open to https://dashboard-lab1.herokuapp.com:8081`, e);
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
        var dat = JSON.parse(newData);
        switch (dat.type) {
            case 'signal':
                console.log("ws signal");
                signal(dat.id, dat.data);
                break;
        }
    }
    else
    {
        let data = JSON.parse(e.data);
        console.log("TYPE: ", data.type);
        switch (data.type) {
            case 'connection':
                localId = data.id;
                break;
            case 'ids':
                peerIds = data.listOfIds;
                if (data.sendOffersId === localId)
                {
                    connect(true);
                }
                else
                {
                    connect(false);
                }
                break;
        }
    }
};

function connect(sendOffers = false) {
    // cleanup peer connections not in peer ids
    Object.keys(peerConnections).forEach(id => {
        if (!peerIds.includes(id)) {
            peerConnections[id].destroy();
            delete peerConnections[id];
        }
    });
    if (sendOffers) {
        console.log("initiator");
        initiator = true;
    }
    else
    {
        console.log("not initiator");
        initiator = false;
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
                toId : id,
                data
            }));
        });
        peer.on('connect', () => {
            console.log('CONNECT')
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
        peer.write(data);
    });
}
