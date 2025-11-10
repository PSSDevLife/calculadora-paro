// src/components/HistoryItem.jsx

import React, { useState } from 'react';
import styles from './HistoryItem.module.css';
import { FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';

// Función para formatear las fechas de forma elegante (Ej: "10 Nov 2025")
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
};

function HistoryItem({ calculo, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);

  const diasRestantesTramo1 = Math.max(0, 180 - calculo.diasTotalesAntes);
  const diasEnTramo1 = Math.min(calculo.dias, diasRestantesTramo1);
  const diasEnTramo2 = calculo.dias - diasEnTramo1;
  const brutoTramo1 = diasEnTramo1 * (calculo.base * 0.70);
  const brutoTramo2 = diasEnTramo2 * (calculo.base * 0.60);

  // Se crea el texto del período a partir de las fechas guardadas
  const periodString = `${formatDate(calculo.startDate)} - ${formatDate(calculo.endDate)}`;

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerInfo}>
          <span className={styles.days}>{calculo.dias} días</span>
          {/* Se muestra el período del cálculo */}
          <span className={styles.period}>{periodString}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.netAmount}>{calculo.neto}€</span>
          <button className={styles.toggleButton}>
            {isOpen ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Base Reguladora:</span>
            <span>{calculo.base.toFixed(2)}€ / día</span>
          </div>
          <hr className={styles.divider} />
          
          {diasEnTramo1 > 0 && (
            <div className={styles.detailRow}>
              <span>{diasEnTramo1} días al 70%:</span>
              <span>{brutoTramo1.toFixed(2)}€</span>
            </div>
          )}
          {diasEnTramo2 > 0 && (
            <div className={styles.detailRow}>
              <span>{diasEnTramo2} días al 60%:</span>
              <span>{brutoTramo2.toFixed(2)}€</span>
            </div>
          )}

          <div className={`${styles.detailRow} ${styles.bold}`}>
            <span>Importe Bruto Total:</span>
            <span>{calculo.bruto}€</span>
          </div>
          <hr className={styles.divider} />
          
          <div className={`${styles.detailRow} ${styles.deduction}`}>
            <span>(-) Seg. Social (4.8%):</span>
            <span>-{calculo.segSocial}€</span>
          </div>
          <div className={`${styles.detailRow} ${styles.deduction}`}>
            <span>(-) IRPF ({calculo.irpfPercentage}%):</span>
            <span>-{calculo.irpf}€</span>
          </div>
          <hr className={styles.divider} />

          <div className={`${styles.detailRow} ${styles.total}`}>
            <span>Neto a Recibir:</span>
            <span>{calculo.neto}€</span>
          </div>
          
          <button onClick={() => onDelete(calculo.id)} className={styles.deleteBtn}>
            <FiTrash2 /> Eliminar Registro
          </button>
        </div>
      )}
    </div>
  );
}

export default HistoryItem;