import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function CompiledView({ insegnamenti, provaFinale, titoloPDF, setTitoloPDF, creditiMassimi, setCreditiMassimi, totalCFA, tipoDiploma, areaAFAM }) {
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
    const handleGenerateExcel = () => generateExcel()
    if (viewRef.current) {
      viewRef.current.addEventListener('generatePDF', handleGeneratePDF)
      viewRef.current.addEventListener('generateExcel', handleGenerateExcel)
      return () => {
        viewRef.current?.removeEventListener('generatePDF', handleGeneratePDF)
        viewRef.current?.removeEventListener('generateExcel', handleGenerateExcel)
      }
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
    
    // Tipo Diploma e Area AFAM
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(102, 102, 102)
    let yPos = 28
    if (tipoDiploma) {
      doc.text(`Tipo: ${tipoDiploma}`, 14, yPos)
      yPos += 5
    }
    if (areaAFAM) {
      doc.text(`Area AFAM: ${areaAFAM}`, 14, yPos)
      yPos += 5
    }
    
    // Data
    const date = new Date().toLocaleDateString('it-IT')
    doc.text(`Data: ${date}`, 14, yPos)
    
    // Tabella dati
    const tableData = []
    
    // Aggiungi tutte le attività formative
    insegnamenti.forEach((ins, index) => {
      if (ins.tipoAttivita === 'Insegnamento') {
        // Insegnamento completo - build details string
        let details = ins.insegnamento || ins.campoDisciplinare || '-'
        if (ins.tipologiaAttivitaFormativa) {
          details += ` | Tip: ${ins.tipologiaAttivitaFormativa}`
        }
        if (ins.curvatura) {
          details += ` | Curv: ${ins.curvatura}`
        }
        if (ins.tipologiaValutazione) {
          details += ` | Val: ${ins.tipologiaValutazione}`
        }
        if (ins.tipologiaLezione) {
          details += ` | Lez: ${ins.tipologiaLezione}`
        }
        if (ins.oreLezione) {
          details += ` | Ore: ${ins.oreLezione}`
        }
        if (ins.oreLezione && ins.cfa > 0) {
          details += ` | Rapp: ${((ins.oreLezione / (25 * ins.cfa)) * 100).toFixed(1)}%`
        }
        if (ins.propedeuticita) {
          details += ` | Prop: ${ins.propedeuticita}`
        }
        
        tableData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.cfa || 0,
          details
        ])
      } else {
        // Altre attività formative
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
      startY: yPos + 8,
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
    
    doc.save(`${titoloPDF || 'piano_didattico_afam'}.pdf`)
  }

  const generateExcel = () => {
    if (insegnamenti.length === 0 && (!provaFinale || (!provaFinale.descrizione && !provaFinale.cfa))) {
      alert('Aggiungi almeno un\'attività prima di generare il file Excel.')
      return
    }

    // Prepara i dati per Excel
    const excelData = []
    
    // Info corso
    excelData.push(['Piano Didattico:', titoloPDF || 'Piano Didattico di Corso di Studi AFAM'])
    if (tipoDiploma) {
      excelData.push(['Tipo Diploma:', tipoDiploma])
    }
    if (areaAFAM) {
      excelData.push(['Area AFAM:', areaAFAM])
    }
    excelData.push(['Data:', new Date().toLocaleDateString('it-IT')])
    excelData.push([]) // Riga vuota di separazione
    
    // Header
    excelData.push([
      '#', 'Tipo Attività', 'Nome Attività', 'Area AFAM', 'SAD', 'Denominazione SAD', 
      'Profilo', 'Vecchio SAD', 'Denominazione Vecchio SAD', 'Campo Disciplinare', 
      'Curvatura', 'Tipologia Attività Formativa', 'Tipologia Valutazione', 
      'Tipologia Lezione', 'Ore Lezione', 'Rapporto Ore/Crediti', 'Propedeuticità', 'CFA'
    ])
    
    // Dati insegnamenti
    insegnamenti.forEach((ins, index) => {
      const rapporto = ins.cfa > 0 ? ((ins.oreLezione || 0) / (25 * ins.cfa) * 100).toFixed(1) + '%' : '-'
      
      if (ins.tipoAttivita === 'Insegnamento') {
        excelData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.vecchioSAD || '-',
          ins.denominazioneVecchioSAD || '-',
          ins.campoDisciplinare || '-',
          ins.curvatura || '-',
          ins.tipologiaAttivitaFormativa || '-',
          ins.tipologiaValutazione || '-',
          ins.tipologiaLezione || '-',
          ins.oreLezione || '-',
          rapporto,
          ins.propedeuticita || '-',
          ins.cfa || 0
        ])
      } else {
        // Altre attività formative
        excelData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.nomeAttivita || '-',
          '-',
          '-',
          ins.insegnamento || '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          ins.cfa || 0
        ])
      }
    })
    
    // Prova Finale
    if (provaFinale && (provaFinale.descrizione || provaFinale.cfa > 0)) {
      excelData.push([
        'PF',
        'Prova Finale',
        '-',
        '-',
        '-',
        provaFinale.descrizione || '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        provaFinale.cfa || 0
      ])
    }
    
    // Riga totale
    excelData.push([
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTALE', totalCFA
    ])
    
    // Crea workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    
    // Imposta larghezza colonne
    ws['!cols'] = [
      { wch: 5 },   // #
      { wch: 15 },  // Tipo
      { wch: 20 },  // Nome
      { wch: 10 },  // Area
      { wch: 12 },  // SAD
      { wch: 30 },  // Denominazione
      { wch: 20 },  // Profilo
      { wch: 12 },  // Vecchio SAD
      { wch: 30 },  // Denom Vecchio
      { wch: 25 },  // Campo Disc
      { wch: 20 },  // Curvatura
      { wch: 20 },  // Tip Attività
      { wch: 15 },  // Tip Valut
      { wch: 20 },  // Tip Lezione
      { wch: 10 },  // Ore
      { wch: 15 },  // Rapporto
      { wch: 12 },  // Propedeuticità
      { wch: 8 }    // CFA
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Piano Didattico')
    
    // Salva file
    XLSX.writeFile(wb, `${titoloPDF || 'piano_didattico_afam'}.xlsx`)
  }

  return (
    <div ref={viewRef} className="compiled-view">
      {(tipoDiploma || areaAFAM) && (
        <div className="corso-badges">
          {tipoDiploma && (
            <div className="tipo-diploma-badge">
              {tipoDiploma}
            </div>
          )}
          {areaAFAM && (
            <div className="area-afam-badge">
              {areaAFAM}
            </div>
          )}
        </div>
      )}
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
          <label htmlFor="crediti-massimi">Crediti totali:</label>
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
                  {ins.tipologiaAttivitaFormativa && (
                    <div className="compiled-row">
                      <span className="label">Tipologia Attività:</span>
                      <span className="value">{ins.tipologiaAttivitaFormativa}</span>
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
                  {ins.curvatura && (
                    <div className="compiled-row">
                      <span className="label">Curvatura:</span>
                      <span className="value">{ins.curvatura}</span>
                    </div>
                  )}
                  {ins.tipologiaValutazione && (
                    <div className="compiled-row">
                      <span className="label">Tipologia Valutazione:</span>
                      <span className="value">{ins.tipologiaValutazione}</span>
                    </div>
                  )}
                  {ins.tipologiaLezione && (
                    <div className="compiled-row">
                      <span className="label">Tipologia Lezione:</span>
                      <span className="value">{ins.tipologiaLezione}</span>
                    </div>
                  )}
                  {ins.oreLezione > 0 && (
                    <div className="compiled-row">
                      <span className="label">Ore di lezione:</span>
                      <span className="value">{ins.oreLezione}</span>
                    </div>
                  )}
                  {ins.oreLezione > 0 && ins.cfa > 0 && (
                    <div className="compiled-row">
                      <span className="label">Rapporto Ore/Crediti:</span>
                      <span className="value">{((ins.oreLezione / (25 * ins.cfa)) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {ins.propedeuticita && (
                    <div className="compiled-row">
                      <span className="label">Propedeuticità:</span>
                      <span className="value">{ins.propedeuticita}</span>
                    </div>
                  )}
                </>
              ) : (
                /* Per altre attività formative mostra solo descrizione */
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
