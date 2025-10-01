import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyDlYY6AiVDm_oMp8WDmaNR-iR8Cx0X3HH0",
  authDomain: "athlete-4c975.firebaseapp.com",
  databaseURL: "https://athlete-4c975-default-rtdb.firebaseio.com",
  projectId: "athlete-4c975",
  storageBucket: "athlete-4c975.appspot.com",
  messagingSenderId: "1012046041407",
  appId: "1:1012046041407:web:4939a7f92615ce8d70438a",
  measurementId: "G-MKSPH24DTC"
};

firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.database();
export default firebase;