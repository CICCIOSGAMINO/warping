import { ICE_TWILIO_CONF } from '../config/twilio-turn-stun.js'

// Google STUN server
const ICE_GOOGLE_CONF = {
    iceServers: [
        {
        urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
        ],
        },
    ],
    iceCandidatePoolSize: 10,
}

// DataChannel name
const chName = 'cha0'

export class WebRtcController {

    // host / callType CALLER / CALLEE
    constructor (host, callType) {

        (this.host = host).addController(this)

        // init CALLER or CALLEE
        this.callerOrCallee = callType

        // ICE Google Config
        this.peerConnection = new RTCPeerConnection(this.ICE_GOOGLE_CONF)

        // ICE Twilio Config
        // this.peerConnection = new RTCPeerConnection(this.ICE_TWILIO_CONF)

        this.#initDataChannel()
        this.#initPeerConnectionListeners()
    }

    hostConnected () {
	    this.host.requestUpdate()
    }

    hostDisconnected () {
        this.consoleLog('@WEBRTC-CTR >> Disconnected from Controller')
    }

    hostUpdated () {
        this.consoleLog('@WEBRTC-CTR >> Updated by Controller')
    }

    // ------------------------- RTCSessionDescription ------------------------
    // #1 create the Offer
    async createOffer () {
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)
        return offer
    }

    // #3 set the offer received from signaling to callee
    async setOfferOnCallee (offer) {
        if (!(offer instanceof RTCSessionDescription)) return
        this.peerConnection.setRemoteDescription(offer)

        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        return answer
    }

    // #4 set remote on caller from answer received from callee
    async setAnswerOnCaller (answer) {
        if (!(answer instanceof RTCSessionDescription)) return

        this.peerConnection.setRemoteDescription(answer)
    }

    // ----------------------------- RTCIceCandidate --------------------------
    // Set the IceCandidate, can be set from both CALLER / CALLEE
    // @param {RTCIceCandidate} iceCandidate 
    addIceCandidate (iceCandidate) {
        if (!(iceCandidate instanceof RTCIceCandidate)) return
        this.peerConnection.addIceCandidate(iceCandidate)
    }

    listenIceCandidate (callback) {
        this.peerConnection.addEventListener('icecandidate', callback)
    }

    // send message to other peer
    sendMsg (msg) {

        if (this.ch.readyState === 'open') {
            // ch open send msg
        } else {
            
        }

        // TODO
        console.log('@READY-STATE >> ', this.ch.readyState)

        // TODO insert readyState in if
        if (!this.ch) return

        this.ch.send(msg)
    }

    // wrapper triggered by debug variable
    consoleLog(text) {
        if (!this.host.debug) return
        console.log(text)
    }


    // init RTCPeerConnection listeners
    #initPeerConnectionListeners () {

        this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
          this.consoleLog(
              `@ICE-${this.callerOrCallee} Connection state change >> ${this.peerConnection.iceConnectionState}`)
        })
        
        this.peerConnection.addEventListener('icegatheringstatechange', () => {
          this.consoleLog(
              `@ICE-${this.callerOrCallee} Gathering state changed >> ${this.peerConnection.iceGatheringState}`)
        })
    
        this.peerConnection.addEventListener('icecandidateerror', (err) => {
          this.consoleLog(
            `@ICE-${this.callerOrCallee} icecandidateerror >> `, err)
        })
      
        this.peerConnection.addEventListener('connectionstatechange', () => {
          this.consoleLog(
            `@CONNECTION-${this.callerOrCallee} state >> ${this.peerConnection.connectionState}`)
  
        })

        this.peerConnection.addEventListener('signalingstatechange', () => {
            this.consoleLog(
                `@SIGNALING-${this.callerOrCallee} >> ${this.peerConnection.signalingState}`)
        })
    } // end initPeerConnectionListeners


    // init DataChannel s
    #initDataChannel () {
  
        // the caller start the data channel - callee listen to
        if (this.callerOrCallee === 'CALLER') {
  
          this.ch =this.peerConnection.createDataChannel(chName)
          this.#initDataListeners()
        }
  
        // callee listen for the channel
        if (this.callerOrCallee === 'CALLEE') {

            // event - RTCDataChannelEvent
            this.peerConnection.addEventListener('datachannel', event => {

            // @DEBUG
            this.consoleLog(`@${chName}-${this.callerOrCallee} >> `, event.channel)

            this.ch = event.channel
            this.#initDataListeners()
            })
        }

    } // end initDataChannel


    // init DataChannel listeners
    #initDataListeners () {
        if (!this.ch) return

        // RTCDataChannel
        const chName = this.ch.label

        this.ch.addEventListener('open', event => {
            // data channel open
            this.consoleLog(`@${chName}-${this.callerOrCallee} >> OPEN`)
        })

        this.ch.addEventListener('close', event => {
            // data channel close
            this.consoleLog(`@${chName}-${this.callerOrCallee} >> CLOSE`)
        })

        this.ch.addEventListener('message', event => {
            this.consoleLog(`@${chName}-${this.callerOrCallee} MSG (Received) >> ${event.data}`)
        })

        this.ch.addEventListener('error', event => {
            this.consoleLog(`@ERROR-${this.callerOrCallee} >> ${event}`)
        })
    }


} // end class
