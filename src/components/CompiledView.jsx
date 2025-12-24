import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function CompiledView({ insegnamenti, provaFinale, titoloPDF, setTitoloPDF, creditiMassimi, setCreditiMassimi, totalCFA }) {
  const viewRef = useRef(null)

  useEffect(() => {
    if (viewRef.current) {
      gsap.fromTo(viewRef.current.querySelectorAll('.compiled-item'),
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05 }
      )
    }
  }, [insegnamenti])

  useEffect(() => {
    const handleGeneratePDF = () => generatePDF()
    if (viewRef.current) {
      viewRef.current.addEventListener('generatePDF', handleGeneratePDF)
      return () => viewRef.current?.removeEventListener('generatePDF', handleGeneratePDF)
    }
  }, [insegnamenti, provaFinale, titoloPDF, totalCFA])

  const generatePDF = () => {
    if (insegnamenti.length === 0 && (!provaFinale || (!provaFinale.descrizione && !provaFinale.cfa))) {
      alert('Aggiungi almeno un\'attività prima di generare il PDF.')
      return
    }

    const doc = new jsPDF()
    
    // Titolo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(54, 52, 142) // #36348E
    doc.text(titoloPDF || 'Piano Didattico di Corso di Studi AFAM', 14, 20)
    
    // Data
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(102, 102, 102)
    const date = new Date().toLocaleDateString('it-IT')
    doc.text(`Data: ${date}`, 14, 28)
    
    // Tabella dati
    const tableData = []
    
    // Aggiungi tutte le attività formative
    insegnamenti.forEach((ins, index) => {
      if (ins.tipoAttivita === 'Insegnamento') {
        // Insegnamento completo
        tableData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.cfa || 0,
          ins.insegnamento || ins.campoDisciplinare || '-'
        ])
      } else {
        // Altri tipi (Laboratori, Seminari, Masterclass, Altro)
        tableData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          '-',
          '-',
          ins.insegnamento || '-', // Descrizione
          '-',
          ins.cfa || 0,
          '-'
        ])
      }
    })
    
    // Aggiungi Prova Finale se presente
    if (provaFinale && (provaFinale.descrizione || provaFinale.cfa > 0)) {
      tableData.push([
        'PF',
        'Prova Finale',
        '-',
        '-',
        '-',
        provaFinale.descrizione || '-',
        '-',
        provaFinale.cfa || 0,
        '-'
      ])
    }
    
    // Riga totale
    tableData.push(['', '', '', '', '', '', 'TOTALE', totalCFA, ''])
    
    doc.autoTable({
      head: [['#', 'Tipo', 'Nome', 'Area', 'SAD', 'Denominazione', 'Profilo', 'CFA', 'Dettagli']],
      body: tableData,
      startY: 35,
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        font: 'helvetica',
        textColor: [41, 41, 41]
      },
      headStyles: { 
        fillColor: [54, 52, 142], // #36348E
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        7: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [247, 88, 56] } // CFA in arancione #F75838
      },
      didParseCell: function(data) {
        // Riga totale
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
          data.cell.styles.textColor = [41, 41, 41]
        }
        // Prova Finale
        if (data.row.index === tableData.length - 2 && tableData[data.row.index][0] === 'PF') {
          data.cell.styles.fillColor = [248, 249, 250]
        }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    })
    
    doc.save('piano_didattico_afam.pdf')
  }

  return (
    <div ref={viewRef} className="compiled-view">
      <div className="compiled-header">
        <div className="titolo-pdf-container">
          <input
            type="text"
            value={titoloPDF}
            onChange={(e) => setTitoloPDF(e.target.value)}
            className="titolo-pdf-input"
            placeholder="Titolo corso di studi"
          />
        </div>
        <div className="crediti-massimi-container">
          <label htmlFor="crediti-massimi">Crediti massimi:</label>
          <input
            id="crediti-massimi"
            type="number"
            value={creditiMassimi}
            onChange={(e) => setCreditiMassimi(parseInt(e.target.value) || 0)}
            className="crediti-massimi-input"
            min="0"
          />
        </div>
      </div>

      {insegnamenti.length === 0 ? (
        <div className="compiled-empty">
          <p>Nessun insegnamento da visualizzare.</p>
          <p>Aggiungi degli insegnamenti dalla colonna di sinistra.</p>
        </div>
      ) : (
        <div className="compiled-list">
        {insegnamenti.map((ins, index) => (
          <div key={ins.id} className="compiled-item">
            <div className="compiled-header-line">
              <div className="compiled-number">#{index + 1}</div>
              {ins.nomeAttivita && (
                <h3 className="compiled-title">{ins.nomeAttivita}</h3>
              )}
            </div>
            <div className="compiled-content">
              {/* Mostra tipo di attività */}
              <div className="compiled-row">
                <span className="label">Tipo:</span>
                <span className="value">{ins.tipoAttivita || 'Insegnamento'}</span>
              </div>

              {/* Se è un Insegnamento, mostra tutti i campi */}
              {ins.tipoAttivita === 'Insegnamento' ? (
                <>
                  <div className="compiled-row">
                    <span className="label">Area AFAM:</span>
                    <span className="value">{ins.areaAFAM || '-'}</span>
                  </div>
                  <div className="compiled-row">
                    <span className="label">SAD:</span>
                    <span className="value">{ins.sad || '-'}</span>
                  </div>
                  <div className="compiled-row">
                    <span className="label">Denominazione:</span>
                    <span className="value">{ins.denominazioneSAD || '-'}</span>
                  </div>
                  {ins.profilo && (
                    <div className="compiled-row">
                      <span className="label">Profilo:</span>
                      <span className="value">{ins.profilo}</span>
                    </div>
                  )}
                  {ins.vecchioSAD && (
                    <div className="compiled-row">
                      <span className="label">Vecchio SAD:</span>
                      <span className="value">{ins.vecchioSAD} - {ins.denominazioneVecchioSAD}</span>
                    </div>
                  )}
                  {ins.insegnamento && (
                    <div className="compiled-row">
                      <span className="label">Insegnamento:</span>
                      <span className="value">{ins.insegnamento}</span>
                    </div>
                  )}
                  {ins.campoDisciplinare && (
                    <div className="compiled-row">
                      <span className="label">Campo Disciplinare:</span>
                      <span className="value">{ins.campoDisciplinare}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Per altri tipi (Laboratori, Seminari, ecc.) mostra solo descrizione */
                <>
                  {ins.insegnamento && (
                    <div className="compiled-row">
                      <span className="label">Descrizione:</span>
                      <span className="value">{ins.insegnamento}</span>
                    </div>
                  )}
                </>
              )}

              {/* CFA sempre visibile per tutti i tipi */}
              <div className="compiled-row highlight">
                <span className="label">CFA:</span>
                <span className="value cfa">{ins.cfa || 0}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Prova Finale */}
        {provaFinale && (provaFinale.descrizione || provaFinale.cfa > 0) && (
          <div className="compiled-item prova-finale-item">
            <div className="compiled-header-line">
              <div className="compiled-number">PF</div>
              <h3 className="compiled-title">Prova Finale</h3>
            </div>
            <div className="compiled-content">
              <div className="compiled-row">
                <span className="label">Tipo:</span>
                <span className="value">Prova Finale</span>
              </div>
              {provaFinale.descrizione && (
                <div className="compiled-row">
                  <span className="label">Descrizione:</span>
                  <span className="value">{provaFinale.descrizione}</span>
                </div>
              )}
              <div className="compiled-row highlight">
                <span className="label">CFA:</span>
                <span className="value cfa">{provaFinale.cfa || 0}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      <div className="compiled-total">
        <span>Totale CFA:</span>
        <span className="total-value">{totalCFA}</span>
      </div>
    </div>
  )
}
