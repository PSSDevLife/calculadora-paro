// src/components/Summary.jsx
import React from 'react';
import styles from './Summary.module.css';

function Summary({ history }) {
  const totalDiasCobrados = history.reduce((acc, curr) => acc + curr.dias, 0);
  const totalNetoCobrado = history.reduce((acc, curr) => acc + parseFloat(curr.neto), 0);
  const progressPercentage = Math.min((totalDiasCobrados / 180) * 100, 100);

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryItem}>
        <span className={styles.value}>{totalDiasCobrados} días</span>
        <span className={styles.label}>Total Cobrado</span>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.value}>{totalNetoCobrado.toFixed(2)}€</span>
        <span className={styles.label}>Neto Acumulado</span>
      </div>
      <div className={styles.progressContainer}>
        <div className={styles.progressLabels}>
          <span className={styles.label}>Progreso del 1er Tramo (180 días)</span>
          <span className={styles.value}>{Math.round(progressPercentage)}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default Summary;