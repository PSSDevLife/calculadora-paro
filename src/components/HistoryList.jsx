import React from 'react';
import HistoryItem from './HistoryItem';
import styles from './HistoryList.module.css';
import { FiTrash2 } from 'react-icons/fi';

function HistoryList({ history, onDelete, onClearHistory }) {
  return (
    <section className={styles.historySection}>
      <div className={styles.historyHeader}>
        <h2>Historial de Cálculos</h2>
        {history.length > 0 && (
          <button onClick={onClearHistory} className={styles.clearAllBtn}>
            <FiTrash2 size={14} /> Borrar Todo
          </button>
        )}
      </div>

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