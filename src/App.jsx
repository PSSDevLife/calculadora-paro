import React, { useState, useEffect } from 'react';
// Nota: Puedes importar aquí tu instancia de firebase auth si ya la tienes configurada en tu proyecto:
// import { auth, googleProvider } from '../firebaseConfig';
// import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Estados principales de la app
  const [user, setUser] = useState(null);
  const [brd, setBrd] = useState(61.44);
  const [diasCotizados, setDiasCotizados] = useState(1040);
  const [hijos, setHijos] = useState(0);
  const [diasPerdidos, setDiasPerdidos] = useState(42);
  const [pagos, setPagos] = useState([
    { fecha: "10/11/2025", importe: 492.22 },
    { fecha: "10/12/2025", importe: 1135.90 },
    { fecha: "12/01/2026", importe: 1135.90 },
    { fecha: "10/03/2026", importe: 378.41 },
    { fecha: "10/04/2026", importe: 1135.60 },
    { fecha: "11/05/2026", importe: 1087.96 },
    { fecha: "10/06/2026", importe: 508.25 },
    { fecha: "10/07/2026", importe: 372.72 },
    { fecha: "10/08/2026", importe: 1219.81 }
  ]);

  const [toastVisible, setToastVisible] = useState(false);

  // Simulación de autenticación con Google (Sustituir con Firebase real si procede)
  const handleGoogleLogin = () => {
    // Ejemplo con Firebase Popup:
    // signInWithPopup(auth, googleProvider).catch(err => console.log(err));
    setUser({ displayName: "Usuario de Google", email: "usuario@gmail.com" });
    mostrarToast("¡Sesión iniciada con Google!");
  };

  const handleLogout = () => {
    setUser(null);
    mostrarToast("Sesión cerrada");
  };

  const mostrarToast = (mensaje) => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  // Funciones de cálculo SEPE
  const obtenerDiasDerecho = (cot) => {
    if (cot < 360) return 0;
    if (cot < 540) return 120;
    if (cot < 720) return 180;
    if (cot < 900) return 240;
    if (cot < 1080) return 300;
    if (cot < 1260) return 360;
    if (cot < 1440) return 420;
    if (cot < 1620) return 480;
    if (cot < 1800) return 540;
    if (cot < 1980) return 600;
    if (cot < 2160) return 660;
    return 720;
  };

  const estimarTipoIRPF = (brutoAnual, h) => {
    let limiteExento = 15876;
    if (h === 1) limiteExento = 16342;
    else if (h >= 2) limiteExento = 17565;
    if (brutoAnual <= limiteExento) return 0;

    let gastos = 2000;
    let reduccion = 0;
    if (brutoAnual <= 14047.50) reduccion = 6498;
    else if (brutoAnual <= 19747.50) reduccion = Math.max(0, 6498 - 1.14 * (brutoAnual - 14047.50));

    let baseLiq = Math.max(0, brutoAnual - gastos - reduccion);
    let minPersonal = 5550 + (h >= 1 ? 2400 : 0) + (h >= 2 ? 2700 : 0);

    const calcularCuota = (base) => {
      const tramos = [
        { limite: 12450, tipo: 0.19 },
        { limite: 20200, tipo: 0.24 },
        { limite: 35200, tipo: 0.30 },
        { limite: 60000, tipo: 0.37 },
        { limite: Infinity, tipo: 0.45 }
      ];
      let cuota = 0, rest = base, prev = 0;
      for (let t of tramos) {
        if (rest > 0) {
          let tramo = Math.min(rest, t.limite - prev);
          cuota += tramo * t.tipo;
          rest -= tramo;
          prev = t.limite;
        } else break;
      }
      return cuota;
    };

    let cuota = Math.max(0, calcularCuota(baseLiq) - calcularCuota(minPersonal));
    return Math.max(0, Math.round((cuota / brutoAnual) * 10000) / 100);
  };

  // Detección automática IRPF
  const deducirIRPF = () => {
    if (brd <= 0) return 0;
    const brutoMes1 = brd * 30 * 0.70;
    const cuotaSS_mes = brd * 30 * 0.047;
    for (let p of pagos) {
      if (p.importe > 800 && p.importe <= brutoMes1) {
        let deduccionTotal = brutoMes1 - p.importe;
        let retencionIRPF_mes = deduccionTotal - cuotaSS_mes;
        if (retencionIRPF_mes >= 0) {
          return Math.round(((retencionIRPF_mes / brutoMes1) * 100) * 100) / 100;
        }
      }
    }
    return estimarTipoIRPF(brd * 360 * 0.70, hijos);
  };

  const pctIrpfNum = deducirIRPF();
  const pctIrpf = pctIrpfNum / 100;
  const cuotaSS_diaria = brd * 0.047;
  const diasDerechoTotal = obtenerDiasDerecho(diasCotizados);

  const bruto1 = brd * 0.70;
  const neto1 = Math.max(0, bruto1 - cuotaSS_diaria - (bruto1 * pctIrpf));
  const bruto2 = brd * 0.60;
  const neto2 = Math.max(0, bruto2 - cuotaSS_diaria - (bruto2 * pctIrpf));

  // Procesar pagos y tramos mixtos
  let diasCobradosAcum = 0;
  let totalEurosCobrados = 0;

  const pagosProcesados = pagos.map((p) => {
    const imp = parseFloat(p.importe) || 0;
    totalEurosCobrados += imp;
    if (imp <= 0 || neto1 <= 0) return { ...p, dias: 0, tipo: '-' };

    const diasTotalesPrevios = diasCobradosAcum + diasPerdidos;
    let diasFila = 0;
    let detalleTramo = '';

    if (diasTotalesPrevios < 180) {
      const diasRestantesT1 = 180 - diasTotalesPrevios;
      const dineroMaxT1 = diasRestantesT1 * neto1;

      if (imp > dineroMaxT1 + 10) {
        const d1_entero = Math.round(diasRestantesT1);
        let d2_calc = neto2 > 0 ? ((imp - dineroMaxT1) / neto2) : 0;
        let d2_entero = Math.round(d2_calc);
        if (d1_entero + d2_entero === 29 && imp > 1050) d2_entero = 30 - d1_entero;
        diasFila = d1_entero + d2_entero;
        detalleTramo = `Mixto (${d1_entero}d al 70% + ${d2_entero}d al 60%)`;
      } else {
        diasFila = Math.round(imp / neto1);
        detalleTramo = '70%';
      }
    } else {
      diasFila = Math.round(imp / neto2);
      detalleTramo = '60%';
    }

    diasCobradosAcum += diasFila;
    return { ...p, dias: diasFila, tipo: detalleTramo };
  });

  const diasCobradosTotal = Math.round(diasCobradosAcum);
  const dineroPerdidoEstimado = diasPerdidos * neto1;
  const diasConsumidosTotales = diasCobradosTotal + diasPerdidos;
  const diasRestantes = Math.max(0, diasDerechoTotal - diasConsumidosTotales);
  const eurosRestantes = diasRestantes * neto2;

  let eurosTotalesBolsa = diasDerechoTotal <= 180 ? diasDerechoTotal * neto1 : (180 * neto1) + ((diasDerechoTotal - 180) * neto2);

  const actualizarPago = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
    mostrarToast("Guardado automático");
  };

  const agregarPago = () => {
    setPagos([...pagos, { fecha: "", importe: "" }]);
    mostrarToast("Pago añadido");
  };

  const eliminarPago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
    mostrarToast("Pago eliminado");
  };

  return (
    <div className="bg-slate-100 text-slate-800 p-3 md:p-8 font-sans min-h-screen">
      {/* Notificación Toast */}
      <div className={`fixed top-5 right-5 z-50 transition-all duration-300 flex items-center gap-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold ${toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-72 pointer-events-none'}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>{toastVisible}</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-5">
        {/* Cabecera con Autenticación Google */}
        <header className="bg-slate-900 text-white p-5 rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black">Calculadora de Paro SEPE</h1>
            <p className="text-slate-400 text-xs md:text-sm mt-0.5">Sincronización en la nube y control económico total.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                <span className="text-emerald-400 font-bold">● {user.displayName}</span>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white ml-2 underline">Salir</button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-2 transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Iniciar sesión con Google
              </button>
            )}
          </div>
        </header>

        {/* Formulario */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. Datos del Reconocimiento</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Base Reguladora (€/día)</label>
              <input type="number" value={brd} onChange={e => setBrd(parseFloat(e.target.value) || 0)} step="0.01" className="w-full p-2 border rounded-lg text-sm font-bold text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días Cotizados</label>
              <input type="number" value={diasCotizados} onChange={e => setDiasCotizados(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hijos a cargo</label>
              <select value={hijos} onChange={e => setHijos(parseInt(e.target.value))} className="w-full p-2 border rounded-lg text-sm bg-white font-semibold">
                <option value={0}>0 hijos</option>
                <option value={1}>1 hijo</option>
                <option value={2}>2 o más hijos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días perdidos (fuera plazo)</label>
              <input type="number" value={diasPerdidos} onChange={e => setDiasPerdidos(parseInt(e.target.value) || 0)} className="w-full p-2 border border-rose-300 bg-rose-50/50 rounded-lg text-sm font-bold text-rose-800" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IRPF Detectado / Aplicado</label>
              <input type="text" readOnly value={`${pctIrpfNum.toFixed(2)} %`} className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-black text-blue-900 text-center" />
            </div>
          </div>
        </div>

        {/* Tramos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-bold text-blue-700 uppercase">Tramo 1 (70%)</span>
            <p className="text-xl font-black text-blue-900 mt-1">{neto1.toFixed(2)} € / día neto</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-lg">
            <span className="text-[10px] font-bold text-slate-700 uppercase">Tramo 2 (60%)</span>
            <p className="text-xl font-black text-slate-900 mt-1">{neto2.toFixed(2)} € / día neto</p>
          </div>
        </div>

        {/* Tabla Historial */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Historial de Ingresos Bancarios</h2>
            <button onClick={agregarPago} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">+ Añadir Pago</button>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Fecha</th>
                  <th className="p-2.5">Importe Neto (€)</th>
                  <th className="p-2.5">Días Oficiales</th>
                  <th className="p-2.5">Tramo</th>
                  <th className="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagosProcesados.map((p, index) => (
                  <tr key={index}>
                    <td className="p-2.5 font-mono text-slate-400">{index + 1}</td>
                    <td className="p-2.5"><input type="text" value={p.fecha} onChange={e => actualizarPago(index, 'fecha', e.target.value)} className="w-28 p-1 border rounded text-xs" /></td>
                    <td className="p-2.5"><input type="number" step="0.01" value={p.importe} onChange={e => actualizarPago(index, 'importe', parseFloat(e.target.value) || 0)} className="w-28 p-1 border rounded text-xs font-bold" /></td>
                    <td className="p-2.5 font-bold">{p.dias > 0 ? `${p.dias} días` : '-'}</td>
                    <td className="p-2.5">{p.tipo}</td>
                    <td className="p-2.5 text-center"><button onClick={() => eliminarPago(index)} className="text-rose-500 font-bold">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance Global */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Balance Global</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-indigo-50 rounded-lg border"><span className="text-[10px] font-bold text-indigo-700">TOTAL A COBRAR</span><p className="text-lg font-black text-indigo-950">{eurosTotalesBolsa.toFixed(2)} €</p></div>
            <div className="p-3 bg-blue-50 rounded-lg border"><span className="text-[10px] font-bold text-blue-700">LLEVAS COBRADO</span><p className="text-lg font-black text-blue-950">{totalEurosCobrados.toFixed(2)} €</p></div>
            <div className="p-3 bg-emerald-50 rounded-lg border"><span className="text-[10px] font-bold text-emerald-700">QUEDA POR COBRAR</span><p className="text-lg font-black text-emerald-950">{eurosRestantes.toFixed(2)} €</p></div>
            <div className="p-3 bg-rose-50 rounded-lg border"><span className="text-[10px] font-bold text-rose-700">PERDIDO SIN COBRO</span><p className="text-lg font-black text-rose-950">{dineroPerdidoEstimado.toFixed(2)} €</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
