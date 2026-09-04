// storage.js
import { auth, db, doc, setDoc, getDoc } from "./firebase-setup.js";

const datosPorDefecto = {
  brd: 0,
  diasCotizados: 0,
  hijos: 0,
  diasPerdidos: 0,
  pagos: []
};

// Guarda los datos SOLO en la nube si hay sesión. 
export async function guardarDatos(datos) {
  if (auth && auth.currentUser && db) {
    try {
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      await setDoc(userDocRef, { 
        datosCalculadora: datos,
        ultimaActualizacion: new Date().toISOString()
      }, { merge: true });
      return true; // Éxito en la nube
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      return false;
    }
  }
  return false; // No hay usuario, no se guarda
}

// Carga los datos de la nube. Si no hay usuario, devuelve los por defecto.
export async function cargarDatos() {
  if (auth && auth.currentUser && db) {
    try {
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().datosCalculadora) {
        return docSnap.data().datosCalculadora;
      }
    } catch (error) {
      console.error("Error cargando de Firebase:", error);
    }
  }

  // Fallback a defecto si no hay usuario o hay error
  return datosPorDefecto;
}

export function obtenerDatosPorDefecto() {
  return datosPorDefecto;
}
