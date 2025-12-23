import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function CompiledView({ insegnamenti, totalCFA }) {
  const viewRef = useRef(null)

  useEffect(() => {
    if (viewRef.current) {
      gsap.fromTo(viewRef.current.querySelectorAll('.compiled-item'),
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.05 }
      )
    }
  }, [insegnamenti])

  const generatePDF = () => {
    if (insegnamenti.length === 0) {
      alert('Aggiungi almeno un insegnamento prima di generare il PDF.')
      return
    }

    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Piano Didattico di Corso di Studi AFAM', 14, 20)
    
    doc.setFontSize(10)
    const date = new Date().toLocaleDateString('it-IT')
    doc.text(`Data: ${date}`, 14, 28)
    
    const tableData = insegnamenti.map((ins, index) => {
      // Se è un insegnamento, mostra tutti i campi
      if (ins.tipoAttivita === 'Insegnamento') {
        return [
          index + 1,
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.cfa || 0,
          ins.vecchioSAD || '-',
          ins.denominazioneVecchioSAD || '-',
          ins.insegnamento || '-',
          ins.campoDisciplinare || '-'
        ]
      } else {
        // Per altri tipi, mostra tipo, nome e descrizione
        return [
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          ins.insegnamento || '-', // Descrizione
          '',
          ins.cfa || 0,
          '',
          '',
          '',
          ''
        ]
      }
    })
    
    tableData.push(['', '', '', '', 'TOTALE', totalCFA, '', '', '', ''])
    
    doc.autoTable({
      head: [['#', 'Area AFAM', 'SAD', 'Denominazione SAD', 'Profilo', 'CFA', 'Vecchio SAD', 'Den. Vecchio SAD', 'Insegnamento', 'Campo Disc.']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [102, 126, 234], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        5: { cellWidth: 15, halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [230, 230, 230]
        }
      }
    })
    
    doc.save('piano_didattico_afam.pdf')
  }

  if (insegnamenti.length === 0) {
    return (
      <div className="compiled-empty">
        <p>Nessun insegnamento da visualizzare.</p>
        <p>Aggiungi degli insegnamenti dalla colonna di sinistra.</p>
      </div>
    )
  }

  return (
    <div ref={viewRef} className="compiled-view">
      <div className="compiled-header">
        <button className="btn-pdf" onClick={generatePDF}>
          📄 Genera PDF
        </button>
      </div>

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
      </div>

      <div className="compiled-total">
        <span>Totale CFA:</span>
        <span className="total-value">{totalCFA}</span>
      </div>
    </div>
  )
}
