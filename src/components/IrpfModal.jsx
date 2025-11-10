import React, { useState, useEffect } from 'react';
import styles from './IrpfModal.module.css';

function IrpfModal({ isOpen, onClose, onCalculateIrpf, baseReguladoraFromForm, onBaseUpdate }) {
  // Se ha eliminado el estado para el bruto
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

    // --- LÓGICA MODIFICADA ---
    // 1. Calculamos el importe bruto teórico (asumiendo el 70% del primer tramo)
    const brutoCalculado = baseParaCalculo * diasParaCalculo * 0.70;

    // 2. Calculamos la deducción teórica de la Seguridad Social
    const baseCotizacion = baseParaCalculo * diasParaCalculo;
    const seguridadSocial = baseCotizacion * 0.048;

    // 3. Calculamos la cantidad deducida como IRPF
    const irpfDeducido = brutoCalculado - neto - seguridadSocial;

    if (brutoCalculado <= 0 || irpfDeducido < 0) {
      alert("El importe neto es demasiado alto para esa base y días. Revisa los datos, el neto no puede superar al bruto menos la Seg. Social.");
      return;
    }
    
    // 4. Calculamos el porcentaje que representa esa deducción sobre el bruto
    const irpfPercentage = (irpfDeducido / brutoCalculado) * 100;

    // 5. Si la base se introdujo en el modal, la actualizamos en el formulario principal
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
        <p>Introduce el importe neto de tu primer cobro (o uno dentro de los primeros 180 días) para estimar el IRPF.</p>
        
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
          <label>Primer importe neto que recibiste (€)</label>
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