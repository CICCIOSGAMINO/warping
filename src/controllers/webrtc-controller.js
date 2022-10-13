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
let receivedSize, bitrateMax
let ch
let receiveBuffer = []
let iceCandidateCount = 0

export class WebRtcController {

    // host / callType CALLER / CALLEE
    constructor (host) {

        (this.host = host).addController(this)

        this.host.filesToDownload = []

        // ICE Google Config
        this.peerConnection = new RTCPeerConnection(this.ICE_GOOGLE_CONF)

        // ICE Twilio Config
        // this.peerConnection = new RTCPeerConnection(this.ICE_TWILIO_CONF)

    }

    initCallerOrCallee (callerOrCalleeStr) {
        this.callerOrCallee = callerOrCalleeStr

        // init the listeners that need it
        this.initDataChannel()
    }

    initWarpId (warpId) {
        this.warpId = warpId

        // init the listeners that need it
    }

    hostConnected () {
	    this.host.requestUpdate()
    }

    hostDisconnected () {
        this.consoleLog('@WEBRTC-CTR >> Disconnected from Controller')
    }

    hostUpdated () {
        // this.consoleLog('@WEBRTC-CTR >> Updated by Controller')
    }

    // ------------------------- RTCSessionDescription ------------------------
    // #1 create the Offer
    async createOffer () {
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)

        return this.peerConnection.localDescription
    }

    // #3 set the offer received from signaling to callee
    async handleOffer (offer) {
        if (!(offer instanceof RTCSessionDescription)) return
        
        await this.peerConnection.setRemoteDescription(offer)

        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        return this.peerConnection.localDescription
    }

    // #4 set remote on caller from answer received from callee
    async handleAnswer (answer) {

        if (!(answer instanceof RTCSessionDescription)) return

        // do NOT setRemote if connected
        if (this.peerConnection.connectionState === 'connected') return

        await this.peerConnection.setRemoteDescription(answer)
    }

    // ----------------------------- RTCIceCandidate --------------------------
    // Set the IceCandidate, can be set from both CALLER / CALLEE
    // @param {RTCIceCandidate} iceCandidate 
    addIceCandidate (iceCandidate) {
        if (!(iceCandidate instanceof RTCIceCandidate)) return

        // TODO
        // do NOT add if already in stable state
        // if (this.host.signalingState === 'stable') return

        this.peerConnection.addIceCandidate(iceCandidate)
    }

    initAllListeners () {
        this.initDataListeners()
        this.initPeerConnectionListeners()
        this.initIceCandidateListener()
    }

    initIceCandidateListener () {

        this.peerConnection.addEventListener('icecandidate', (event) => {

            // when event.candidate undefined the process ended
            if (!event.candidate) {
                this.consoleLog('@ICE-CANDIDATE >> Candidate Got Final!')
                return
            }

            const candidate = event.candidate.toJSON()

            // @DEBUG
            // console.log(`@ICE-CANDIDATE ${iceCandidateCount} >> `, candidate)

            if (this.callerOrCallee === 'CALLER') {
                this.host.iceCallerCandidates = candidate
            }

            if (this.callerOrCallee === 'CALLEE') {
                this.host.iceCalleeCandidates = candidate
            }

        })

        this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
            this.consoleLog(
                `@ICE Connection state change >> ${this.peerConnection.iceConnectionState}`)
        })
        
        this.peerConnection.addEventListener('icegatheringstatechange', () => {
            this.consoleLog(
                `@ICE Gathering state changed >> ${this.peerConnection.iceGatheringState}`)
        })
    
        this.peerConnection.addEventListener('icecandidateerror', (err) => {
            this.consoleLog(
                `@ICE icecandidateerror >> `, err)
        })
        
    }


    // init RTCPeerConnection listeners
    initPeerConnectionListeners () {
      
        this.peerConnection.addEventListener('connectionstatechange', () => {
          this.consoleLog(
            `@CONNECTION statechange >> ${this.peerConnection.connectionState}`)
  
        })

        this.peerConnection.addEventListener('signalingstatechange', () => {
            
            this.consoleLog(
                `@CONNECTION statechange >> ${this.peerConnection.signalingState}`)

           this.host.signalingState =
                this.peerConnection.signalingState
        })

    } // end initPeerConnectionListeners


    // ----------------------------------- Data -------------------------------
    // init DataChannel s
    initDataChannelOld () {
  
        // the caller start the data channel - callee listen to
        if (this.callerOrCallee === 'CALLER') {
  
          ch = this.peerConnection.createDataChannel(chName)
         
          // Active all listeners
          this.initAllListeners()
        }
  
        // callee listen for the channel
        if (this.callerOrCallee === 'CALLEE') {

            // event - RTCDataChannelEvent
            this.peerConnection.addEventListener('datachannel', event => {

            // @DEBUG
            this.consoleLog(`@${chName}-${this.callerOrCallee} >> `, event.channel)

            ch = event.channel
            
            // Active all listeners
            this.initAllListeners()
            })
        }

    } // end initDataChannel

    initDataChannel () {
        ch = this.peerConnection.createDataChannel(chName)

        this.initAllListeners()

        this.peerConnection.addEventListener('datachannel', (event) => {
            // @DEBUG
            // this.consoleLog(`@${chName}-${this.callerOrCallee} >> `, event.channel)
            this.consoleLog(`@CH ${chName} >> `, event.channel)

            ch = event.channel
        })
    }


    // init DataChannel listeners
    initDataListeners () {
        if (!ch) return

        // RTCDataChannel
        const chName = ch.label

        ch.binaryType = 'arraybuffer'
        // init some vars
        receivedSize = 0
        bitrateMax = 0

        ch.addEventListener('open', event => {
            // data channel open
            this.consoleLog(`@${chName} >> OPEN`)

            this.host.channelOpen = true
        })

        ch.addEventListener('close', event => {
            // data channel close
            this.consoleLog(`@${chName} >> CLOSE`)

            this.host.channelOpen = false
        })

        ch.addEventListener('message', this.messageCallback.bind(this))

        ch.addEventListener('error', event => {
            this.consoleLog(`@CH ERROR >> ${event}`)
        })
    }

    messageCallback (event) {

        // @DEBUG
        console.log(`@CH ${chName} BYTE >> ${event.data.byteLength}`)
        
        receiveBuffer.push(event.data)
        receivedSize += event.data.byteLength
        
        // use the shared variable you can reach in app
        this.received = receivedSize

        console.log('@DEBUG this.host.filesToDownload >> ', this.host.filesToDownload)

        // when we have info from signaling pack in Blob
        if (this.host.filesToDownload.length === 0) return

        const fileName = this.host.filesToDownload.name
        const fileType = this.host.filesToDownload.type
        const fileSize = this.host.filesToDownload.size

        this.consoleLog(`@DEBUG FILE-SIZE ${receivedSize}  fileZise: ${fileSize}`)

        // all bytes arrived
        if (receivedSize === fileSize) {

            this.consoleLog(`@OK >> Process File with size ${receivedSize}  fileZise: ${fileSize}`)

            const received = new Blob(receiveBuffer)
            receiveBuffer = []
            receivedSize = 0

            this.host.filesDownloaded.push({
                url: URL.createObjectURL(received),
                name: fileName,
                type: fileType,
                size: fileSize,
                sizeHuman: this.showFileSize(fileSize)
            })

            this.host.filesToDownload = {}
            this.host.requestUpdate()
        }

    }

    // send message to other peer
    sendMsg (msg) {

        if (ch && ch.readyState === 'open') {
            // ch is open
            ch.send(msg)

        } else {
            console.log('@SEND-MSG >> CH is not ready ', ch.readyState)
        }
        
    }

    // send data to other peer
    sendData (blob) {

        if (ch && ch.readyState === 'open') {
            // ch is open
            ch.send(blob)
            
        } else {
            console.log('@SEND-MSG >> CH is not ready ', ch.readyState)
        }
    }

    // wrapper triggered by debug variable
    consoleLog(text) {
        if (!this.host.debug) return
        console.log(text)
    }

    // output bytes size in human notation
    showFileSize (numbersOfBytes) {

        const units = [
            'Byte', 'KiB', 'MiB', 'GiB', 'TiB',
            'PiB', 'EiB', 'ZiB', 'YiB'
        ]
        
        const exponent =
            Math.min(
                Math.floor(
                    Math.log(numbersOfBytes) / Math.log(1024), units.length - 1))
        
        const approx = numbersOfBytes / 1024 ** exponent
        const output =
            exponent === 0
            ? `${numbersOfBytes} bytes`
            : `${approx.toFixed(3)} ${
                units[exponent]
                } (${numbersOfBytes} bytes)`
        
        return output
    }


} // end class
