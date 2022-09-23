// (App Skeleton)
import { LitElement, html, css } from 'lit'

import { PendingContainer } from './components/pending-container'
import { FirebaseController } from './controllers/firebase-controller'
import { WebRtcController } from './controllers/webrtc-controller'
import { sharedStyles } from './styles/shared-styles.js'

import './views/home-view'

let iceCandidateCount = 0
let calleeContainer, callerContainer
let fileReader
let sendProgress, receiveProgress
let statusMsg, bitrate, download

let firebaseController, webrtcController

class AppLite extends PendingContainer(LitElement) {

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
          display: grid;
          grid-template-columns: 1fr 1fr;
          justify-items: stretch;
        }

        main[caller] {
          /* caller animation */
          animation: callerAn 1500ms ease 1 forwards;
        }

        main[callee] {
          /* callee animation */
          animation: calleeAn 1500ms ease 1 forwards;
        }


        @keyframes callerAn {
          0% { grid-template-columns: 1fr 1fr; }
          100% { grid-template-columns: 1fr 23fr; }
        }

        @keyframes calleeAn {
          0% { grid-template-columns: 1fr 1fr; }
          100% { grid-template-columns: 23fr 1fr; }
        }


        section {
          min-height: 100vh;

          display: grid;
          justify-items: center;
          align-items: center;
        }

        #top-notification {
          --size: 37px;
          height: var(--size);

          position: absolute;
          top: 0;
          left: 0;
          right: 0;

          z-index: 101;

          font-size: 2rem;
          text-align: center;
          line-height: 3.7rem;
          color: var(--surface1);
          background-color: var(--brand);

          transform: translateY(-37px);
          animation: slideDown 5s 1.0s ease forwards;
        }

        @keyframes slideDown {
          0%, 100% {
            transform: translateY(-37px);
          }
          10%, 90% {
            transform: translateY(0px);
          }
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

          section {
            min-height: 50vh;
          }

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
      debug: Boolean,
      caller: Boolean,
      channelOpened: Boolean,
      warpId: {
        type: String,
        state: true,
        attribute: false
      }
		}
	}


	constructor () {
		super()
		// init
		this.asideIsOpen = false
    this.debug = true
		this.offline = !navigator.onLine
		this.mobileLayout =
      window.innerWidth < 640

    this.warpId = '---'
    this.caller = false
    this.channelOpened = false

    // Firebase controller
    firebaseController = new FirebaseController(this)
    // WebRTC controller
    webrtcController = {}
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


  firstUpdated () {

    calleeContainer =
      this.renderRoot.getElementById('callee-container')
    callerContainer =
      this.renderRoot.getElementById('caller-container')

    statusMsg = this.renderRoot.getElementById('status')
    sendProgress = this.renderRoot.getElementById('send-progress')
    receiveProgress = this.renderRoot.getElementById('receive-progress')
    bitrate = this.renderRoot.getElementById('bitrate')
    download = this.renderRoot.getElementById('download')

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


	// open / close aside nav (drawer)
	#handleDrawer () {
		this.asideIsOpen = !this.asideIsOpen
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


  #initFileInput () {
    this.renderRoot.getElementById('file-input')
        .addEventListener('change', this.handleFileInputChange.bind(this), false)
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

        await firebaseController.setFileInfo(this.warpId, fileInfo)

    } else {
        console.log('@FILE >> No File Chosen!')
        return
    }

    // Select the Chunk Size to broke the file to send
    const chunkSize = 16384
    fileReader = new FileReader()
    let offset = 0

    fileReader.addEventListener('error', () =>
        console.error(`@FILE-READER ${this.callerOrCallee} >> Error Reading File!`))

    fileReader.addEventListener('abort', () =>
        console.log(`@FILE-READER ${this.callerOrCallee} >> Reading File Aborted!`))

    fileReader.addEventListener('load', (event) => {
        console.log(`@FILE-READER ${this.callerOrCallee} > Read OK`)

        webrtcController.sendData(event.target.result)

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


  async #newWarp () {

    // init the RTCPeerConnection as CALLER
    webrtcController = new WebRtcController(this, 'CALLER')
    this.callerOrCallee = webrtcController.callerOrCallee

    // init the listener for input file
    this.#initFileInput()

    // @DEBUG
    console.log(`@CALLER oR CALLEE >> `, this.callerOrCallee)

    // newWarp this is a caller 
    this.#triggerCallerUi()

    if (this.warpId !== '---') {
      await this.#cleanWarp(this.warpId)
    }

    // Firebase ref to warp is returned
    const warpRef = await firebaseController.initWarp()
    this.warpId = warpRef.id

    console.log('@WARP-ID >> ', this.warpId)

    // listen when a RTCIceCandidate is fired from RTCPeerConnection
    webrtcController.listenIceCandidate(
      this.#handleCallerIceCandidate.bind(this))

    const offer = await webrtcController.createOffer()
    const warpOffer = {
      offer: JSON.stringify(offer)
    }
    await firebaseController.addOfferToWarp(
      this.warpId,
      warpOffer)
    
    // detect when signaling get the callee answer
    firebaseController.warpChanged(
      this.warpId,
      async (snapshot) => {

        const data = snapshot.data()
        if (!data || !data.answer) return

        const answer =
          new RTCSessionDescription(JSON.parse(data.answer))
        await webrtcController.setAnswerOnCaller(answer)

    })

    // listen when a RTCIceCandidate is add in signaling ch
    firebaseController.callerIceCandidateChanges(
      this.warpId,
      this.#handleIceCandidateChanges.bind(this))

  } // end newWarp()


  async #cleanWarp () {

    if (this.warpId !== '---') {
      await firebaseController.cleanWarp(this.warpId)
      this.warpId = '---'
    }

  }

  async #joinWarp () {

    // init the RTCPeerConnection as CALLEE
    webrtcController = new WebRtcController(this, 'CALLEE')

    const input = this.renderRoot.getElementById('warpid')

    if (!input.checkValidity()) {
      // @ERROR or EXCEPTION
      console.log('@WARP-ID >> Wrong Warp ID!')
      return
    }

    // newWarp this is a caller
    // TODO
    // this.#triggerCalleeUi()

    this.warpId = input.value
    const warpToJoin =
      await firebaseController.getWarp(this.warpId)

    if (!warpToJoin) {
      // @ERROR or EXCEPTION
      console.log('@WARP-ID >> Invalid!')
      return
    }

    // listen when a RTCIceCandidate is fired from RTCPeerConnection
    webrtcController.listenIceCandidate(
      this.#handleCalleeIceCandidate.bind(this))

    // retrieve from cloud and set the remote offer
    const offer = new RTCSessionDescription(
      JSON.parse(warpToJoin.offer)
    )

    const answer =
      await webrtcController.setOfferOnCallee(offer)

    const warpAnswer = {
      answer: JSON.stringify(answer)
    }

    await firebaseController.addAnswerToWarp(
      this.warpId,
      warpAnswer
    )

    // listen when a RTCIceCandidate is add in signaling ch
    firebaseController.calleeIceCandidateChanges(
      this.warpId,
      this.#handleIceCandidateChanges.bind(this))
    
  }

  async #handleCallerIceCandidate (event) {
    // callback on listener for RTCIceCandidate on RTCPeerConnection
        iceCandidateCount++

        if (!event.candidate) {
          console.log('@ICE-CANDIDATE >> Candidate Got Final!')
          return
        }

        console.log(`@ICE-CANDIDATE ${iceCandidateCount} >> `,
            event.candidate.toJSON().candidate)

        // if caller set the RTCIceCandidate on callee by signaling
        await firebaseController.calleeAddIceCandidate(
          this.warpId,
          event.candidate.toJSON())
        
  }

  async #handleCalleeIceCandidate (event) {
    // callback on listener for RTCIceCandidate on RTCPeerConnection
        iceCandidateCount++

        if (!event.candidate) {
          console.log('@ICE-CANDIDATE >> Candidate Got Final!')
          return
        }

        console.log(`@ICE-CANDIDATE ${iceCandidateCount} >> `,
            event.candidate.toJSON().candidate)

        // if callee set the RTCIceCandidate on caller by signaling
        await firebaseController.callerAddIceCandidate(
          this.warpId,
          event.candidate.toJSON())
        
  }


  async #handleIceCandidateChanges (snapshot) {

    snapshot.docChanges().forEach(async (change) => {
  
      if (change.type === 'added') {
        const data = change.doc.data()

        // @DEBUG
        console.log(`@ICE-CHANGED >> ${data.candidate}`)

        try {

          webrtcController.addIceCandidate(
            new RTCIceCandidate(data))

        } catch (e) {
          console.error(
            `@CATCH ${this.callerOrCallee} >> Error adding received ice candidate`,
            e)
        }
        
      }
    }) // end forEach

  }


  async #triggerCallerUi () {
    // this is the Caller UI
    console.log('@UI >> Trigger Caller')

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
    console.log('@UI >> Trigger Caller')

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
    webrtcController.sendMsg(msg)
  }

	render () {
		return html`

      <!-- top notification -->
      <div id="top-notification">
        Top notification bar
      </div>

      <main>

        <section
          id="callee"
          @click=${this.#triggerCalleeUi}
          style="background-color: red;">

          <div id="callee-content">
            <input
              id="warpid"
              type="text"
              name="warpid"
              alt="Warp Id"
              minlength="20"
              maxlength="20"
              placeholder="Warp Id ... "
              size="20"
              ?disabled=${this.caller}
              autofocus/>

            <button
                id="joinwarp"
                class="btn-default"
                @click=${this.#joinWarp}
                ?disabled=${this.caller}>
                Join Warp
            </button>

            ${webrtcController.downloadAnchor
                ? html`<a id="download" href=${webrtcController.downloadAnchor} download>Download</a>`
                : html``
              }

            <a id="download-one" href=${webrtcController.downloadAnchor} download>Download ${webrtcController.downloadAnchor}</a>

          </div>

        </section>

        <section
          id="caller"
          @click=${this.#triggerCallerUi}
          style="background-color: orange;">

          <!-- callee content -->
          <div id="caller-content">
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

            <form id="file-info">
              <input type="file" id="file-input" name="files"/>
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