warping-web
===========
[TOC]

v0.1.0 - 10-09-2022

Warping Web - WebApp, share all stuff you need at the speed of light! Warping is trying to use the best speed possibile between the peers. Communication end to end encypted no server in the middle.

https://warping.....

```bash
# start
npm run start
```

# Caller & Callee - RTCPeerConnection / RTCSessionDescription / RTCIceCandidate

1. Create the Caller offer
2. Drag and drop the Caller offer into Callee RTCSessionDescription
3. Drag and drop the Callee answer into Caller RTCSessionDescription
4. Drag and drop Caller RTCIceCandidate box to Callee RTCIceCandidate

and the RTCPeerConnection is up and connected. Open the Dev Console to follow the WebRTC api messages printed to console to grasp what is running bakground!

# SDP (Session Description Protocol) - RTCSessionDescription
WebRTC connections are initialized through the use of offer / answer RTCSessionDescription objects, let's check what are the steps needed:

1. Caller create an instance of RTCPeerConnection and produce a sdp packet using
```javascript
// caller
const rtcPeerConnection = new RTCPeerConnection(configuration)
const offer = rtcPeerConnection.createOffer()
(offer instanceof RTCSessionDescription) // true
```

2. Caller in parallel or not set the local description
```javascript
// caller
rtcPeerConnection.setLocalDescription(offer)
```

3. Callee receive the Caller offer (sdp packet) to connect
```javascript
// callee
const rtcPeerConnection = new RTCPeerConnection(configuration)
// set the received answer and set as its Remote RTCSessionDescription
(answer instanceof RTCSessionDescription) // true
rtcPeerConnection.setRemoteDescription(answer)
```

4. Callee peer generate its own sdp packet and set it as local description
```javascript
// callee
const answ = rtcPeerConnection.createAnswer()
rtcPeerConnection.setLocalDescription(answ)
```

5. Callee send the answer just created to the Caller as response, which it sets as its remote description
```javascript
// caller
rtcPeerConnection.setLocalDescription(answ)
```

RTCSessionDescription are object where are described the details the media capabilities of the Client's machine and browser. Now both parties are aware of each other's media capabilities, but not much has been said of the network.

https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription

# ICE Candidates
However, while media information is relatively instantaneous to acquire and of a linear description, the network capabilities are usually numerous and take a little time to acquire. For this reason, the network details are sent ad-hoc as they are known.

Connectivity between Caller and Callee can begin as soon as the first candidate is sent but may not be established until an acceptable candidate is processed. This is known as Trickle ICE and is a means to establish connectivity as soon as possible. Essentially, all connectivity options will be tried and exhausted until one succeeds.

The network sdp packets are acquired by listening to icecandidate event, and sent via the signaling to the other party, which assings it to its own RTCPeerConnection instance via the addIceCandidate method.

Connectivity happens when a suitable network pair match and data flows.

```javascript
// caller
peerConnection.addEventListener('icecandidate', async (event) => {

    // when null Candidate Got Final
    if (!event.candidate) {
        console.log('@ICE-CALLER >> Candidate Got Final!')
        return
    }

    // dispatch RTCIceCandidate to Callee
    signalToCallee(event.candidate.toJSON())

})

// calle
peerConnection.addIceCandidate(ic)
```

https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate

# SDP type
All data used to establish a connection is in SDP format.

https://webrtchacks.github.io/sdp-anatomy/

One of the more important aspects of ICE candidate SDP packets is the typ parameter. For WebRTC, this can be one of three options:

1. typ host
2. typ srflx
3. typ relay
4. typ host

## host
The host type denotes connections to devices on your local network. Typically, all host connections will be made without the use of either STUN nor TURN. The reason for this is that as the connecting device is on the same network, there is no need for local-to-public IP address translation, and thus a connection can be made directly.

Note that just because two machines are on the same network, it does not automatically assume a direct connection can be made.

## srflx
srflx is an abbreviation for Server Reflexive, which is the term used to denote the acquisition of the public IP address. Thus, srflx means Peer-to-Peer connections requiring just STUN. When both parties provide a srflx packet, it means both parties should be connectable via a STUN-only setup but does not mean both parties can connect to each other with such.

## relay
relay is used to denote TURN connectivity. When both parties provide such a packet, a connection should most definitely be possible.


The packet types listed above are not successive; that is to say, a device may provide a srflx packet but not a relay packet or vice versa. When both parties fail to present matching packet types, a connection may not be possible at all.


# Firebase
This WebRTC WebApp use firebase firestore db as a communication channel to start the WebRTC communication, in the server folder you can find the version with a node.js websocket server (TODO) if you want host your server and do NOT spinup a firebase project.

```bash
# test firebase hosting on local (test the static html, css, js code)
firebase serve --only hosting
```

Getting start to deploy to a preview channel. CHANNEL_ID will be used to construct the preview URL.
```bash
# get the list of live & preview channels
firebase hosting:channel list

# deploy hosting on channel
firebase hosting:channel:deploy <CHANNEL_ID>

firebase hosting:channel:deploy test-new-feature	--expires 1d

# delete channel
firebase hosting:channel delete <CHANNEL_ID>

# deploy from local
firebase deploy --only hosting

# deploy and add comment
firebase deploy --only hosting -m "Deploy images"
```

Firestore TTL (Time To Live)
https://firebase.google.com/docs/firestore/ttl

GCP Firestore Console
https://console.cloud.google.com/firestore/ttl?project=warping-web