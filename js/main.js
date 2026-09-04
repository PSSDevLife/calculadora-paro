// main.js
import { obtenerDiasDerecho, obtenerTopesLegales, estimarTipoIRPF, deducirIRPFDePagos } from "./calculator.js";
import { guardarDatos, cargarDatos, obtenerDatosPorDefecto } from "./storage.js";
import { mostrarNotificacionToast, renderizarFilaPago, renumerarPagos, actualizarUIAuth } from "./ui.js";
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged } from "./firebase-setup.js";

// DOM Elements
const formElements = {
  brd: document.getElementById("brd"),
  diasCotizados: document.getElementById("diasCotizados"),
  hijos: document.getElementById("hijos"),
  diasPerdidos: document.getElementById("diasPerdidos")
};

const tbodyPagos = document.getElementById("cuerpoTablaPagos");
const btnAgregarPago = document.getElementById("btnAgregarPago");
const btnVaciar = document.getElementById("btnVaciar");

// State
let isAuthReady = false;

// Initialize
async function inicializar() {
  // Lógica del modo oscuro
  const btnTema = document.getElementById('btnTema');
  const iconoSol = document.getElementById('iconoSol');
  const iconoLuna = document.getElementById('iconoLuna');

  function actualizarIconos() {
    if (document.documentElement.classList.contains('dark')) {
      iconoSol.classList.remove('hidden');
      iconoLuna.classList.add('hidden');
    } else {
      iconoSol.classList.add('hidden');
      iconoLuna.classList.remove('hidden');
    }
  }

  btnTema.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
      localStorage.setItem('color-theme', 'dark');
    } else {
      localStorage.setItem('color-theme', 'light');
    }
    actualizarIconos();
  });
  actualizarIconos();

  // Escuchar estado de autenticación
  if (auth) {
    onAuthStateChanged(auth, async (user) => {
      actualizarUIAuth(user);
      configurarEventosAuth();
      
      // Solo cargamos datos de la nube cuando la app carga por primera vez
      if (!isAuthReady) {
        isAuthReady = true;
        const datos = await cargarDatos();
        pintarDatosEnUI(datos);
        calcularTodo();
      }
    });
  } else {
    // Modo sin configuración (error)
    isAuthReady = true;
    const datos = obtenerDatosPorDefecto();
    pintarDatosEnUI(datos);
    calcularTodo();
    actualizarUIAuth(null);
  }

  configurarEventosBasicos();
}

function configurarEventosAuth() {
  const btnIn = document.getElementById("btnIniciarSesion");
  const btnOut = document.getElementById("btnCerrarSesion");
  
  if (btnIn) {
    btnIn.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, provider);
        location.reload(); 
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
      }
    });
  }
  
  if (btnOut) {
    btnOut.addEventListener("click", async () => {
      try {
        await signOut(auth);
        location.reload();
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }
}

function configurarEventosBasicos() {
  // Inputs del formulario
  Object.values(formElements).forEach(el => {
    el.addEventListener("input", manejarCambioDatos);
    el.addEventListener("change", manejarCambioDatos); // Para el select
  });

  // Botones
  btnAgregarPago.addEventListener("click", () => {
    const tr = renderizarFilaPago(tbodyPagos, tbodyPagos.children.length + 1);
    enlazarEventosFila(tr);
    manejarCambioDatos();
  });

  btnVaciar.addEventListener("click", () => {
    tbodyPagos.innerHTML = "";
    manejarCambioDatos();
  });
}

function enlazarEventosFila(tr) {
  const inputs = tr.querySelectorAll("input, select");
  inputs.forEach(input => {
    input.addEventListener("input", manejarCambioDatos);
    input.addEventListener("change", manejarCambioDatos);
  });
  
  const btnEliminar = tr.querySelector(".btn-eliminar-pago");
  btnEliminar.addEventListener("click", () => {
    tr.remove();
    renumerarPagos(tbodyPagos);
    manejarCambioDatos();
  });
}

function pintarDatosEnUI(datos) {
  formElements.brd.value = datos.brd !== undefined ? datos.brd : 0;
  formElements.diasCotizados.value = datos.diasCotizados !== undefined ? datos.diasCotizados : 0;
  formElements.hijos.value = datos.hijos !== undefined ? datos.hijos : 0;
  formElements.diasPerdidos.value = datos.diasPerdidos !== undefined ? datos.diasPerdidos : 0;

  tbodyPagos.innerHTML = "";
  if (datos.pagos && datos.pagos.length > 0) {
    datos.pagos.forEach(p => {
      const tr = renderizarFilaPago(tbodyPagos, tbodyPagos.children.length + 1, p.fecha, p.importe);
      enlazarEventosFila(tr);
    });
  } else {
    const tr = renderizarFilaPago(tbodyPagos, 1);
    enlazarEventosFila(tr);
  }
}

async function manejarCambioDatos() {
  if (!isAuthReady) return;
  
  calcularTodo();
  
  const datosActuales = extraerDatosDeUI();
  const exito = await guardarDatos(datosActuales);
  
  if (exito) {
    mostrarNotificacionToast();
  }
}

function extraerDatosDeUI() {
  const pagos = [];
  tbodyPagos.querySelectorAll("tr").forEach(fila => {
    const mes = fila.querySelector(".input-mes") ? fila.querySelector(".input-mes").value : "";
    const año = fila.querySelector(".input-año") ? fila.querySelector(".input-año").value : "";
    const importe = fila.querySelector(".input-importe") ? fila.querySelector(".input-importe").value : "";
    
    if (mes !== "" && año !== "" && importe !== "") {
      const fecha = `${año}-${mes}`;
      pagos.push({ fecha, importe: parseFloat(importe) || 0 });
    }
  });

  return {
    brd: parseFloat(formElements.brd.value) || 0,
    diasCotizados: parseInt(formElements.diasCotizados.value) || 0,
    hijos: parseInt(formElements.hijos.value) || 0,
    diasPerdidos: parseInt(formElements.diasPerdidos.value) || 0,
    pagos: pagos
  };
}

function calcularTodo() {
  const datos = extraerDatosDeUI();
  const importes = datos.pagos.map(p => p.importe);
  
  const deduccion = deducirIRPFDePagos(datos.brd, importes);
  let pctIrpfNum = 0;

  if (deduccion.detectado) {
    pctIrpfNum = deduccion.porcentaje;
    document.getElementById("irpfDisplay").value = `${pctIrpfNum.toFixed(2)} %`;
    document.getElementById("irpfTag").textContent = `Deducido de tus nóminas`;
  } else if (datos.brd > 0) {
    const brutoAnual = datos.brd * 360 * 0.70;
    pctIrpfNum = estimarTipoIRPF(brutoAnual, datos.hijos);
    document.getElementById("irpfDisplay").value = `${pctIrpfNum.toFixed(2)} %`;
    document.getElementById("irpfTag").textContent = `Estimado AEAT (${datos.hijos} hijos)`;
  } else {
    document.getElementById("irpfDisplay").value = `0.00 %`;
    document.getElementById("irpfTag").textContent = `Pendiente de datos`;
  }

  const pctIrpf = pctIrpfNum / 100;
  const cuotaSS_diaria = datos.brd * 0.047;
  const diasDerechoTotal = obtenerDiasDerecho(datos.diasCotizados);

  const topes = obtenerTopesLegales(datos.hijos);
  const alertaDiv = document.getElementById("alertaTope");
  alertaDiv.innerHTML = `<span>ℹ️ Referencia legal SEPE para <strong>${datos.hijos} hijos</strong>: Mínimo <strong>${topes.min.toFixed(2)} €/mes</strong> | Máximo orientativo <strong>${topes.max.toFixed(2)} €/mes</strong>.</span><span class="font-semibold text-[10px] bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">Informativo</span>`;

  const bruto1 = datos.brd * 0.70;
  const neto1 = Math.max(0, bruto1 - cuotaSS_diaria - (bruto1 * pctIrpf));

  const bruto2 = datos.brd * 0.60;
  const neto2 = Math.max(0, bruto2 - cuotaSS_diaria - (bruto2 * pctIrpf));

  document.getElementById("resumenTramos").innerHTML = `
    <div class="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-4 rounded-2xl shadow-sm transition-colors">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Tramo 1 (Días 1 al 180 - 70%)</span>
        <span class="text-[10px] font-semibold bg-white dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800/50">Bruto: ${bruto1.toFixed(2)} €/d</span>
      </div>
      <p class="text-xl md:text-2xl font-black text-blue-950 dark:text-blue-100 mt-2">${neto1.toFixed(2)} € <span class="text-sm font-bold text-blue-700/50 dark:text-blue-400/50">/ día neto</span></p>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Mes tipo (30 d): ${(neto1 * 30).toFixed(2)} € | SS: ${(cuotaSS_diaria * 30).toFixed(2)} € | IRPF: ${(bruto1 * 30 * pctIrpf).toFixed(2)} €</p>
    </div>

    <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl shadow-sm transition-colors">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tramo 2 (Día 181 en adelante - 60%)</span>
        <span class="text-[10px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">Bruto: ${bruto2.toFixed(2)} €/d</span>
      </div>
      <p class="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">${neto2.toFixed(2)} € <span class="text-sm font-bold text-slate-500/50 dark:text-slate-400/50">/ día neto</span></p>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Mes tipo (30 d): ${(neto2 * 30).toFixed(2)} € | SS: ${(cuotaSS_diaria * 30).toFixed(2)} € | IRPF: ${(bruto2 * 30 * pctIrpf).toFixed(2)} €</p>
    </div>
  `;

  let diasCobradosAcum = 0;
  let totalEurosCobrados = 0;

  tbodyPagos.querySelectorAll("tr").forEach(fila => {
    const impInput = fila.querySelector(".input-importe");
    const imp = impInput ? parseFloat(impInput.value) || 0 : 0;
    totalEurosCobrados += imp;

    if (imp <= 0 || neto1 <= 0) {
      if (fila.querySelector(".col-dias")) fila.querySelector(".col-dias").textContent = `-`;
      if (fila.querySelector(".col-tramo")) fila.querySelector(".col-tramo").textContent = `-`;
      return;
    }

    const diasTotalesPrevios = diasCobradosAcum + datos.diasPerdidos;
    let diasFila = 0;
    let detalleTramo = "";

    if (diasTotalesPrevios < 180) {
      const diasRestantesT1 = 180 - diasTotalesPrevios;
      const dineroMaxT1 = diasRestantesT1 * neto1;

      if (imp > dineroMaxT1 + 10) {
        const d1_entero = Math.round(diasRestantesT1);
        let d2_calc = neto2 > 0 ? ((imp - dineroMaxT1) / neto2) : 0;
        let d2_entero = Math.round(d2_calc);

        if (d1_entero + d2_entero === 29 && imp > 1050) {
          d2_entero = 30 - d1_entero;
        }

        diasFila = d1_entero + d2_entero;
        detalleTramo = `<span class="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[11px] border border-amber-300">Mixto (${d1_entero}d al 70% + ${d2_entero}d al 60%)</span>`;
      } else {
        diasFila = Math.round(imp / neto1);
        detalleTramo = `<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">70%</span>`;
      }
    } else {
      diasFila = Math.round(imp / neto2);
      detalleTramo = `<span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[11px]">60%</span>`;
    }

    if (fila.querySelector(".col-dias")) fila.querySelector(".col-dias").textContent = `${diasFila} días`;
    if (fila.querySelector(".col-tramo")) fila.querySelector(".col-tramo").innerHTML = detalleTramo;

    diasCobradosAcum += diasFila;
  });

  const diasCobradosTotal = Math.round(diasCobradosAcum);
  const dineroPerdidoEstimado = datos.diasPerdidos * neto1;
  const diasConsumidosTotales = diasCobradosTotal + datos.diasPerdidos;
  const diasRestantes = Math.max(0, diasDerechoTotal - diasConsumidosTotales);

  let eurosTotalesBolsa = 0;
  if (diasDerechoTotal <= 180) {
    eurosTotalesBolsa = diasDerechoTotal * neto1;
  } else {
    eurosTotalesBolsa = (180 * neto1) + ((diasDerechoTotal - 180) * neto2);
  }

  // Corregimos el cálculo: lo que queda es el total menos lo ya cobrado y lo perdido
  const eurosRestantes = Math.max(0, eurosTotalesBolsa - totalEurosCobrados - dineroPerdidoEstimado);

  document.getElementById("resumenEurosTotalBolsa").textContent = `${eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("txtBolsaDineroTotal").textContent = `${eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("resumenDiasDerecho").textContent = `${diasDerechoTotal} días concedidos`;

  document.getElementById("resumenEurosCobrados").textContent = `${totalEurosCobrados.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("resumenDiasCobrados").textContent = `${diasCobradosTotal} días cobrados`;

  document.getElementById("resumenEurosRestantes").textContent = `${eurosRestantes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("resumenDiasRestantes").textContent = `${diasRestantes} días pendientes`;

  document.getElementById("resumenEurosPerdidos").textContent = `${dineroPerdidoEstimado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("resumenDiasPerdidos").textContent = `${datos.diasPerdidos} días perdidos`;

  const pctDineroCobrado = eurosTotalesBolsa > 0 ? Math.min(100, (totalEurosCobrados / eurosTotalesBolsa) * 100) : 0;
  const pctDineroPerdido = eurosTotalesBolsa > 0 ? Math.min(100 - pctDineroCobrado, (dineroPerdidoEstimado / eurosTotalesBolsa) * 100) : 0;
  const pctDineroRestante = Math.max(0, 100 - pctDineroCobrado - pctDineroPerdido);

  document.getElementById("txtDineroCobradoBarra").textContent = `${totalEurosCobrados.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("txtDineroTotalBarra").textContent = `${eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  document.getElementById("txtPorcentajeDinero").textContent = `${pctDineroCobrado.toFixed(1)}% cobrado`;

  document.getElementById("barraCobradaDinero").style.width = `${pctDineroCobrado}%`;
  document.getElementById("barraPerdidaDinero").style.width = `${pctDineroPerdido}%`;
  document.getElementById("barraRestanteDinero").style.width = `${pctDineroRestante}%`;

  document.getElementById("tagPctCobrado").textContent = `${pctDineroCobrado.toFixed(1)}%`;
  document.getElementById("tagPctPerdido").textContent = `${pctDineroPerdido.toFixed(1)}%`;
  document.getElementById("tagPctRestante").textContent = `${pctDineroRestante.toFixed(1)}%`;
}

window.onload = inicializar;
