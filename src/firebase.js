// firebase.js
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCBA0aG74XQJBm2E9pDXnzG2vS2ATrE2CQ",
    authDomain: "familyincome-e173c.firebaseapp.com",
    projectId: "familyincome-e173c",
    storageBucket: "familyincome-e173c.appspot.com",
    messagingSenderId: "592719490219",
    appId: "1:592719490219:web:be9c36dba19975cbc41bee",
    measurementId: "G-4P3G6FM23D"
};

if (!firebase.apps.length) {
  console.log("Initializing Firebase...");
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase Initialized!");
}

export { auth, firebase };
