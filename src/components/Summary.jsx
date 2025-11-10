import React from 'react';
import styles from './Summary.module.css';

function Summary({ history, diasTotalesPrestacion }) {
  const totalDiasCobrados = history.reduce((acc, curr) => acc + curr.dias, 0);
  const totalNetoCobrado = history.reduce((acc, curr) => acc + parseFloat(curr.neto), 0);
  
  // Barra 1: Lógica
  const progressPercentageTramo1 = Math.min((totalDiasCobrados / 180) * 100, 100);

  // Barra 2: Lógica dinámica
  const diasEnTramo2 = Math.max(0, totalDiasCobrados - 180);
  const totalDiasTramo2 = Math.max(0, diasTotalesPrestacion - 180);
  const progressPercentageTramo2 = totalDiasTramo2 > 0 ? Math.min((diasEnTramo2 / totalDiasTramo2) * 100, 100) : 0;

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryItem}>
        <span className={styles.value}>{totalDiasCobrados} / {diasTotalesPrestacion} días</span>
        <span className={styles.label}>Total Cobrado</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.value}>{totalNetoCobrado.toFixed(2)}€</span>
        <span className={styles.label}>Neto Acumulado</span>
      </div>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressItem}>
          <div className={styles.progressLabels}>
            <span className={styles.label}>Progreso 1er Tramo (180 días)</span>
            <span className={styles.value}>{Math.round(progressPercentageTramo1)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${progressPercentageTramo1}%` }}
            ></div>
          </div>
        </div>

        {/* Renderizado condicional de la segunda barra */}
        {totalDiasTramo2 > 0 && (
          <div className={styles.progressItem}>
            <div className={styles.progressLabels}>
              <span className={styles.label}>{`Progreso 2º Tramo (Día 181 a ${diasTotalesPrestacion})`}</span>
              <span className={styles.value}>{Math.round(progressPercentageTramo2)}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={`${styles.progressBarFill} ${styles.progressBarFillTramo2}`}
                style={{ width: `${progressPercentageTramo2}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Summary;