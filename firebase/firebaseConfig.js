import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_sA_ChTbgVV8xB9fZAEOuC-DTXSWElnk",
  authDomain: "aiengpro.firebaseapp.com",
  projectId: "aiengpro",
  storageBucket: "aiengpro.firebasestorage.app",
  messagingSenderId: "209834977658",
  appId: "1:209834977658:web:44685026093be9f6cccec3",
  measurementId: "G-N2KJ3KQZ1D",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { auth, db };
