import React, { useState, useEffect } from 'react';
import CalculatorForm from './components/CalculatorForm';
import HistoryList from './components/HistoryList';
import Summary from './components/Summary';
import './App.css';

const calcularDiasPrestacion = (cotizados) => {
  if (cotizados < 360) return 0;
  if (cotizados >= 2160) return 720; // Máximo de prestación
  const tramos = [
    { c: 360, p: 120 }, { c: 540, p: 180 }, { c: 720, p: 240 },
    { c: 900, p: 300 }, { c: 1080, p: 360 }, { c: 1260, p: 420 },
    { c: 1440, p: 480 }, { c: 1620, p: 540 }, { c: 1800, p: 600 },
    { c: 1980, p: 660 }, { c: 2160, p: 720 }
  ];
  let prestacion = 0;
  for (let i = tramos.length - 1; i >= 0; i--) {
    if (cotizados >= tramos[i].c) {
      prestacion = tramos[i].p;
      break;
    }
  }
  return prestacion;
};

function App() {
  const [irpfPercentage, setIrpfPercentage] = useState('5.11');
  const [diasCotizados, setDiasCotizados] = useState(() => {
    const savedCotizados = localStorage.getItem('diasCotizados');
    return savedCotizados ? JSON.parse(savedCotizados) : 360;
  });
  const [baseReguladora, setBaseReguladora] = useState(() => {
    const savedBase = localStorage.getItem('baseReguladora');
    return savedBase ? JSON.parse(savedBase) : '';
  });
  const [diasTotalesPrestacion, setDiasTotalesPrestacion] = useState(0);
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('paroHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('diasCotizados', JSON.stringify(diasCotizados));
    setDiasTotalesPrestacion(calcularDiasPrestacion(diasCotizados));
  }, [diasCotizados]);

  useEffect(() => {
    localStorage.setItem('baseReguladora', JSON.stringify(baseReguladora));
  }, [baseReguladora]);

  useEffect(() => {
    localStorage.setItem('paroHistory', JSON.stringify(history));
  }, [history]);

  const diasYaCobrados = history.reduce((acc, curr) => acc + curr.dias, 0);

  const handleCalculate = (base, dias, irpf, startDate, endDate) => {
    // Control de seguridad final
    const diasRestantes = diasTotalesPrestacion - diasYaCobrados;
    if (dias > diasRestantes) {
      alert("Error: El número de días seleccionados supera los días de prestación restantes. Por favor, ajusta las fechas.");
      return; // Detiene la ejecución
    }

    let importeBruto = 0;
    const diasRestantesTramo1 = Math.max(0, 180 - diasYaCobrados);
    const diasEnTramo1 = Math.min(dias, diasRestantesTramo1);
    const diasEnTramo2 = dias - diasEnTramo1;
    if (diasEnTramo1 > 0) importeBruto += diasEnTramo1 * (base * 0.70);
    if (diasEnTramo2 > 0) importeBruto += diasEnTramo2 * (base * 0.60);
    const baseCotizacion = base * dias;
    const seguridadSocial = baseCotizacion * 0.048;
    const irpfCalculado = importeBruto * (irpf / 100);
    const importeNeto = importeBruto - seguridadSocial - irpfCalculado;
    const nuevoCalculo = {
      id: new Date().getTime(), base, dias, irpfPercentage: irpf,
      diasTotalesAntes: diasYaCobrados, startDate: startDate.toISOString(),
      endDate: endDate.toISOString(), bruto: importeBruto.toFixed(2),
      segSocial: seguridadSocial.toFixed(2), irpf: irpfCalculado.toFixed(2),
      neto: importeNeto.toFixed(2),
    };
    setHistory([nuevoCalculo, ...history]);
  };

  const handleDelete = (idToDelete) => {
    setHistory(history.filter(calc => calc.id !== idToDelete));
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar todo el historial? Esta acción no se puede deshacer.")) {
      setHistory([]);
    }
  };

  const handleIrpfChange = (e) => {
    setIrpfPercentage(e.target.value);
  };

  const handleDiasCotizadosChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setDiasCotizados(isNaN(value) ? 0 : value);
  };

  const handleBaseReguladoraChange = (e) => {
    setBaseReguladora(e.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calculadora de Prestación</h1>
        <p>Una herramienta visual para entender y proyectar tu prestación por desempleo.</p>
      </header>
      
      <main>
        <Summary history={history} diasTotalesPrestacion={diasTotalesPrestacion} />
        <CalculatorForm 
          onCalculate={handleCalculate}
          irpfPercentage={irpfPercentage}
          onIrpfChange={handleIrpfChange}
          diasCotizados={diasCotizados}
          onDiasCotizadosChange={handleDiasCotizadosChange}
          diasTotalesPrestacion={diasTotalesPrestacion}
          baseReguladora={baseReguladora}
          onBaseReguladoraChange={handleBaseReguladoraChange}
          diasYaCobrados={diasYaCobrados}
        />
        <HistoryList 
          history={history} 
          onDelete={handleDelete} 
          onClearHistory={handleClearHistory} 
        />
      </main>
    </div>
  );
}

export default App;