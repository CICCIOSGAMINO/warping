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

let callerOrCallee

export class FirebaseController {

    constructor (host) {
            
        (this.host = host).addController(this)

        this.initFirebaseApp()
        // this.initAppCheck()
        this.initFirestore()

        // warps collection - where all warps are
        this.warpsCollection = collection(this.firestore, 'warps')
    }

    initFirebaseApp () {
        // Initialize Firebase
        this.app = initializeApp(firebaseConfig)
        this.analytics = getAnalytics(this.app)
    }

    initAppCheck () {
        this.appCheck = initializeAppCheck(
            this.app,
            // // Pass your reCAPTCHA v3 site key (public key) to activate()
            {
                provider: new ReCaptchaV3Provider(RECAPTCHA_V3_PROVIDER),
                isTokenAutoRefreshEnabled: true
            }
        )
    }

    initFirestore () {
        this.firestore = getFirestore(
            this.app
        )
    }

    initCallerOrCallee (calOrCale) {
        callerOrCallee = calOrCale
    }
    
    hostConnected () {
	    this.host.requestUpdate()
    }

    hostDisconnected () {
        this.consoleLog('@FIREBASE-CTR >> Disconnected from Controller')
    }

    hostUpdated () {
        this.consoleLog('@FIREBASE-CTR >> Updated by Controller')
    }

    // wrapper triggered by debug variable
    consoleLog (text) {
        if (!this.host.debug) return
        console.log(text)
    }

    // get the type CALLER | CALLEE
    getCallType () {
        return callerOrCallee
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

    async setFileInfo (warpId, fileInfo) {

        if (!fileInfo || !warpId) return
        if (callerOrCallee !== 'CALLER' && callerOrCallee !== 'CALLEE') return

        let callerOrCalleeFilePath
        const docRef = doc(this.firestore, 'warps', warpId)

        if (callerOrCallee === 'CALLER') {

            await updateDoc(docRef, {
                callerFiles: arrayUnion(fileInfo)
            })
        }

        if (callerOrCallee === 'CALLEE') {

            await updateDoc(docRef, {
                calleeFiles: arrayUnion(fileInfo)
            })
        }

    }

    // await that fileInfo are ready in the application
    async getFileInfo (warpId) {
        const docRef = doc(this.firestore, 'warps', warpId)
        await getDoc(docRef)
    }

    async addOfferToWarp (warpId, warpOffer) {

        if (!warpOffer || !warpId) return

        const docRef = doc(this.firestore, 'warps', warpId)
        await updateDoc(docRef, warpOffer)
    }

    async addAnswerToWarp (warpId, warpAnswer) {
        const docRef = doc(this.firestore, 'warps', warpId)
        await updateDoc(docRef, warpAnswer)
    }

    warpChanged (warpId, callback) {
        const docRef = doc(this.firestore, 'warps', warpId)
        onSnapshot(docRef, callback)
    }

    async getWarp (warpId) {
        const docRef = doc(this.firestore, 'warps', warpId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return docSnap.data()
        } else {
            return undefined
        }
    }

    async cleanWarp (warpId) {
        const docRef = doc(this.firestore, 'warps', warpId)
        await deleteDoc(docRef)
    }

    async callerAddIceCandidate (warpId, iceCallerCandidate) {

        const callerPath = `warps/${warpId}/callerCandidates`

        await addDoc(
            collection(this.firestore, callerPath),
            iceCallerCandidate
        )
    }

    callerIceCandidateChanges (warpId, callback) {

        const callerPath = `warps/${warpId}/callerCandidates`

        const unsubscribe = onSnapshot(
            query(collection(this.firestore, callerPath)),
            callback)
    }

    async calleeAddIceCandidate (warpId, iceCalleeCandidate) {

        const calleePath = `warps/${warpId}/calleeCandidates`
        
        await addDoc(
            collection(this.firestore, calleePath),
            iceCalleeCandidate
        )
    }

    calleeIceCandidateChanges (warpId, callback) {

        const calleePath = `warps/${warpId}/calleeCandidates`

        const unsubscribe = onSnapshot(
            query(collection(this.firestore, calleePath)),
            callback)
    }

}