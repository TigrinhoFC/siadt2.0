import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"


const firebaseConfig = {
  apiKey: "AIzaSyA32cijdZtQkiBtUgDdIDHiFzUd2UEGKog",
  authDomain: "projetofinal-siadt.firebaseapp.com",
  databaseURL: "https://projetofinal-siadt-default-rtdb.firebaseio.com",
  projectId: "projetofinal-siadt",
  storageBucket: "projetofinal-siadt.firebasestorage.app",
  messagingSenderId: "912739144536",
  appId: "1:912739144536:web:fc96e1e791cdd5892dcb2d"
};


export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);