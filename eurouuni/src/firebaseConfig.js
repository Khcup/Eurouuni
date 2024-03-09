import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-f1yUyy447cwj7qxCikUna512nAIzquc",
  authDomain: "eurouuni-592c6.firebaseapp.com",
  databaseURL: "https://eurouuni-592c6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eurouuni-592c6",
  storageBucket: "eurouuni-592c6.appspot.com",
  messagingSenderId: "841016645103",
  appId: "1:841016645103:web:1e5b392c565b3f3ecb121a",
  measurementId: "G-3LHL4MZ938"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

export default firebaseConfig;