// src/components/CalculatorForm.jsx

import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './CalculatorForm.module.css';

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

function CalculatorForm({ onCalculate, irpfPercentage, onIrpfChange }) {
  const [baseReguladora, setBaseReguladora] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = parseFloat(baseReguladora);
    const dias = calculateDays(startDate, endDate);
    const irpf = parseFloat(irpfPercentage);

    if (isNaN(base) || base <= 0 || dias <= 0) {
      alert("Por favor, introduce una base reguladora válida y un rango de fechas correcto.");
      return;
    }

    // Se pasan las fechas startDate y endDate al handler
    onCalculate(base, dias, irpf, startDate, endDate);
  };

  return (
    <div className={styles.card}>
      <h2>Nuevo Cálculo</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="base">Base Reguladora Diaria (€)</label>
          <input
            id="base"
            type="number"
            step="0.01"
            value={baseReguladora}
            onChange={(e) => setBaseReguladora(e.target.value)}
            placeholder="Ej: 61.44"
            required
          />
        </div>
        
        <div className={styles.datePickerGroup}>
          <div className={styles.inputGroup}>
            <label htmlFor="startDate">Fecha de Inicio</label>
            <DatePicker
              id="startDate"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              className={styles.dateInput}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="endDate">Fecha de Fin</label>
            <DatePicker
              id="endDate"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
            <label htmlFor="irpf">Porcentaje de IRPF (%)</label>
            <input
                id="irpf"
                type="number"
                step="0.01"
                value={irpfPercentage}
                onChange={onIrpfChange}
                className={styles.irpfInput}
                required
            />
        </div>
        
        <button type="submit" className={styles.calculateBtn}>
          Calcular ({calculateDays(startDate, endDate)} días)
        </button>
      </form>
    </div>
  );
}

export default CalculatorForm;