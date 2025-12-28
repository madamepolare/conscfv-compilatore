import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function CompiledView({ insegnamenti, provaFinale, titoloPDF, setTitoloPDF, creditiMassimi, setCreditiMassimi, totalCFA, tipoDiploma, areaAFAM, indirizzo }) {
  const viewRef = useRef(null)

  // Calculate number of exams
  const numeroEsami = insegnamenti.filter(ins => ins.tipologiaValutazione === 'Esame').length
  const isSecondoLivello = tipoDiploma === 'Diploma accademico di secondo livello'
  const esamiExceeded = isSecondoLivello && numeroEsami > 14

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

    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    // Titolo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(54, 52, 142) // #36348E
    doc.text(titoloPDF || 'Piano Didattico di Corso di Studi AFAM', 14, 15)
    
    // Tipo Diploma e Area AFAM
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(102, 102, 102)
    let yPos = 22
    if (tipoDiploma) {
      doc.text(`Tipo: ${tipoDiploma}`, 14, yPos)
      yPos += 4
    }
    if (areaAFAM) {
      doc.text(`Area AFAM: ${areaAFAM}`, 14, yPos)
      yPos += 4
    }
    if (indirizzo) {
      doc.text(`Indirizzo: ${indirizzo}`, 14, yPos)
      yPos += 4
    }
    
    // Data
    const dateObj = new Date()
    const dateDisplay = dateObj.toLocaleDateString('it-IT')
    doc.text(`Data: ${dateDisplay}`, 14, yPos)
    
    // Tabella dati
    const tableData = []
    
    // Aggiungi tutte le attività formative
    insegnamenti.forEach((ins, index) => {
      const rapporto = ins.cfa > 0 ? Math.round((ins.oreLezione || 0) / (25 * ins.cfa) * 100) + '%' : '-'
      
      if (ins.tipoAttivita === 'Insegnamento') {
        tableData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.vecchioSAD || '-',
          ins.denominazioneVecchioSAD || '-',
          ins.insegnamento || ins.campoDisciplinare || '-',
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
        tableData.push([
          index + 1,
          ins.tipoAttivita || '-',
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
    
    // Aggiungi Prova Finale se presente
    if (provaFinale && (provaFinale.descrizione || provaFinale.cfa > 0)) {
      tableData.push([
        'PF',
        'Prova Finale',
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
    tableData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTALE', totalCFA])
    
    doc.autoTable({
      head: [['#', 'Tipo Attività', 'Area AFAM', 'SAD', 'Denominazione SAD', 'Profilo', 'Vecchio SAD', 'Denominazione Vecchio SAD', 'Campo Disciplinare', 'Curvatura', 'Tipologia Attività Formativa', 'Tipologia Valutazione', 'Tipologia Lezione', 'Ore Lezione', 'Rapporto Ore/Crediti', 'Propedeuticità', 'CFA']],
      body: tableData,
      startY: yPos + 5,
      styles: { 
        fontSize: 6, 
        cellPadding: 1.5,
        font: 'helvetica',
        textColor: [41, 41, 41],
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [54, 52, 142], // #36348E
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        16: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: [247, 88, 56] } // CFA in arancione #F75838
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
    
    // Generate filename
    const pdfDate = new Date()
    const dateStr = `${String(pdfDate.getDate()).padStart(2, '0')}${String(pdfDate.getMonth() + 1).padStart(2, '0')}${String(pdfDate.getFullYear()).slice(-2)}`
    let filename = titoloPDF || 'piano_didattico_afam'
    if (indirizzo) {
      filename += `_${indirizzo}`
    }
    filename += `_${dateStr}`
    
    doc.save(`${filename}.pdf`)
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
    if (indirizzo) {
      excelData.push(['Indirizzo:', indirizzo])
    }
    excelData.push(['Data:', new Date().toLocaleDateString('it-IT')])
    excelData.push([]) // Riga vuota di separazione
    
    // Header
    excelData.push([
      '#', 'Tipo Attività', 'Area AFAM', 'SAD', 'Denominazione SAD', 
      'Profilo', 'Vecchio SAD', 'Denominazione Vecchio SAD', 'Campo Disciplinare', 
      'Curvatura', 'Tipologia Attività Formativa', 'Tipologia Valutazione', 
      'Tipologia Lezione', 'Ore Lezione', 'Rapporto Ore/Crediti', 'Propedeuticità', 'CFA'
    ])
    
    // Dati insegnamenti
    insegnamenti.forEach((ins, index) => {
      const rapporto = ins.cfa > 0 ? Math.round((ins.oreLezione || 0) / (25 * ins.cfa) * 100) + '%' : '-'
      
      if (ins.tipoAttivita === 'Insegnamento') {
        excelData.push([
          index + 1,
          ins.tipoAttivita || '-',
          ins.areaAFAM || '-',
          ins.sad || '-',
          ins.denominazioneSAD || '-',
          ins.profilo || '-',
          ins.vecchioSAD || '-',
          ins.denominazioneVecchioSAD || '-',
          ins.insegnamento || ins.campoDisciplinare || '-',
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
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTALE', totalCFA
    ])
    
    // Crea workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(excelData)
    
    // Imposta larghezza colonne
    ws['!cols'] = [
      { wch: 5 },   // #
      { wch: 15 },  // Tipo
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
    
    // Generate filename
    const dateObj2 = new Date()
    const dateStr = `${String(dateObj2.getDate()).padStart(2, '0')}${String(dateObj2.getMonth() + 1).padStart(2, '0')}${String(dateObj2.getFullYear()).slice(-2)}`
    let filename = titoloPDF || 'piano_didattico_afam'
    if (indirizzo) {
      filename += `_${indirizzo}`
    }
    filename += `_${dateStr}`
    
    // Salva file
    XLSX.writeFile(wb, `${filename}.xlsx`)
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
          <textarea
            value={titoloPDF}
            onChange={(e) => setTitoloPDF(e.target.value)}
            className="titolo-pdf-input"
            placeholder="Titolo corso di studi"
            rows="2"
            title="Modifica il nome del corso che apparirà nel PDF e Excel"
          />
          {indirizzo && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              Indirizzo: {indirizzo}
            </p>
          )}
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
            readOnly={!tipoDiploma.includes('Perfezionamento')}
            title={tipoDiploma.includes('Perfezionamento') 
              ? "Imposta il numero totale di crediti previsti per il corso di perfezionamento" 
              : "Crediti totali impostati automaticamente in base al tipo di diploma"}
          />
        </div>
        <div className="crediti-massimi-container">
          <label htmlFor="numero-esami">n. Esami:</label>
          <input
            id="numero-esami"
            type="number"
            value={numeroEsami}
            className={`crediti-massimi-input ${esamiExceeded ? 'input-error' : ''}`}
            readOnly
            title={isSecondoLivello ? `Per il diploma di secondo livello il numero massimo è 14 (attuale: ${numeroEsami})` : `Numero totale di esami nel piano didattico: ${numeroEsami}`}
          />
          {esamiExceeded && (
            <span className="validation-message error" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
              Superato il limite di 14 esami
            </span>
          )}
        </div>
      </div>

      {insegnamenti.length === 0 ? (
        <div className="compiled-empty">
          <p>Nessuna attività formativa aggiunta</p>
          <p>Clicca su + Nuova attività formativa</p>
        </div>
      ) : (
        <div className="compiled-list">
        {insegnamenti.map((ins, index) => (
          <div key={ins.id} className="compiled-item">
            <div className="compiled-header-line">
              <div className="compiled-number">#{index + 1}</div>
            </div>
            <div className="compiled-content">{/* Mostra tipo di attività */}
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

      {/* CFA Summary for "Diploma accademico di primo livello" */}
      {tipoDiploma === 'Diploma accademico di primo livello' && (
        <div className="cfa-summary">
          <div className="cfa-summary-row">
            <span className="label">CFA di base:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività di base')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA caratterizzanti:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività caratterizzanti')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA integrativi e affini:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività integrative/Affini')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA ulteriori:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività ulteriori' || ins.tipoAttivita === 'Altra attività formativa')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA prova finale e lingua straniera:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Lingua Straniera')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0) + (provaFinale?.cfa || 0)}
            </span>
          </div>
        </div>
      )}

      {/* CFA Summary for "Diploma accademico di secondo livello" */}
      {tipoDiploma === 'Diploma accademico di secondo livello' && (
        <div className="cfa-summary">
          <div className="cfa-summary-row">
            <span className="label">CFA di base:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività di base')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA caratterizzanti:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività caratterizzanti')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">Ulteriori CFA base/caratterizzanti:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Ulteriori CFA di base e caratterizzanti')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA integrativi e affini:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività integrative/Affini')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA ulteriori:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Attività ulteriori' || ins.tipoAttivita === 'Altra attività formativa')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0)}
            </span>
          </div>
          <div className="cfa-summary-row">
            <span className="label">CFA prova finale e lingua straniera:</span>
            <span className="value">
              {insegnamenti
                .filter(ins => ins.tipologiaAttivitaFormativa === 'Lingua Straniera')
                .reduce((sum, ins) => sum + (ins.cfa || 0), 0) + (provaFinale?.cfa || 0)}
            </span>
          </div>
        </div>
      )}

      <div className="compiled-total">
        <span>Totale CFA:</span>
        <span className="total-value">{totalCFA}</span>
      </div>
    </div>
  )
}
