// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdH1ZoPSnCQNFiv7uNoYxBqZuqwfb6gxw",
  authDomain: "geneserpg-b21d6.firebaseapp.com",
  databaseURL: "https://geneserpg-b21d6-default-rtdb.firebaseio.com/",
  projectId: "geneserpg-b21d6",
  storageBucket: "geneserpg-b21d6.appspot.com",
  messagingSenderId: "655791317409",
  appId: "1:655791317409:web:07099076d0a9efadd0abe0",
  measurementId: "G-15LDJJGKMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportando os serviços do Firebase para serem usados em outras partes da aplicação
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDB = getDatabase(app);
export const storage = getStorage(app);
