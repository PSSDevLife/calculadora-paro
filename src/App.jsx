// src/App.jsx

import React, { useState, useEffect } from 'react';
import CalculatorForm from './components/CalculatorForm';
import HistoryList from './components/HistoryList';
import Summary from './components/Summary';
import './App.css';

function App() {
  const [irpfPercentage, setIrpfPercentage] = useState('5.11');

  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('paroHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('paroHistory', JSON.stringify(history));
  }, [history]);

  // La firma de la función ahora acepta startDate y endDate
  const handleCalculate = (base, dias, irpf, startDate, endDate) => {
    const diasYaCobrados = history.reduce((acc, curr) => acc + curr.dias, 0);
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
      id: new Date().getTime(),
      base,
      dias,
      irpfPercentage: irpf,
      diasTotalesAntes: diasYaCobrados,
      // Se guardan las fechas para mostrarlas en el historial
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      bruto: importeBruto.toFixed(2),
      segSocial: seguridadSocial.toFixed(2),
      irpf: irpfCalculado.toFixed(2),
      neto: importeNeto.toFixed(2),
    };

    setHistory([nuevoCalculo, ...history]);
  };

  const handleDelete = (idToDelete) => {
    setHistory(history.filter(calc => calc.id !== idToDelete));
  };

  const handleIrpfChange = (e) => {
    setIrpfPercentage(e.target.value);
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Calculadora de Prestación</h1>
        <p>Una herramienta visual para entender y proyectar tu prestación por desempleo.</p>
      </header>
      
      <main>
        <Summary history={history} />
        <CalculatorForm 
          onCalculate={handleCalculate}
          irpfPercentage={irpfPercentage}
          onIrpfChange={handleIrpfChange}
        />
        <HistoryList history={history} onDelete={handleDelete} />
      </main>
    </div>
  );
}

export default App;