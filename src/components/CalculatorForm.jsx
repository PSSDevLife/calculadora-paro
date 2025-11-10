import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './CalculatorForm.module.css';
import IrpfModal from './IrpfModal';
import { FiAlertCircle } from 'react-icons/fi';

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

function CalculatorForm({ 
  onCalculate, 
  irpfPercentage, 
  onIrpfChange, 
  diasCotizados, 
  onDiasCotizadosChange, 
  diasTotalesPrestacion,
  baseReguladora, 
  onBaseReguladoraChange
}) {
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = parseFloat(baseReguladora);
    if (!endDate) {
      alert("Por favor, selecciona una fecha de fin.");
      return;
    }
    const dias = calculateDays(startDate, endDate);
    const irpf = parseFloat(irpfPercentage);
    if (isNaN(base) || base <= 0 || dias <= 0) {
      alert("Por favor, introduce valores válidos.");
      return;
    }
    onCalculate(base, dias, irpf, startDate, endDate);
  };

  const handleUpdateIrpf = (newPercentage) => {
    onIrpfChange({ target: { value: newPercentage } });
  };

  return (
    <>
      <IrpfModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCalculateIrpf={handleUpdateIrpf}
        baseReguladoraFromForm={baseReguladora}
        // Pasamos la función que actualiza la base reguladora en el estado principal
        onBaseUpdate={onBaseReguladoraChange}
      />

      <div className={styles.card}>
        <div className={styles.configSection}>
          <div className={styles.inputGroup}>
            <label htmlFor="cotizados">Días Cotizados (últimos 6 años)</label>
            <input 
              id="cotizados" 
              type="number" 
              value={diasCotizados} 
              onChange={onDiasCotizadosChange} 
              placeholder="Ej: 1080" 
              required 
            />
          </div>
          <div className={styles.prestacionInfo}>
            <span>Te corresponden:</span>
            <span className={styles.prestacionDays}>{diasTotalesPrestacion} días</span>
            <span>de prestación</span>
          </div>
        </div>

        <h2>Nuevo Cálculo</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="base">Base Reguladora Diaria (€)</label>
            <input 
              id="base" 
              type="number" 
              step="0.01" 
              value={baseReguladora} 
              onChange={onBaseReguladoraChange} 
              placeholder="Ej: 61.44" 
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Periodo de Cálculo</label>
            <div className={styles.calendarWrapper}>
              <DatePicker 
                selectsRange={true} 
                startDate={startDate} 
                endDate={endDate} 
                onChange={(update) => { setDateRange(update); }} 
                monthsShown={2} 
                inline 
                dateFormat="dd/MM/yyyy" 
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <div className={styles.irpfLabelGroup}>
              <label htmlFor="irpf">Porcentaje de IRPF (%)</label>
              <button 
                type="button" 
                className={styles.irpfCalcBtn} 
                onClick={() => setIsModalOpen(true)}
              >
                <FiAlertCircle size={14} /> Calcular
              </button>
            </div>
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
    </>
  );
}

export default CalculatorForm;