var HOST = location.origin.replace(/^http/, 'ws')

const wsConnection = new WebSocket(HOST, 'json');

wsConnection.onopen = (e) => {
    console.log(`websocket connection open to ${HOST}`, e);
};

wsConnection.onerror = (e) => {
    console.error(`websocket connection error `, e);
};

var localId, peerIds;
var peerConnections = {};
var initiator = false;

wsConnection.onmessage = (e) => {
    console.log(`websocket received: ${e.data}`)
    let data = JSON.parse(e.data).data;
    if (data)
    {
        let newData = '';
        data.forEach((element) => {
          newData+=String.fromCharCode(element);
        });
        data = JSON.parse(newData);
    }
    else
    {
        data = JSON.parse(e.data);
    }
    console.log("TYPE: ", data.type);
    switch (data.type) {
        case 'connection':
            localId = data.id;
            break;
        case 'ids':
            peerIds = data.listOfIds;
            connect(data.sendOffersId === localId);
            break;
        case 'signal':
            signal(data.id, data.data);
            break;
    }
};

function connect(initiator = false) {
    // cleanup peer connections not in peer ids
    Object.keys(peerConnections).forEach(id => {
        if (!peerIds.includes(id)) {
            peerConnections[id].destroy();
            delete peerConnections[id];
        }
    });
    console.log(`initiator: ${initiator}`);
    peerIds.forEach(id => {
        if (id === localId || peerConnections[id]) {
            return;
        }

        console.log("NEW PEER");

        let peer = new SimplePeer({
            initiator: initiator,
            config: { iceServers: [
                {
                  urls: "stun:openrelay.metered.ca:80",
                },
                {
                  urls: "turn:openrelay.metered.ca:80",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443?transport=tcp",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
              ]}
        });

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
