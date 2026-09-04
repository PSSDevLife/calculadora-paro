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

export function renderizarFilaPago(tbody, num, fecha = "", importe = "") {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 transition fila-pago";
  tr.innerHTML = `
    <td class="p-2.5 text-slate-400 font-mono idx-pago">${num}</td>
    <td class="p-2.5"><input type="text" value="${fecha}" placeholder="dd/mm/aaaa" class="input-fecha w-28 p-1 border border-slate-300 rounded text-xs"></td>
    <td class="p-2.5"><input type="number" step="0.01" value="${importe}" placeholder="0.00" class="input-importe w-28 p-1 border border-slate-300 rounded text-xs font-bold text-slate-900"></td>
    <td class="p-2.5 text-slate-800 font-bold col-dias">-</td>
    <td class="p-2.5 col-tramo">-</td>
    <td class="p-2.5 text-center">
      <button class="btn-eliminar-pago text-slate-400 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded transition">✕</button>
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
      <div class="flex items-center gap-2 bg-slate-800 rounded-lg pl-1 pr-3 py-1">
        <img src="${usuario.photoURL || 'https://via.placeholder.com/30'}" alt="Perfil" class="w-7 h-7 rounded-full border border-slate-600">
        <div class="flex flex-col">
          <span class="text-[10px] text-slate-300 font-bold leading-tight">${usuario.displayName}</span>
          <button id="btnCerrarSesion" class="text-[9px] text-slate-400 hover:text-white text-left leading-tight transition">Cerrar Sesión</button>
        </div>
      </div>
    `;
  } else {
    contenedorAuth.innerHTML = `
      <button id="btnIniciarSesion" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
        Acceder
      </button>
    `;
  }
}
