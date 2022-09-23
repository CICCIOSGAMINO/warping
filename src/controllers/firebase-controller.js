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
} from 'firebase/firestore'

import {
    initializeAppCheck,
    ReCaptchaV3Provider
} from 'firebase/app-check'

const firebaseConfig = {
    apiKey: "AIzaSyCDM8TRwQtqghP8tSW49To6ReHGVUEKb24",
    authDomain: "warping-web.firebaseapp.com",
    projectId: "warping-web",
    storageBucket: "warping-web.appspot.com",
    messagingSenderId: "541753786981",
    appId: "1:541753786981:web:f114f5c3fd0ac00fe1bc8c",
    measurementId: "G-2MG098EL2Z"
  }

const firestoreConfig = {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
}

export class FirebaseController {

    constructor (host) {
            
        (this.host = host).addController(this)

        this.initFirebaseApp()
        // this.initAppCheck()
        this.initFirestore()

        this.callerOrCallee = ''

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
                provider: new ReCaptchaV3Provider('6LcFt70gAAAAAGKNTa4dak_jaiavdx1hEwb66C19'),
                isTokenAutoRefreshEnabled: true
            }
        )
    }

    initFirestore () {
        this.firestore = getFirestore(
            this.app
        )
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

    async initWarp () {
        const warpObj = {
            // Add the ts field
            ts: Timestamp.now()
        }
        const newWarp = await addDoc(
            this.warpsCollection,
            warpObj)
        
        return newWarp
    }

    async setCalleeFileInfo (warpId, fileInfo) {

        if (!fileInfo || !warpId) return

        const filesPath = `warps/${warpId}/calleeFiles`

        await addDoc(
            collection(this.firestore, filesPath),
            fileInfo
        )
    }

    async calleeFilesChanges (warpId, callback) {
        const filesPath = `warps/${warpId}/calleeFiles`

        const unsubscribe = onSnapshot(
            query(collection(this.firestore, filesPath)),
            callback)
    }

    async setCallerFileInfo (warpId, fileInfo) {

        if (!fileInfo || !warpId) return

        const filesPath = `warps/${warpId}/callerFiles`

        await addDoc(
            collection(this.firestore, filesPath),
            fileInfo
        )
    }

    async callerFilesChanges (warpId, callback) {
        const filesPath = `warps/${warpId}/callerFiles`

        const unsubscribe = onSnapshot(
            query(collection(this.firestore, filesPath)),
            callback)
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