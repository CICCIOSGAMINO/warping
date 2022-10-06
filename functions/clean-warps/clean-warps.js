// cleanWarps - Cloud Function v0.4.0 - 06-10-2022
//
// Google Cloud Function to clear the inactive warps
import * as functions from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { 
    getFirestore,
    Timestamp
} from 'firebase-admin/firestore'

const app = initializeApp()
const db = getFirestore()

// Zurich region - europe-west6
const region = 'europe-west6'

const cleanWarps =
    functions
        .runWith({ memory: '256MB', timeoutSeconds: 10 })
        .region(region)
        .pubsub
        // .schedule('every 12 hours')
        .schedule('every 1 hours')
        .onRun(async (context) => {
            
            // get now timestamp in seconds
            const now = Timestamp.now().seconds
            
            // window, older than 24 hour
            // const windowInterval = Math.floor(now - 86400)

            // @DEBUG older then 10 minutes
            const windowInterval = Math.floor(now - 600)
        
            // @DEBUG
            // console.log(`@TIMESERVER >> `, now)
            //console.log('@WINDOW >> ', windowInterval)

            // create a query against the collection
            db.collection('warps').where('ts', '<', windowInterval).get()
                    .then(querySnapshot => {
                        querySnapshot.forEach(async (warp) => {
                            // doc.data() never undefined
                            if (warp.id === '--dev--') return

                            // delete the item's collections
                            const callerCandidates =
                                await db.collection('warps').doc(`${warp.id}`).collection('callerCandidates').get()
                            const calleeCandidates =
                                await db.collection('warps').doc(`${warp.id}`).collection('calleeCandidates').get()

                            // @DEBUG
                            callerCandidates.docs.map(doc => console.log(doc))
                            // calleeCandidates.docs.map(doc => doc.delete())        

                            // delete the warp doc
                            warp.ref.delete()
                        })
                    })

            return null
        })

export { cleanWarps }