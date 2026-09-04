// calculator.js
// Contiene toda la lógica matemática pura, sin interactuar con el DOM.

export function obtenerDiasDerecho(diasCotizados) {
  if (diasCotizados < 360) return 0;
  if (diasCotizados < 540) return 120;
  if (diasCotizados < 720) return 180;
  if (diasCotizados < 900) return 240;
  if (diasCotizados < 1080) return 300;
  if (diasCotizados < 1260) return 360;
  if (diasCotizados < 1440) return 420;
  if (diasCotizados < 1620) return 480;
  if (diasCotizados < 1800) return 540;
  if (diasCotizados < 1980) return 600;
  if (diasCotizados < 2160) return 660;
  return 720;
}

export function obtenerTopesLegales(hijos) {
  if (hijos === 1) return { min: 749.00, max: 1400.00 };
  if (hijos >= 2) return { min: 749.00, max: 1575.00 };
  return { min: 560.00, max: 1225.00 };
}

export function estimarTipoIRPF(brutoAnual, hijos) {
  let limiteExento = 15876;
  if (hijos === 1) limiteExento = 16342;
  else if (hijos >= 2) limiteExento = 17565;

  if (brutoAnual <= limiteExento) return 0;

  let gastos = 2000;
  let reduccion = 0;
  if (brutoAnual <= 14047.50) {
    reduccion = 6498;
  } else if (brutoAnual <= 19747.50) {
    reduccion = Math.max(0, 6498 - 1.14 * (brutoAnual - 14047.50));
  }

  let baseLiq = Math.max(0, brutoAnual - gastos - reduccion);

  let minPersonal = 5550;
  if (hijos === 1) minPersonal += 2400;
  else if (hijos >= 2) minPersonal += 2400 + 2700;

  function calcularCuota(base) {
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
  }

  let cuota = Math.max(0, calcularCuota(baseLiq) - calcularCuota(minPersonal));
  return Math.max(0, Math.round((cuota / brutoAnual) * 10000) / 100);
}

export function deducirIRPFDePagos(brd, pagosImportes) {
  if (brd <= 0) return { porcentaje: 0, detectado: false };
  const brutoMes1 = brd * 30 * 0.70;
  const cuotaSS_mes = brd * 30 * 0.047;

  for (let val of pagosImportes) {
    if (val > 800 && val <= brutoMes1) {
      let deduccionTotal = brutoMes1 - val;
      let retencionIRPF_mes = deduccionTotal - cuotaSS_mes;
      if (retencionIRPF_mes >= 0) {
        let pct = (retencionIRPF_mes / brutoMes1) * 100;
        return { porcentaje: Math.round(pct * 100) / 100, detectado: true };
      }
    }
  }
  return { porcentaje: 0, detectado: false };
}
