import React from 'react';
import { format } from 'date-fns';

const PrintableHistory = React.forwardRef(({ worker }, ref) => {
  if (!worker) {
    return null;
  }

  const styles = {
    container: {
      fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      width: '210mm', // A4 width
      minHeight: '297mm', // A4 height
      padding: '20mm',
      color: '#333',
      backgroundColor: '#fff',
      boxSizing: 'border-box',
    },
    header: {
      textAlign: 'center',
      marginBottom: '15mm',
      borderBottom: '2px solid #0f62fe',
      paddingBottom: '10mm',
    },
    h1: {
      fontSize: '26pt',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '4px',
    },
    p: {
      fontSize: '11pt',
      color: '#64748b',
    },
    dayCard: {
      marginBottom: '12mm',
    },
    dayHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f4f7fb',
      padding: '4mm 6mm',
      borderRadius: '8px 8px 0 0',
    },
    h4: {
      fontSize: '14pt',
      fontWeight: '600',
      margin: 0,
      color: '#0f62fe',
    },
    totalEarned: {
      fontSize: '14pt',
      fontWeight: 'bold',
      color: '#16a34a',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      border: '1px solid #dee2e6',
    },
    th: {
      textAlign: 'left',
      padding: '4mm 6mm',
      borderBottom: '2px solid #dee2e6',
      color: '#495057',
      fontSize: '9pt',
      fontWeight: '600',
      textTransform: 'uppercase',
      backgroundColor: '#f8f9fa',
    },
    td: {
      textAlign: 'left',
      padding: '4mm 6mm',
      borderBottom: '1px solid #e9ecef',
      verticalAlign: 'middle',
      fontSize: '10pt',
    },
    trEven: {
      backgroundColor: '#fcfdff',
    },
    textRight: {
      textAlign: 'right',
    },
    footer: {
      marginTop: '15mm',
      textAlign: 'center',
      fontSize: '9pt',
      color: '#6c757d',
      borderTop: '1px solid #dee2e6',
      paddingTop: '8mm',
    }
  };

  return (
    <div ref={ref} style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>{worker.name}</h1>
        <p style={styles.p}>Work History Report</p>
      </div>

      {worker.workHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map((workDay, index) => (
        <div key={index} style={styles.dayCard}>
          <div style={styles.dayHeader}>
            <h4 style={styles.h4}>{format(new Date(workDay.date), 'MMMM dd, yyyy')}</h4>
            <span style={styles.totalEarned}>₹{workDay.totalEarned.toFixed(2)}</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item Name</th>
                <th style={{...styles.th, ...styles.textRight}}>Pieces</th>
                <th style={{...styles.th, ...styles.textRight}}>Rate</th>
                <th style={{...styles.th, ...styles.textRight}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {workDay.items.map((item, itemIndex) => (
                <tr key={itemIndex} style={itemIndex % 2 === 0 ? {} : styles.trEven}>
                  <td style={styles.td}>{item.itemName}</td>
                  <td style={{...styles.td, ...styles.textRight}}>{item.piecesCompleted}</td>
                  <td style={{...styles.td, ...styles.textRight}}>₹{item.wageRate.toFixed(2)}</td>
                  <td style={{...styles.td, ...styles.textRight, fontWeight: 'bold'}}>₹{item.totalWage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      
      <div style={styles.footer}>
        <p>Report generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
      </div>
    </div>
  );
});

export default PrintableHistory;
