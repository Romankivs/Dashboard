# Dashboard
We use Websockets to implement bidirectional communication between clients and signaling server.
We have choosen Websockets instead of Long Polling or Adaptive (Frequent) Polls, because Adaptive (Frequent) Polls
create a lot of unnecessary requests because clients must be aware of other connections being added or removed and Long Polling isn't 
bidirection and has worse latency.
