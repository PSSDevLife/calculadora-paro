// firebase-setup.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

let app, auth, db, provider;

try {
  // Inicializamos Firebase solo si la configuración parece válida (no es la de por defecto)
  if (firebaseConfig.apiKey !== "TU_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
  } else {
    console.warn("Firebase no está configurado. La app funcionará en modo local (sin nube).");
  }
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

export { auth, db, provider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc };
