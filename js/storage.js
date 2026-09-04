// storage.js
import { auth, db, doc, setDoc, getDoc } from "./firebase-setup.js";

const datosPorDefecto = {
  brd: 61.44,
  diasCotizados: 1040,
  hijos: 0,
  diasPerdidos: 42,
  pagos: [
    { fecha: "10/11/2025", importe: 492.22 },
    { fecha: "10/12/2025", importe: 1135.90 },
    { fecha: "12/01/2026", importe: 1135.90 },
    { fecha: "10/03/2026", importe: 378.41 },
    { fecha: "10/04/2026", importe: 1135.60 },
    { fecha: "11/05/2026", importe: 1087.96 },
    { fecha: "10/06/2026", importe: 508.25 },
    { fecha: "10/07/2026", importe: 372.72 },
    { fecha: "10/08/2026", importe: 1219.81 }
  ]
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
