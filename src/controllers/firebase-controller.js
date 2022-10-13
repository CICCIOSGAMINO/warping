// FirebaseController - firebase job done here
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

import {
    getFirestore,
    doc,
    query,
    CACHE_SIZE_UNLIMITED,
    addDoc,
    collection,
    getDoc,
    Timestamp,
    deleteDoc,
    onSnapshot,
    updateDoc,
    arrayUnion,
} from 'firebase/firestore'

import {
    initializeAppCheck,
    ReCaptchaV3Provider
} from 'firebase/app-check'

import {
    firebaseConfig,
    RECAPTCHA_V3_PROVIDER
} from '../config/firebase-config.js'

const firestoreConfig = {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
}

const cacheMap = new Map()
let countIceCallerCandidates = 0
let countIceCalleeCandidates = 0

/**
 * To getting start using the FirebaseController:
 * 
 *  import { FirebaseController } from './controllers/firebase-controller'
 *  // init in the host element
 *  class Element extends LitElement {
 *      firebaseController = new FirebaseController(this)
 * }
 * 
 *  Call the initCallerOrCallee method when ready to set caller or callee
 * 
 *  Call the initWarpId method when ready to set the warpId
 * 
 */
export class FirebaseController {

    constructor (host) {
            
        (this.host = host).addController(this)

        this.#initFirebaseApp()
        // this.#initAppCheck()
        this.#initFirestore()

        // warps collection - where all warps are
        this.warpsCollection = collection(this.firestore, 'warps')
    }

    #initFirebaseApp () {
        // Initialize Firebase
        this.app = initializeApp(firebaseConfig)
        this.analytics = getAnalytics(this.app)
    }

    #initAppCheck () {
        this.appCheck = initializeAppCheck(
            this.app,
            // // Pass your reCAPTCHA v3 site key (public key) to activate()
            {
                provider: new ReCaptchaV3Provider(RECAPTCHA_V3_PROVIDER),
                isTokenAutoRefreshEnabled: true
            }
        )
    }

    #initFirestore () {
        this.firestore = getFirestore(
            this.app
        )
    }

    initCallerOrCallee (callerOrCalleeStr) {
        this.callerOrCallee = callerOrCalleeStr

        // init the listeners that need it
    }

    initWarpId (warpId) {
        this.warpId = warpId

        // init the listeners that need it
        this.warpChanged()
    }

    async initWarp () {
        const warpObj = {
            // Add the ts field
            ts: Timestamp.now().seconds
        }
        const newWarp = await addDoc(
            this.warpsCollection,
            warpObj)

        return newWarp
    }
    
    hostConnected () {
	    this.host.requestUpdate()
    }

    hostDisconnected () {
        this.consoleLog('@FIREBASE-CTR >> Disconnected from Controller')
    }

    hostUpdated () {
        // this.consoleLog('@FIREBASE-CTR >> Updated by Controller')
    }

    // wrapper triggered by debug variable
    consoleLog (text) {
        if (!this.host.debug) return
        console.log(text)
    }

    async setFileInfo (warpId, fileInfo) {

        if (!fileInfo || !warpId) return

        let callerOrCalleeFilePath
        const docRef = doc(this.firestore, 'warps', warpId)

        // if (this.host.callerOrCallee === 'CALLER') {
        if (this.callerOrCallee === 'CALLER') {

            await updateDoc(docRef, {
                callerFiles: arrayUnion(fileInfo)
            })
        }

        // if (this.host.callerOrCallee === 'CALLEE') {
        if (this.callerOrCallee === 'CALLEE') {

            await updateDoc(docRef, {
                calleeFiles: arrayUnion(fileInfo)
            })
        }

    }

    signalingOffer (offer) {

        const docRef = doc(this.firestore, 'warps', this.warpId)

        updateDoc(docRef, offer)
            .catch((error) => {
                // TODO handle error
                console.log('@FIRE-CTR >> Error ', error)
            })
    }

    signalingAnswer (answer) {

        const docRef = doc(this.firestore, 'warps', this.warpId)

        updateDoc(docRef, answer)
            .catch((error) => {
                console.log('@FIRE-CTR >> Error ', error)
            })
    }

    warpChanged () {

        const docRef = doc(this.firestore, 'warps', this.warpId)

        onSnapshot(docRef, (snapshot) => {
            const warp = snapshot.data()

            if (JSON.stringify(warp) === cacheMap.get('warp')) {

                // @DEBUG
                // console.log('@WARP and @WARP-CACHE are EQUAL!')
                return
            }

            // value in map are saved as stringified objects
            cacheMap.set('warp', JSON.stringify(warp))

            this.host.warp = warp

            // if the value changed in warp is offer update warpOffer property
            if (warp.offer && (JSON.stringify(warp.offer) !== cacheMap.get('warpOffer'))) {

                cacheMap.set('warpOffer', JSON.stringify(warp.offer))

                // need to be set only on callee
                if (this.callerOrCallee === 'CALLEE') {
                    this.host.warpOffer = warp.offer
                }

                // @DEBUG
                // console.log('@warp.offer Changed >> ', cacheMap.get('warpOffer'))
            }

            // if the value changed in warp is answer update answerOffer property
            if (warp.answer && (JSON.stringify(warp.answer) !== cacheMap.get('warpAnswer'))) {

                cacheMap.set('warpAnswer', JSON.stringify(warp.answer))

                // need to be set only on caller
                if (this.callerOrCallee === 'CALLER') {
                    this.host.warpAnswer = warp.answer
                }

                // @DEBUG
                // console.log('@warp.answer Changed >> ', cacheMap.get('warpAnswer'))
            }

            if (warp.iceCallerCandidates &&
                (JSON.stringify(warp.iceCallerCandidates) !== cacheMap.get('iceCallerCandidates'))) {
                
                cacheMap.set('iceCallerCandidates', JSON.stringify(warp.iceCallerCandidates))

                // need to be set only on callee
                if (this.callerOrCallee === 'CALLEE') {
                    // build an RTCIceCandidate with the last one in array
                    this.host.iceCallerCandidates = new RTCIceCandidate(
                        JSON.parse(warp.iceCallerCandidates[countIceCallerCandidates]))

                    // @DEBUG
                    // console.log('@warp.iceCallerCandidates Changed >> ')
                    //     warp.iceCallerCandidates[countIceCallerCandidates])

                    countIceCallerCandidates++
                }
            }

            // iceCalleeCandidates
            if (warp.iceCalleeCandidates &&
                (JSON.stringify(warp.iceCalleeCandidates) !== cacheMap.get('iceCalleeCandidates'))) {
                
                cacheMap.set('iceCalleeCandidates', JSON.stringify(warp.iceCalleeCandidates))

                // need to be set only on caller
                if (this.callerOrCallee === 'CALLER') {

                    this.host.iceCalleeCandidates = new RTCIceCandidate(
                        JSON.parse(warp.iceCalleeCandidates[countIceCalleeCandidates]))
    
                    // @DEBUG
                    // console.log('@warp.iceCalleeCandidates Changed >> ')
                    //      warp.iceCalleeCandidates[countIceCalleeCandidates])
    
                    countIceCalleeCandidates++
                }

            }

            // callerFiles
            if (warp.callerFiles &&
                (JSON.stringify(warp.callerFiles) !== cacheMap.get('callerFiles'))) {

                // @DEBUG
                console.log(`@warp.callerFiles >> `, warp.callerFiles)

                cacheMap.set('callerFiles', JSON.stringify(warp.callerFiles))

                // need to be set only on callee
                if (this.callerOrCallee === 'CALLEE') {
                    this.host.callerFiles = warp.callerFiles
                }
            }

            // calleeFiles
            if (warp.calleeFiles &&
                (JSON.stringify(warp.calleeFiles) !== cacheMap.get('calleeFiles'))) {

                // @DEBUG
                console.log(`@warp.calleeFiles >> `, warp.calleeFiles)

                cacheMap.set('calleeFiles', JSON.stringify(warp.calleeFiles))

                // need to be set only on caller
                if (this.callerOrCallee === 'CALLER') {
                    this.host.calleeFiles = warp.calleeFiles
                }
            }

        })
    }


    async cleanWarp (warpId) {
        const docRef = doc(this.firestore, 'warps', warpId)
        await deleteDoc(docRef)
    }

    addIceCandidate (iceCandidate) {
        const warpRef = doc(this.firestore, 'warps', this.warpId)

        // add to caller signaling
        if (this.callerOrCallee === 'CALLER') {

            updateDoc(warpRef, {
                iceCallerCandidates: arrayUnion(JSON.stringify(iceCandidate))
            }).catch(error => {
                console.log('@FIRE-CTR >> Error ', error)
            })

        }

        // add to callee signaling
        if (this.callerOrCallee === 'CALLEE') {

            updateDoc(warpRef, {
                iceCalleeCandidates: arrayUnion(JSON.stringify(iceCandidate))
            }).catch(error => {
                console.log('@FIRE-CTR >> Error ', error)
            })

        }

    }

}