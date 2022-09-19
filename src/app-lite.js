// (App Skeleton)
import { LitElement, html, css } from 'lit'

import { PendingContainer } from './components/pending-container'
import { FirebaseController } from './controllers/firebase-controller'
import { WebRtcController } from './controllers/webrtc-controller'
import { sharedStyles } from './styles/shared-styles.js'

import './views/home-view'

let iceCandidateCount = 0

class AppLite extends PendingContainer(LitElement) {

  // Firebase controller
  #firebaseController = new FirebaseController(this)
  // WebRTC controller
  #webrtcController = {}

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

  async #newWarp () {
    this.#triggerCallerUi()
  }


  async #newWarpBK () {

    // init the RTCPeerConnection as CALLER
    this.#webrtcController = new WebRtcController(this, 'CALLER')
    this.callerOrCallee = this.#webrtcController.callerOrCallee

    // @DEBUG
    console.log(`@CALLER oR CALLEE >> `, this.callerOrCallee)

    // newWarp this is a caller 
    this.#triggerCallerUi()

    if (this.warpId !== '---') {
      await this.#cleanWarp(this.warpId)
    }

    // Firebase ref to warp is returned
    const warpRef = await this.#firebaseController.initWarp()
    this.warpId = warpRef.id

    console.log('@WARP-ID >> ', this.warpId)

    // listen when a RTCIceCandidate is fired from RTCPeerConnection
    this.#webrtcController.listenIceCandidate(
      this.#handleCallerIceCandidate.bind(this))

    const offer = await this.#webrtcController.createOffer()
    const warpOffer = {
      offer: JSON.stringify(offer)
    }
    await this.#firebaseController.addOfferToWarp(
      this.warpId,
      warpOffer)
    
    // detect when signaling get the callee answer
    this.#firebaseController.warpChanged(
      this.warpId,
      async (snapshot) => {

        const data = snapshot.data()
        if (!data || !data.answer) return

        const answer =
          new RTCSessionDescription(JSON.parse(data.answer))
        await this.#webrtcController.setAnswerOnCaller(answer)

    })

    // listen when a RTCIceCandidate is add in signaling ch
    this.#firebaseController.callerIceCandidateChanges(
      this.warpId,
      this.#handleIceCandidateChanges.bind(this))

  } // end newWarp()


  async #cleanWarp () {

    if (this.warpId !== '---') {
      await this.#firebaseController.cleanWarp(this.warpId)
      this.warpId = '---'
    }

  }

  async #joinWarp () {

    // init the RTCPeerConnection as CALLEE
    this.#webrtcController = new WebRtcController(this, 'CALLEE')

    // @DEBUG
    // console.log(`@CALLER oR CALLEE >> `, this.#webrtcController.callerOrCallee)

    const input = this.renderRoot.getElementById('warpid')

    if (!input.checkValidity()) {
      // @ERROR or EXCEPTION
      console.log('@WARP-ID >> Wrong Warp ID!')
      return
    }

    // newWarp this is a caller 
    this.#triggerCalleeUi()

    this.warpId = input.value
    const warpToJoin =
      await this.#firebaseController.getWarp(this.warpId)

    if (!warpToJoin) {
      // @ERROR or EXCEPTION
      console.log('@WARP-ID >> Invalid!')
      return
    }

    // listen when a RTCIceCandidate is fired from RTCPeerConnection
    this.#webrtcController.listenIceCandidate(
      this.#handleCalleeIceCandidate.bind(this))

    // retrieve from cloud and set the remote offer
    const offer = new RTCSessionDescription(
      JSON.parse(warpToJoin.offer)
    )

    const answer =
      await this.#webrtcController.setOfferOnCallee(offer)

    const warpAnswer = {
      answer: JSON.stringify(answer)
    }

    await this.#firebaseController.addAnswerToWarp(
      this.warpId,
      warpAnswer
    )

    // listen when a RTCIceCandidate is add in signaling ch
    this.#firebaseController.calleeIceCandidateChanges(
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
        await this.#firebaseController.calleeAddIceCandidate(
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
        await this.#firebaseController.callerAddIceCandidate(
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

          this.#webrtcController.addIceCandidate(
            new RTCIceCandidate(data))

        } catch (e) {
          console.error(
            `@CATCH ${this.callerOrCallee} >> Error adding received ice candidate`,
            e)
        }
        
      }
    }) // end forEach

  }


  #triggerCallerUi () {
    // this is the Caller UI
    console.log('@UI >> Trigger Caller')

    const slideupAnimation = [
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-500px)' },
    ]

    const cs =
      this.renderRoot.getElementById('callee')

    const csAnimation = cs.animate(
      slideupAnimation, {
        duration: 1000,
        iteration: 1,
        easing: 'ease-in'
      })

    csAnimation.finished.then(() => {
      console.log('@DONE!')
      cs.style.display = 'hidden'
    })
      
    
  }

  #triggerCalleeUi () {
    // this is the Callee UI
    console.log('@UI >> Trigger Caller')


  }

  // wrapper on #webrtcController.sendMsg
  sendMsg () {
    const msg = 'Hello RTCCiccio'
    this.#webrtcController.sendMsg(msg)
  }

	render () {
		return html`

      <!-- top notification -->
      <div id="top-notification">
        Top notification bar
      </div>

      <main>

        <section id="callee">

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
              class="btn-default"
              @click=${this.#joinWarp}
              ?disabled=${this.caller}>
              Join Warp
          </button>

        </section>

        <section id="caller">

          <h2>WarpId: ${this.warpId}</h2>
          <h3> >>
            ${this.caller
              ? html`You are the Caller!`
              : html``}
          </h3>

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