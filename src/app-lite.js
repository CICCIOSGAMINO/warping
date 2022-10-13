// (App Skeleton)
import { LitElement, html, css } from 'lit'

import { PendingContainer } from './components/pending-container'
import { FirebaseController } from './controllers/firebase-controller'
import { WebRtcController } from './controllers/webrtc-controller'
import { sharedStyles } from './styles/shared-styles.js'

import './views/home-view'

let calleeContainer, callerContainer
let fileReader
let sendProgress, receiveProgress
let statusMsg, bitrate, download
let callerFilesCount = 0
let calleeFilesCount = 0

// localStorage warp key
const warpKey = 'cached-warp'

class AppLite extends PendingContainer(LitElement) {

  // Connect to FirebaseController
  firebaseController = new FirebaseController(this)
  webrtcController = new WebRtcController(this)

	static get styles () {
		return [
			sharedStyles,
			css`
        :host {
          --easeOutExpo: cubic-bezier(0.16, 1, 0.3, 1); /* sidenav animation */
          --duration: .6s;  /* sidenav animation */

          min-height: 100vh;
        }

        main {
          height: 100vh;

          display: grid;
          grid-template-columns: 1fr 1fr;
          justify-content: wrap;
        }

        main[caller] {
          /* caller animation */
          animation: callerLeft 1500ms ease 1 forwards;
        }

        main[callee] {
          /* callee animation */
          animation: calleeRight 1500ms ease 1 forwards;
        }


        @keyframes callerLeft {
          0% { grid-template-columns: 1fr 1fr; }
          100% { grid-template-columns: 1fr 23fr; }
        }

        @keyframes calleeRight {
          0% { grid-template-columns: 1fr 1fr; }
          100% { grid-template-columns: 23fr 1fr; }
        }


        section {
          min-height: 100vh;

          display: grid;
          justify-items: center;
          align-items: center;

          gap: 3rem;
        }

        #caller {
          background-color: yellow;
        }

        #callee {
          background-color: red;
        }

        .content {
          width: 100%;
          height: 100%;

          display: grid;
          justify-items: center;
          align-items: center;
        }

        #caller-content {
          
        }

        #callee-content {

        }

        button {
          font-size: 1.7rem;
        }

        /* inputs */
        input[type=text] {
          font-size: 2.7rem;
          border: none;
          border-bottom: 2px solid var(--brand);
        }

        input:invalid {
          border-bottom: 2px solid var(--custom-red);
        }

        @media (max-width: 841px) {

          main {
            grid-template-columns: 1fr;
            grid-template-rows: 50vh 50vh;
          }

          main[caller] {
            /* caller animation */
            animation: callerTop 1500ms ease 1 forwards;
          }

          main[callee] {
            /* callee animation */
            animation: calleeBottom 1500ms ease 1 forwards;
          }

          section {
            min-height: 5vh;
          }

        }

        @keyframes callerTop {
          0% { grid-template-rows: 1fr 1fr; }
          100% { grid-template-rows: 1fr 23fr; }
        }

        @keyframes calleeBottom {
          0% { grid-template-rows: 1fr 1fr; }
          100% { grid-template-rows: 23fr 1fr; }
        }

      `
		]
	}


	// properties
	static get properties () {
		return {
			title: String,
			offline: Boolean,
			mobileLayout: Boolean,
			asideIsOpen: Boolean,
      channelOpen: Boolean,
      peerName: String,
      warp: {
        type: Object,
        state: true,
        attribute: false
      },
      warpId: {
        type: String,
        state: true,
        attribute: false
      },
      warpOffer: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      warpAnswer: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      iceCallerCandidates: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      iceCalleeCandidates: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      callerFiles: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      calleeFiles: {
        type: Array,
        state: true,
        attribute: false,
        hasChanged: this.deepCheck
      },
      filesToDownload: {
        type: Array,
        state: true,
        attribute: false
      },
      filesDownloaded: {
        type: Array,
        state: true,
        attribute: false
      }
		}
	}


	constructor () {
		super()

		this.asideIsOpen = false
		this.offline = !navigator.onLine
		this.mobileLayout =
      window.innerWidth < 640

    this.channelOpen = false
    this.warpId = '---'
    this.channelOpened = false

    this.debug = true

    this.filesDownloaded = []
	}

  deepCheck (newVal, oldVal) {

    if (JSON.stringify(newVal) === JSON.stringify(oldVal)) {
      return false
    } else {
      return true
    }

  }


	connectedCallback () {
		super.connectedCallback()
		// online / offline
		window.addEventListener('online', this.#goingOnline)
		window.addEventListener('offline', this.#goingOffline)
		// match the media query
		window.matchMedia('(min-width: 640px)')
			.addEventListener('change', this.#handleResizeToDesktop)
		window.matchMedia('(max-width: 639px)')
			.addEventListener('change', this.#handleResizeToMobile)
	}


  disconnectedCallback () {
		window.removeEventListener('online', this.#goingOnline)
		window.removeEventListener('offline', this.#goingOffline)
		super.disconnectedCallback()
	}

  async willUpdate (changedProperties) {

    // get the channel open
    if (changedProperties.has('channelOpen')) {

      if (this.channelOpen === true) {
        this.saveWarpToLocalStorage(this.warp)

        // @DEBUG
        console.log('@channelOpen (property) >> ', this.channelOpen)
      }
    }

    if (changedProperties.has('warpOffer')) {

      // set the offer received from signaling on callee
      if (this.firebaseController.callerOrCallee === 'CALLEE') {
          this.setOffer(this.warpOffer)
      }

      // @DEBUG
      // console.log('@warpOffer (property) >> ', this.warpOffer)
    }

    if (changedProperties.has('warpAnswer')) {

      // set the answer on caller (received from signaling)
      if (this.firebaseController.callerOrCallee === 'CALLER') {
        this.setAnswer(this.warpAnswer)
      }

      // @DEBUG
      console.log('@warpAnswer (property) >> ', this.warpAnswer)
    }

    if (changedProperties.has('iceCallerCandidates')) {

      // received caller candidate from signaling, because im the callee
      if (this.firebaseController.callerOrCallee === 'CALLEE') {
        this.webrtcController.addIceCandidate(new RTCIceCandidate(
          this.iceCallerCandidates))
      }

      // received from webrtcController, signaling it
      if (this.firebaseController.callerOrCallee === 'CALLER') {
        this.addIceCandidate(this.iceCallerCandidates)
      }

      // @DEBUG
      console.log('@iceCallerCandidates (property) >> ', this.iceCallerCandidates)
    }

    if (changedProperties.has('iceCalleeCandidates')) {

      // received callee candidate from signaling because im caller
      if (this.firebaseController.callerOrCallee === 'CALLER') {
        this.webrtcController.addIceCandidate(new RTCIceCandidate(
          this.iceCalleeCandidates))
      }

      // received from webrtcController, signaling it
      if (this.firebaseController.callerOrCallee === 'CALLEE') {
        this.addIceCandidate(this.iceCalleeCandidates)
      }

      // @DEBUG
      console.log('@iceCalleeCandidates (property) >> ', this.iceCalleeCandidates)
    }

    if (changedProperties.has('callerFiles')) {

      // @DEBUG
      console.log('@callerFiles (property) >> ', this.callerFiles)
      console.log('@filesToDownload >> ', this.callerFiles[callerFilesCount])

      this.filesToDownload = this.callerFiles[callerFilesCount]

      callerFilesCount++
    }

    if (changedProperties.has('calleeFiles')) {

      // @DEBUG
      console.log('@calleeFiles (property) >> ', this.calleeFiles)
      console.log('@TEST file >> ', this.calleeFiles[calleeFilesCount])

      calleeFilesCount++
    }

  }


  async firstUpdated () {

    // check if warp cached, not too old
    this.loadWarpFromLocalStorage()

    // if warpIn in the URL set the page as callee
    const { hash, hostname } = window.location

    if (hash) {
      const hashWarpId = hash.replace('#', '')
      console.log('@HASH >> ', hashWarpId)

      this.renderRoot.getElementById('warpid').value = hashWarpId
    }

    calleeContainer =
      this.renderRoot.getElementById('callee-container')
    callerContainer =
      this.renderRoot.getElementById('caller-container')

    statusMsg = this.renderRoot.getElementById('status')
    sendProgress = this.renderRoot.getElementById('send-progress')
    receiveProgress = this.renderRoot.getElementById('receive-progress')
    bitrate = this.renderRoot.getElementById('bitrate')
    download = this.renderRoot.getElementById('download')

    // init files listener
    this.renderRoot.getElementById('file-input')
        .addEventListener('change', this.handleFileInputChange.bind(this), false)

  }

	// handle back online
	#goingOnline = () => {
		this.offline = false
		console.log('@ONLINE')
		this.#showSnackBar('Online')
	}


	// handle going Offline
	#goingOffline = () => {
		this.offline = true
		console.log('@OFFLINE')
		this.#showSnackBar('Offline')
	}


	#showSnackBar (title) {
		const snack =
      this.renderRoot.querySelector('snack-bar')
		snack.title = title
		snack.setAttribute('active', '')
	}

	#handleResizeToDesktop = (e) => {
		if (e.matches) {
			this.mobileLayout = false
			console.log(`@MOBILE >> ${this.mobileLayout}`)
		}
	}


	#handleResizeToMobile = (e) => {
		if (e.matches) {
			this.mobileLayout = true
		}
	}


	// TODO - Test Async tasks
	_firePendingState () {

		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve()
			}, 2000)
		})

		const event = new CustomEvent('pending-state', {
			detail: {
				title: 'Async task',
				promise
			}
		})
		this.dispatchEvent(event)
	}

  saveWarpToLocalStorage (warp) {

    // add the warpId to the warp Object
    warp.warpId = this.warpId

    localStorage.setItem(warpKey,
      JSON.stringify(warp))

  }

  loadWarpFromLocalStorage () {

    try {

      const jsonWarp =
        JSON.parse(localStorage.getItem(warpKey))

      if (!jsonWarp) return

      const timeWindow =
        (Date.now() / 1000) - 3600

      if (jsonWarp.ts < timeWindow) {
        localStorage.removeItem(warpKey)
      } else {
        // load the warpId
        
        this.warpId = jsonWarp.warpId
        this.firebaseController.initWarpId(this.warpId)
      }

      // @DEBUG
      console.log('@WARP (cache) >> ', jsonWarp)

    } catch(error) {
      console.log('@CATCH >> ', error)
    }

  }

  #initFilesChangeListener (warpId) {

    // init the listening of warp changes (check files)
    this.firebaseController.warpChanged(warpId, (snapshot) => {

      const warp = snapshot.data()

      // use to jump the first / init read of warp
      if (!warp.callerFiles && !warp.calleeFiles) return

      // [{0: {size: 80085, type: 'image/jpeg', name: 'me.jpg'}}, 1: ...]
      const firebaseFiles =
        warp.callerFiles ? warp.callerFiles : warp.calleeFiles

      // @DEBUG
      // console.log(`@FILES-TO-DOWNLOAD >>`)
      // console.log(firebaseFiles)

      // this.filesToDownload.push(firebaseFiles[filesCount])
      // filesCount++

    })

  }


  // callback to handle the input element change event (used to send files)
  async handleFileInputChange (event) {

    const fileList = event.target.files
    const file = fileList[0]

    if (file) {
        console.log(`@FILE >> ${[file.name, file.size, file.type].join(' ')}`)

        // signaling the name / size / type of the file to warp
        const fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size
        }

        await this.firebaseController.setFileInfo(
          this.warpId,
          fileInfo)

    } else {
        console.log('@FILE >> No File Chosen!')
        return
    }

    // TODO
    // waiting some time to permit the signaling on the callee
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Select the Chunk Size to broke the file to send
    const chunkSize = 16384
    fileReader = new FileReader()
    let offset = 0

    fileReader.addEventListener('error', () =>
        console.error(`@FILE-READER >> Error Reading File!`))

    fileReader.addEventListener('abort', () =>
        console.log(`@FILE-READER >> Reading File Aborted!`))

    fileReader.addEventListener('load', (event) => {
        console.log(`@FILE-READER >> Read OK`)

        // File read, time to send down the ch
        this.webrtcController.sendData(event.target.result)

        offset += event.target.result.byteLength
        // use the shared variable you can reach in app
        this.progress = offset
        
        if (offset < file.size) {
            readSlice(offset)
        }

    }) // end laod 

    const readSlice = o => {
        // @DEBUG
        console.log('@READ-SLICE >> ', o)

        const slice = file.slice(offset, o + chunkSize)
        fileReader.readAsArrayBuffer(slice)
    }

    readSlice(0)

  } // end handleFileInputChange


  // new warp means this is a Caller Peer
  async #newWarp () {

    // newWarp this is a caller 
    this.#triggerCallerUi()

    this.firebaseController.initCallerOrCallee('CALLER')
    this.webrtcController.initCallerOrCallee('CALLER')

    if (this.warpId !== '---') {
      await this.#cleanWarp(this.warpId)
    }

    // Firebase ref to warp is returned
    const warpRef = await this.firebaseController.initWarp()
    this.warpId = warpRef.id

    console.log('@WARP-ID >> ', this.warpId)
    // update the url in the bar
    window.history.replaceState({ page: 'warpId' }, 'WarpId', `#${this.warpId}`)

    this.firebaseController.initWarpId(this.warpId)

    const offer = await this.webrtcController.createOffer()
    const warpOffer = {
      offer: offer.toJSON()
    }
    
    this.firebaseController.signalingOffer(warpOffer)

  } // end newWarp()


  async #cleanWarp () {

    if (this.warpId !== '---') {
      await this.firebaseController.cleanWarp(this.warpId)
      this.warpId = '---'
    }

  }

  // join warp means this is a Callee Peers
  async #joinWarp () {

    // joinWarp this is a callee
    this.#triggerCalleeUi()

    // warpId is passed as input
    const input = this.renderRoot.getElementById('warpid')

    if (!input.checkValidity()) {
      // @ERROR or EXCEPTION
      console.log('@WARP-ID >> Wrong Warp ID!')
      return
    }

    this.warpId = input.value

    // init the RTCPeerConnection as CALLEE
    this.webrtcController.initCallerOrCallee('CALLEE')
    this.firebaseController.initCallerOrCallee('CALLEE')
    this.firebaseController.initWarpId(this.warpId)
    
  }

  async setOffer (offer) {

    // just received caller offer, handle caller offer & signaling answer
    const answer = await this.webrtcController.handleOffer(
      new RTCSessionDescription(offer))

    const warpAnswer = {
      answer: answer.toJSON()
    }

    this.firebaseController.signalingAnswer(warpAnswer)
  }

  async setAnswer (answer) {
    // just received callee answer, set it on caller
    await this.webrtcController.handleAnswer(
      new RTCSessionDescription(answer))
  }

  async addIceCandidate (iceCandidate) {

    const ic = new RTCIceCandidate(iceCandidate)

     await this.firebaseController.addIceCandidate(ic)
  }

  async #triggerCallerUi () {
    // this is the Caller UI
    // console.log('@UI >> Trigger Caller')

    this.renderRoot.querySelector('main')
      .removeAttribute('callee')
    this.renderRoot.querySelector('main')
      .setAttribute('caller', '')

    // show Caller Ui so hide the Callee Content
    calleeContainer =
      this.renderRoot.getElementById('callee-content')
    if (calleeContainer) {
      calleeContainer.remove()
    }

    // if needed add the content
    if (callerContainer) {
      await setTimeout(() => {
        this.renderRoot.getElementById('caller')
          .appendChild(callerContainer)
      }, 300)
    }
    
  }

  async #triggerCalleeUi () {
    // this is the Callee UI
    // console.log('@UI >> Trigger Callee')

    this.renderRoot.querySelector('main')
      .removeAttribute('caller')
    this.renderRoot.querySelector('main')
      .setAttribute('callee', '')

    // show Callee Ui so hide the Caller Content
    callerContainer =
      this.renderRoot.getElementById('caller-content')
    if (callerContainer) {
      callerContainer.remove()
    }

    // if needed add the content
    if (calleeContainer) {
      await setTimeout(() => {
        this.renderRoot.getElementById('callee')
          .appendChild(calleeContainer)
      }, 300)
    }

  }

  // wrapper on webrtcController.sendMsg
  sendMsg () {
    const msg = 'Hello RTCCiccio'
    this.webrtcController.sendMsg(msg)
  }


  downloadButtonsRenderHelper () {
    if (this.filesDownloaded && this.filesDownloaded.length > 0) {
      return this.filesDownloaded.map((item) =>
        html`
          <p>${item.name}</p>
          <p>${item.type}</p>
          <p>${item.sizeHuman}</p>

          <a 
            id="download"
            href=${item.url}
            download=${item.name}>
            Download
          </a>
          `
    )} else {
      return html ``
    }
  }

	render () {
		return html`

      <main>

        <section
          id="callee"
          @click=${this.#triggerCalleeUi}>

          <div id="callee-content" class="content">

            <div id="callee-warp" class="warp">
              <input
                id="warpid"
                type="text"
                name="warpid"
                alt="Warp Id"
                minlength="20"
                maxlength="20"
                placeholder="Warp Id ... "
                size="20"
                ?disabled=${this.channelOpen}
                autofocus/>

              <button
                  id="joinwarp"
                  class="btn-default"
                  @click=${this.#joinWarp}
                  ?disabled=${this.channelOpen}>
                  Join Warp
              </button>
            </div>

            <div id="callee-files" class="files">
              ${this.downloadButtonsRenderHelper()}
            </div>

          </div>

        </section>

        <!-- Caller Section -->
        <section
          id="caller"
          @click=${this.#triggerCallerUi}>

          <div id="caller-content" class="content">

            <div id="caller-warp" class="warp">
              <h2>WarpId: ${this.warpId}</h2>

              <button
                class="btn-default"
                @click=${this.#newWarp}>
                New Warp
              </button>

              <input id="msg" type="text" name="msg" />

              <button
                @click=${this.sendMsg}>
                Send
              </button>
            </div>

            <div id="caller-files" class="files">

                <form id="file-info">
                  <input
                    type="file"
                    id="file-input"
                    name="files"
                    ?disabled=${!this.channelOpen} />
                </form>

                <!-- Send info -->
                <div class="progress">
                  <div class="label">Send progress: </div>
                  <progress id="send-progress" max="0" value=${this.progress}></progress>
                </div>

                <!-- Receive info -->
                <div class="progress">
                  <div class="label">Receive progress: </div>
                  <progress id="receive-progress" max="0" value=${this.progress}></progress>
                </div>

                <div id="bitrate"></div>
                <span id="status"></span>

            </div>

          </div>
          
        </section>
        
      </main>

      <snack-bar timing="3000"></snack-bar>
    `
	}

	/* no shadowed (encapsulated CSS unavailable)
  createRenderRoot () {
    return this
  } */
}

window.customElements.define('app-lite', AppLite)