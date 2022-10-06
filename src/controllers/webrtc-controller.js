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
let callerOrCallee, ch
let receiveBuffer = []

export class WebRtcController {

    // host / callType CALLER / CALLEE
    constructor (host, callType) {

        (this.host = host).addController(this)

        // init CALLER or CALLEE
        callerOrCallee = callType

        this.host.filesToDownload = []

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


    // init RTCPeerConnection listeners
    #initPeerConnectionListeners () {

        this.peerConnection.addEventListener('iceconnectionstatechange ', () => {
          this.consoleLog(
              `@ICE-${callerOrCallee} Connection state change >> ${this.peerConnection.iceConnectionState}`)
        })
        
        this.peerConnection.addEventListener('icegatheringstatechange', () => {
          this.consoleLog(
              `@ICE-${callerOrCallee} Gathering state changed >> ${this.peerConnection.iceGatheringState}`)
        })
    
        this.peerConnection.addEventListener('icecandidateerror', (err) => {
          this.consoleLog(
            `@ICE-${callerOrCallee} icecandidateerror >> `, err)
        })
      
        this.peerConnection.addEventListener('connectionstatechange', () => {
          this.consoleLog(
            `@CONNECTION-${callerOrCallee} state >> ${this.peerConnection.connectionState}`)
  
        })

        this.peerConnection.addEventListener('signalingstatechange', () => {
            this.consoleLog(
                `@SIGNALING-${callerOrCallee} >> ${this.peerConnection.signalingState}`)
        })
    } // end initPeerConnectionListeners


    // ----------------------------------- Data -------------------------------
    // init DataChannel s
    #initDataChannel () {
  
        // the caller start the data channel - callee listen to
        if (callerOrCallee === 'CALLER') {
  
          ch =this.peerConnection.createDataChannel(chName)
          this.#initDataListeners()
        }
  
        // callee listen for the channel
        if (callerOrCallee === 'CALLEE') {

            // event - RTCDataChannelEvent
            this.peerConnection.addEventListener('datachannel', event => {

            // @DEBUG
            this.consoleLog(`@${chName}-${callerOrCallee} >> `, event.channel)

            ch = event.channel
            this.#initDataListeners()
            })
        }

    } // end initDataChannel


    // init DataChannel listeners
    #initDataListeners () {
        if (!ch) return

        // RTCDataChannel
        const chName = ch.label

        // TODO binaryType
        ch.binaryType = 'arraybuffer'
        // init some vars
        receivedSize = 0
        bitrateMax = 0

        ch.addEventListener('open', event => {
            // data channel open
            this.consoleLog(`@${chName}-${callerOrCallee} >> OPEN`)
        })

        ch.addEventListener('close', event => {
            // data channel close
            this.consoleLog(`@${chName}-${callerOrCallee} >> CLOSE`)
        })

        ch.addEventListener('message', this.messageCallback.bind(this))

        ch.addEventListener('error', event => {
            this.consoleLog(`@ERROR-${callerOrCallee} >> ${event}`)
        })
    }

    messageCallback (event) {
        // console.log(`@${chName} BYTE >> ${event.data.byteLength}`)
        
        receiveBuffer.push(event.data)
        receivedSize += event.data.byteLength
        
        // use the shared variable you can reach in app
        this.received = receivedSize

        // when we have info from signaling pack in Blob
        if (this.host.filesToDownload.length === 0) return

        const fileName = this.host.filesToDownload[0].name
        const fileType = this.host.filesToDownload[0].type
        const fileSize = this.host.filesToDownload[0].size

        console.log(`@DEBUG FILE-SIZE ${receivedSize}  fileZise: ${fileSize}`)

        // all bytes arrived
        if (receivedSize === fileSize) {

            console.log(`@OK >> Process File with size ${receivedSize}  fileZise: ${fileSize}`)

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

            this.host.filesToDownload.shift()
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
