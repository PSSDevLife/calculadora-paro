// ui.js
// Contiene funciones para actualizar el DOM y animaciones visuales

let temporizadorToast = null;

export function mostrarNotificacionToast() {
  const toast = document.getElementById("toastNotificacion");
  if (!toast) return;

  toast.classList.remove("translate-x-72", "opacity-0");
  toast.classList.add("translate-x-0", "opacity-100");

  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => {
    toast.classList.remove("translate-x-0", "opacity-100");
    toast.classList.add("translate-x-72", "opacity-0");
  }, 1500);
}

function generarOpcionesMes(mesSeleccionado) {
  const meses = [
    { num: "01", nombre: "Ene" }, { num: "02", nombre: "Feb" }, { num: "03", nombre: "Mar" },
    { num: "04", nombre: "Abr" }, { num: "05", nombre: "May" }, { num: "06", nombre: "Jun" },
    { num: "07", nombre: "Jul" }, { num: "08", nombre: "Ago" }, { num: "09", nombre: "Sep" },
    { num: "10", nombre: "Oct" }, { num: "11", nombre: "Nov" }, { num: "12", nombre: "Dic" }
  ];
  return meses.map(m => `<option value="${m.num}" ${m.num === mesSeleccionado ? 'selected' : ''}>${m.nombre}</option>`).join('');
}

function generarOpcionesAño(añoSeleccionado) {
  const añoActual = new Date().getFullYear();
  let opciones = '';
  for (let i = añoActual - 1; i <= añoActual + 3; i++) {
    opciones += `<option value="${i}" ${i.toString() === añoSeleccionado ? 'selected' : ''}>${i}</option>`;
  }
  return opciones;
}

export function renderizarFilaPago(tbody, num, fecha = "", importe = "") {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/80 transition fila-pago border-b border-slate-100 dark:border-slate-800/50 last:border-0";
  
  // Extraer mes y año de la fecha (formato YYYY-MM)
  let mesSel = "";
  let añoSel = "";
  if (fecha && fecha.includes("-")) {
    [añoSel, mesSel] = fecha.split("-");
  } else {
    const hoy = new Date();
    añoSel = hoy.getFullYear().toString();
    mesSel = String(hoy.getMonth() + 1).padStart(2, '0');
  }

  tr.innerHTML = `
    <td class="p-2 md:p-3 text-slate-500 dark:text-slate-400 font-mono idx-pago text-center font-bold">${num}</td>
    <td class="p-2 md:p-3">
      <div class="flex gap-1.5 min-w-[130px]">
        <select class="input-mes flex-1 p-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-colors shadow-sm">
          ${generarOpcionesMes(mesSel)}
        </select>
        <select class="input-año flex-1 p-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-colors shadow-sm">
          ${generarOpcionesAño(añoSel)}
        </select>
      </div>
    </td>
    <td class="p-2 md:p-3">
      <div class="relative">
        <input type="number" step="0.01" value="${importe}" placeholder="0.00" class="input-importe w-full min-w-[90px] p-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none pr-7 bg-white dark:bg-slate-700 transition-colors shadow-sm">
        <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs font-bold pointer-events-none">€</span>
      </div>
    </td>
    <td class="p-2 md:p-3 text-slate-800 dark:text-slate-200 font-black col-dias text-center">-</td>
    <td class="p-2 md:p-3 col-tramo text-center">-</td>
    <td class="p-2 md:p-3 text-center">
      <button class="btn-eliminar-pago text-slate-400 dark:text-slate-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 font-bold w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-colors">✕</button>
    </td>
  `;
  tbody.appendChild(tr);
  return tr;
}

export function renumerarPagos(tbody) {
  const filas = tbody.querySelectorAll("tr");
  filas.forEach((f, idx) => {
    const td = f.querySelector(".idx-pago");
    if(td) td.textContent = idx + 1;
  });
}

export function actualizarUIAuth(usuario) {
  const contenedorAuth = document.getElementById("contenedorAuth");
  const alertaNoLogin = document.getElementById("alertaNoLogin");
  
  if (alertaNoLogin) {
    if (usuario) {
      alertaNoLogin.classList.add("hidden");
    } else {
      alertaNoLogin.classList.remove("hidden");
    }
  }

  if (!contenedorAuth) return;

  if (usuario) {
    contenedorAuth.innerHTML = `
      <div class="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl pl-1.5 pr-4 py-1.5 transition-colors">
        <img src="${usuario.photoURL || 'https://via.placeholder.com/30'}" alt="Perfil" class="w-7 h-7 rounded-full border border-slate-600 shadow-sm">
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-200 font-bold leading-tight">${usuario.displayName}</span>
          <button id="btnCerrarSesion" class="text-[9px] text-slate-400 hover:text-rose-400 text-left leading-tight transition-colors font-medium">Cerrar Sesión</button>
        </div>
      </div>
    `;
  } else {
    contenedorAuth.innerHTML = `
      <button id="btnIniciarSesion" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-900/20 border border-blue-500">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
        Acceder
      </button>
    `;
  }
}
