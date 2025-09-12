import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDP4nUtj3r91f-5cR75LgjkijUA82oh-CA",
  authDomain: "chatting-app-da6a8.firebaseapp.com",
  projectId: "chatting-app-da6a8",
  storageBucket: "chatting-app-da6a8.appspot.com",
  messagingSenderId: "365616747733",
  appId: "1:365616747733:web:0f259b8b4099a37858be5c",
  measurementId: "G-6YFC91ZXFN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);