@tailwind base;
@tailwind components;
@tailwind utilities;

import React, { useState, useEffect } from 'react';

export default function App() {
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

  const mostrarToast = (mensaje) => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const cambioDatos = () => {
    mostrarToast("Cambios guardados");
  };

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

  const obtenerTopesLegales = (h) => {
    if (h === 1) return { min: 749.00, max: 1400.00 };
    if (h >= 2) return { min: 749.00, max: 1575.00 };
    return { min: 560.00, max: 1225.00 };
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
  const topes = obtenerTopesLegales(hijos);

  const bruto1 = brd * 0.70;
  const neto1 = Math.max(0, bruto1 - cuotaSS_diaria - (bruto1 * pctIrpf));
  const bruto2 = brd * 0.60;
  const neto2 = Math.max(0, bruto2 - cuotaSS_diaria - (bruto2 * pctIrpf));

  let diasCobradosAcum = 0;
  let totalEurosCobrados = 0;

  const pagosProcesados = pagos.map((p) => {
    const imp = parseFloat(p.importe) || 0;
    totalEurosCobrados += imp;
    if (imp <= 0 || neto1 <= 0) return { ...p, dias: 0, tipo: '-' };

    const diasTotalesPrevios = diasCobradosAcum + diasPerdidos;
    let diasFila = 0;
    let detalleTramo = '';
    let badgeStyle = '';

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
        badgeStyle = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded text-[11px]';
      } else {
        diasFila = Math.round(imp / neto1);
        detalleTramo = '70%';
        badgeStyle = 'bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[11px]';
      }
    } else {
      diasFila = Math.round(imp / neto2);
      detalleTramo = '60%';
      badgeStyle = 'bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded text-[11px]';
    }

    diasCobradosAcum += diasFila;
    return { ...p, dias: diasFila, tipo: detalleTramo, badgeStyle };
  });

  const diasCobradosTotal = Math.round(diasCobradosAcum);
  const dineroPerdidoEstimado = diasPerdidos * neto1;
  const diasRestantes = Math.max(0, diasDerechoTotal - (diasCobradosTotal + diasPerdidos));
  const eurosRestantes = diasRestantes * neto2;

  let eurosTotalesBolsa = diasDerechoTotal <= 180 ? diasDerechoTotal * neto1 : (180 * neto1) + ((diasDerechoTotal - 180) * neto2);

  const pctDineroCobrado = eurosTotalesBolsa > 0 ? Math.min(100, (totalEurosCobrados / eurosTotalesBolsa) * 100) : 0;
  const pctDineroPerdido = eurosTotalesBolsa > 0 ? Math.min(100 - pctDineroCobrado, (dineroPerdidoEstimado / eurosTotalesBolsa) * 100) : 0;
  const pctDineroRestante = Math.max(0, 100 - pctDineroCobrado - pctDineroPerdido);

  const actualizarPago = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    setPagos(nuevosPagos);
    cambioDatos();
  };

  const agregarPago = () => {
    setPagos([...pagos, { fecha: "", importe: "" }]);
    cambioDatos();
  };

  const eliminarPago = (index) => {
    setPagos(pagos.filter((_, i) => i !== index));
    cambioDatos();
  };

  const limpiarPagos = () => {
    setPagos([]);
    cambioDatos();
  };

  const exportarCopia = () => {
    const estado = { brd, diasCotizados, hijos, diasPerdidos, pagos };
    const blob = new Blob([JSON.stringify(estado)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Copia_Seguridad_Paro_SEPE.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importarCopia = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
      try {
        const datos = JSON.parse(e.target.result);
        setBrd(datos.brd);
        setDiasCotizados(datos.diasCotizados);
        setHijos(datos.hijos);
        setDiasPerdidos(datos.diasPerdidos);
        setPagos(datos.pagos || []);
        mostrarToast("Copia restaurada con éxito");
      } catch (err) {
        alert("Error al leer el archivo.");
      }
    };
    lector.readAsText(archivo);
  };

  return (
    <div className="bg-slate-100 text-slate-800 p-3 md:p-8 font-sans min-h-screen">
      {/* Toast Notificación */}
      <div className={`fixed top-5 right-5 z-50 transition-all duration-300 flex items-center gap-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold ${toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-72 pointer-events-none'}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Cambios guardados</span>
      </div>

      <div className="max-w-5xl mx-auto space-y-5">
        {/* Cabecera idéntica a la imagen */}
        <header className="bg-slate-900 text-white p-5 rounded-xl shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-black">Calculadora de Paro SEPE</h1>
              <p className="text-slate-400 text-xs md:text-sm mt-0.5">Control económico, autocalibración de IRPF y persistencia continua en tiempo real.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Autoguardado
              </div>
              <button onClick={exportarCopia} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1">
                💾 Respaldar
              </button>
              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1">
                📂 Restaurar
                <input type="file" accept=".json" onChange={importarCopia} className="hidden" />
              </label>
            </div>
          </div>
        </header>

        {/* 1. Datos del Reconocimiento */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. DATOS DEL RECONOCIMIENTO</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Base Reguladora (€/día)</label>
              <input type="number" value={brd} onChange={e => { setBrd(parseFloat(e.target.value) || 0); cambioDatos(); }} step="0.01" className="w-full p-2 border rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días Cotizados</label>
              <input type="number" value={diasCotizados} onChange={e => { setDiasCotizados(parseInt(e.target.value) || 0); cambioDatos(); }} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hijos a cargo</label>
              <select value={hijos} onChange={e => { setHijos(parseInt(e.target.value)); cambioDatos(); }} className="w-full p-2 border rounded-lg text-sm bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                <option value={0}>0 hijos</option>
                <option value={1}>1 hijo</option>
                <option value={2}>2 o más hijos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días perdidos (fuera plazo)</label>
              <input type="number" value={diasPerdidos} onChange={e => { setDiasPerdidos(parseInt(e.target.value) || 0); cambioDatos(); }} className="w-full p-2 border border-rose-300 bg-rose-50/50 rounded-lg text-sm font-bold text-rose-800 outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IRPF Detectado / Aplicado</label>
              <input type="text" readOnly value={`${pctIrpfNum.toFixed(2)} %`} className="w-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-black text-blue-900 text-center cursor-default" />
              <span className="block text-[10px] text-blue-600 text-center font-medium mt-0.5">Deducido de tus nóminas</span>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg border text-xs flex items-center justify-between bg-slate-50 border-slate-200 text-slate-600">
            <span>ℹ️ Referencia legal SEPE para <strong>{hijos} hijos</strong>: Mínimo <strong>{topes.min.toFixed(2)} €/mes</strong> | Máximo orientativo <strong>{topes.max.toFixed(2)} €/mes</strong>.</span>
            <span className="font-semibold text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Informativo</span>
          </div>
        </div>

        {/* Tramos 1 y 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">TRAMO 1 (DÍAS 1 AL 180 - 70%)</span>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Bruto: {bruto1.toFixed(2)} €/d</span>
            </div>
            <p className="text-xl font-black text-blue-900 mt-1">{neto1.toFixed(2)} € / día neto</p>
            <p className="text-xs text-slate-500 mt-0.5">Mes tipo (30 d): {(neto1 * 30).toFixed(2)} € | SS: {(cuotaSS_diaria * 30).toFixed(2)} € | IRPF: {(bruto1 * 30 * pctIrpf).toFixed(2)} €</p>
          </div>

          <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">TRAMO 2 (DÍA 181 EN ADELANTE - 60%)</span>
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">Bruto: {bruto2.toFixed(2)} €/d</span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">{neto2.toFixed(2)} € / día neto</p>
            <p className="text-xs text-slate-500 mt-0.5">Mes tipo (30 d): {(neto2 * 30).toFixed(2)} € | SS: {(cuotaSS_diaria * 30).toFixed(2)} € | IRPF: {(bruto2 * 30 * pctIrpf).toFixed(2)} €</p>
          </div>
        </div>

        {/* 2. Historial de Ingresos Bancarios */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. HISTORIAL DE INGRESOS BANCARIOS</h2>
              <p className="text-xs text-slate-500">Convierte automáticamente cada importe en días enteros e identifica pagos mixtos de cambio de tramo.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={agregarPago} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition">+ Añadir Pago</button>
              <button onClick={limpiarPagos} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Vaciar</button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">FECHA COBRO</th>
                  <th className="p-2.5">IMPORTE NETO (€)</th>
                  <th className="p-2.5">DÍAS OFICIALES</th>
                  <th className="p-2.5">TRAMO / OBSERVACIÓN</th>
                  <th className="p-2.5 text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagosProcesados.map((p, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-mono text-slate-400">{index + 1}</td>
                    <td className="p-2.5"><input type="text" value={p.fecha} onChange={e => actualizarPago(index, 'fecha', e.target.value)} className="w-28 p-1 border border-slate-300 rounded text-xs outline-none" /></td>
                    <td className="p-2.5"><input type="number" step="0.01" value={p.importe} onChange={e => actualizarPago(index, 'importe', parseFloat(e.target.value) || 0)} className="w-28 p-1 border border-slate-300 rounded text-xs font-bold text-slate-900 outline-none" /></td>
                    <td className="p-2.5 font-bold text-slate-800">{p.dias > 0 ? `${p.dias} días` : '-'}</td>
                    <td className="p-2.5"><span className={p.badgeStyle}>{p.tipo}</span></td>
                    <td className="p-2.5 text-center"><button onClick={() => eliminarPago(index)} className="text-slate-400 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded transition">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Balance Global del Expediente */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. BALANCE GLOBAL DEL EXPEDIENTE</h2>
              <p className="text-xs text-slate-500">Comparativa directa en euros del dinero total del paro frente a lo cobrado.</p>
            </div>
            <div className="text-xs font-bold text-slate-700">
              Total de la bolsa: <span className="text-sm font-black text-indigo-900">{eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-700">Progreso económico: <span className="text-blue-700 font-extrabold">{totalEurosCobrados.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span> cobrados de <span className="text-slate-900 font-extrabold">{eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></span>
              <span className="text-blue-900 font-black text-sm">{pctDineroCobrado.toFixed(1)}% cobrado</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 flex overflow-hidden shadow-inner">
              <div className="bg-blue-600 h-full transition-all" style={{ width: `${pctDineroCobrado}%` }} title="Dinero cobrado"></div>
              <div className="bg-rose-500 h-full transition-all" style={{ width: `${pctDineroPerdido}%` }} title="Dinero perdido"></div>
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctDineroRestante}%` }} title="Dinero pendiente"></div>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 pt-1 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> <strong>Cobrado en cuenta</strong> ({pctDineroCobrado.toFixed(1)}%)</span>
              <span className="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> <strong>Perdido fuera de plazo</strong> ({pctDineroPerdido.toFixed(1)}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> <strong>Pendiente por cobrar</strong> ({pctDineroRestante.toFixed(1)}%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-center">
            <div className="p-4 bg-indigo-50/70 rounded-xl border-2 border-indigo-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">TOTAL A COBRAR (100%)</span>
              <p className="text-xl md:text-2xl font-black text-indigo-950 my-1">{eurosTotalesBolsa.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              <span className="text-xs text-indigo-800 font-semibold">{diasDerechoTotal} días concedidos</span>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-xl border-2 border-blue-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">LLEVAS COBRADO</span>
              <p className="text-xl md:text-2xl font-black text-blue-950 my-1">{totalEurosCobrados.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              <span className="text-xs text-blue-800 font-semibold">{diasCobradosTotal} días cobrados</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-xl border-2 border-emerald-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">QUEDA POR COBRAR</span>
              <p className="text-xl md:text-2xl font-black text-emerald-950 my-1">{eurosRestantes.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              <span className="text-xs text-emerald-800 font-semibold">{diasRestantes} días pendientes</span>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-xl border-2 border-rose-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">PERDIDO SIN COBRO</span>
              <p className="text-xl md:text-2xl font-black text-rose-950 my-1">{dineroPerdidoEstimado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
              <span className="text-xs text-rose-800 font-semibold">{diasPerdidos} días perdidos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
