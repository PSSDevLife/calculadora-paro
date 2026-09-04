// storage.js
import { auth, db, doc, setDoc, getDoc } from "./firebase-setup.js";

const CLAVE_STORAGE = "sepe_calculadora_datos_v1";

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

// Guarda los datos. Si el usuario está autenticado, los guarda en Firestore; si no, en localStorage
export async function guardarDatos(datos) {
  // Siempre guardamos en local como respaldo
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));

  // Si hay usuario logueado en Firebase, guardamos en la nube
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
  return true; // Éxito local
}

// Carga los datos. Si hay usuario, intenta traerlos de la nube. Si no, usa local o por defecto.
export async function cargarDatos() {
  if (auth && auth.currentUser && db) {
    try {
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().datosCalculadora) {
        const datosNube = docSnap.data().datosCalculadora;
        // Sincronizar en local
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datosNube));
        return datosNube;
      }
    } catch (error) {
      console.error("Error cargando de Firebase:", error);
    }
  }

  // Fallback a localStorage
  const guardado = localStorage.getItem(CLAVE_STORAGE);
  return guardado ? JSON.parse(guardado) : datosPorDefecto;
}

export function obtenerDatosLocales() {
  const guardado = localStorage.getItem(CLAVE_STORAGE);
  return guardado ? JSON.parse(guardado) : datosPorDefecto;
}

export function importarDatosDeArchivo(contenidoArchivo) {
  try {
    const datos = JSON.parse(contenidoArchivo);
    return datos;
  } catch (err) {
    throw new Error("Formato de archivo inválido");
  }
}

export function crearBlobParaExportar() {
  const datos = localStorage.getItem(CLAVE_STORAGE) || JSON.stringify(datosPorDefecto);
  return new Blob([datos], { type: "application/json" });
}
