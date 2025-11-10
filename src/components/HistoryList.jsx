// src/components/HistoryList.jsx
import React from 'react';
import HistoryItem from './HistoryItem';
import styles from './HistoryList.module.css';

function HistoryList({ history, onDelete }) {
  const totalDiasCobrados = history.reduce((acc, curr) => acc + curr.dias, 0);

  return (
    <section className={styles.historySection}>
      <h2>Historial de Cálculos ({totalDiasCobrados} días en total)</h2>
      {history.length === 0 ? (
        <p className={styles.emptyHistory}>No hay cálculos guardados todavía.</p>
      ) : (
        <div>
          {history.map(calc => (
            <HistoryItem key={calc.id} calculo={calc} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}

export default HistoryList;