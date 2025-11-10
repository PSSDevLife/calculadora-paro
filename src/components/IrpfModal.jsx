import React, { useState, useEffect } from 'react';
import styles from './IrpfModal.module.css';

// Recibimos la nueva prop diasYaCobrados
function IrpfModal({ isOpen, onClose, onCalculateIrpf, baseReguladoraFromForm, onBaseUpdate, diasYaCobrados }) {
  const [netoReal, setNetoReal] = useState('');
  const [baseModal, setBaseModal] = useState('');
  const [diasModal, setDiasModal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBaseModal(baseReguladoraFromForm || '');
    }
  }, [isOpen, baseReguladoraFromForm]);

  const handleCalculate = () => {
    const baseParaCalculo = parseFloat(baseReguladoraFromForm || baseModal);
    const diasParaCalculo = parseInt(diasModal, 10);
    const neto = parseFloat(netoReal);

    if (isNaN(baseParaCalculo) || baseParaCalculo <= 0 || isNaN(diasParaCalculo) || diasParaCalculo <= 0 || isNaN(neto)) {
      alert("Por favor, introduce todos los valores requeridos correctamente.");
      return;
    }

    // --- LÓGICA DE CÁLCULO DE BRUTO TOTALMENTE NUEVA ---
    // Ahora el bruto se calcula teniendo en cuenta los tramos
    let brutoCalculado = 0;
    const diasRestantesTramo1 = Math.max(0, 180 - diasYaCobrados);
    const diasEnTramo1 = Math.min(diasParaCalculo, diasRestantesTramo1);
    const diasEnTramo2 = diasParaCalculo - diasEnTramo1;

    if (diasEnTramo1 > 0) brutoCalculado += diasEnTramo1 * baseParaCalculo * 0.70;
    if (diasEnTramo2 > 0) brutoCalculado += diasEnTramo2 * baseParaCalculo * 0.60;
    
    // El resto de la lógica permanece igual
    const baseCotizacion = baseParaCalculo * diasParaCalculo;
    const seguridadSocial = baseCotizacion * 0.048;
    const irpfDeducido = brutoCalculado - neto - seguridadSocial;

    if (brutoCalculado <= 0 || irpfDeducido < 0) {
      alert("El importe neto es demasiado alto para esa base y días. Revisa los datos.");
      return;
    }
    
    const irpfPercentage = (irpfDeducido / brutoCalculado) * 100;

    if (!baseReguladoraFromForm && baseModal) {
      onBaseUpdate({ target: { value: baseModal } });
    }

    onCalculateIrpf(irpfPercentage.toFixed(2));
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Calcular Porcentaje de IRPF</h2>
        <p>Introduce los datos de cualquier cobro para estimar el IRPF que te aplicaron.</p>
        
        {!baseReguladoraFromForm && (
          <div className={styles.inputGroup}>
            <label>Base Reguladora Diaria (€)</label>
            <input 
              type="number" 
              step="0.01" 
              value={baseModal} 
              onChange={(e) => setBaseModal(e.target.value)} 
              placeholder="Ej: 61.44" 
            />
          </div>
        )}
        <div className={styles.inputGroup}>
          <label>Días del periodo cobrado</label>
          <input 
            type="number" 
            value={diasModal} 
            onChange={(e) => setDiasModal(e.target.value)} 
            placeholder="Ej: 30" 
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Importe Neto que recibiste (€)</label>
          <input 
            type="number" 
            step="0.01" 
            value={netoReal} 
            onChange={(e) => setNetoReal(e.target.value)} 
            placeholder="Ej: 759.45" 
          />
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
          <button onClick={handleCalculate} className={styles.confirmBtn}>Calcular y Aplicar</button>
        </div>
      </div>
    </div>
  );
}

export default IrpfModal;