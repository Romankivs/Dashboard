var HOST = location.origin.replace(/^http/, 'ws')

const wsConnection = new WebSocket(HOST, 'json');
wsConnection.onopen = (e) => {
    console.log(`wsConnection open to ${HOST}`, e);
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
            initiator: initiator,
            config: {   iceServers: [
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
              ],},
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
