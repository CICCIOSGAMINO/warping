// cleanWarps function v0.0.1
import * as functions from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { 
    getFirestore,
    FieldValue,
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
        .schedule('every 12 hours')
        .onRun(async (context) => {

            // server ts in millis (24 hours)
            // const windowInterval = Timestamp.now() - (86400 * 1000)
            
            // get now timestamp in seconds
            const now = Timestamp.now().seconds
            
            // debug window, older than 24 hour
            const windowInterval =
                Math.floor(now - 86400)
        
            // @DEBUG
            console.log(`@TIMESERVER >> `, now)
            console.log('@WINDOW >> ', windowInterval)

            // create a query against the collection
            const query =
                await db.collection('warps').where('ts', '<', windowInterval).get()
                    .then(querySnapshot => {
                        querySnapshot.forEach((doc) => {
                            // doc.data() never undefined
                            if (doc.id === '--test--') return
                            
                            doc.map((val) => val.delete())
                        })
                    })

            // const querySnapshot = await getDocs(queryRef)
            // querySnapshot.forEach((doc) => {
            //     // doc.data() never undefined
            //     if (doc.id === '--test--') return
                
            //     doc.map((val) => val.delete())
            // })

            // WORKING
            // db.collection('warps').listDocuments()
            //     .then(val => {
            //         // if
            //         val
            //         val.map((val) => val.delete())
            //     })

            return null
        })

export { cleanWarps }