// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA_SBO7svvrbLUespoRk30k20t7rX7mNXk',
  authDomain: 'kaizen-a46b6.firebaseapp.com',
  projectId: 'kaizen-a46b6',
  storageBucket: 'kaizen-a46b6.firebasestorage.app',
  messagingSenderId: '47780114052',
  appId: '1:47780114052:web:4e7712000e7d7bb62bdcd1',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
