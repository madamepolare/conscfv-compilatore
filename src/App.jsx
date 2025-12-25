import { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import InsegnamentiList from './components/InsegnamentiList'
import CompiledView from './components/CompiledView'
import { loadData } from './utils/dataLoader'
import './styles/App.css'

function App() {
  const [data, setData] = useState([])
  const [insegnamenti, setInsegnamenti] = useState([])
  const [provaFinale, setProvaFinale] = useState({ descrizione: '', cfa: 0, collapsed: false })
  const [titoloPDF, setTitoloPDF] = useState('Denominazione del corso di studi')
  const [creditiMassimi, setCreditiMassimi] = useState(0)
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    loadData()
      .then(loadedData => {
        setData(loadedData)
        setLoading(false)
        console.log('✅ Dati caricati:', loadedData.length, 'righe')
      })
      .catch(error => {
        console.error('❌ Errore caricamento dati:', error)
        setLoading(false)
      })
  }, [])

  const addInsegnamento = () => {
    const newInsegnamento = {
      id: Date.now(),
      tipoAttivita: '',
      nomeAttivita: '',
      areaAFAM: '',
      sad: '',
      denominazioneSAD: '',
      profilo: '',
      cfa: 0,
      tipologiaAttivitaFormativa: '',
      vecchioSAD: '',
      denominazioneVecchioSAD: '',
      insegnamento: '',
      campoDisciplinare: '',
      tipologiaValutazione: '',
      tipologiaLezione: '',
      tipoInsegnamento: 'libero',
      collapsed: false
    }
    setInsegnamenti([...insegnamenti, newInsegnamento])
  }

  const updateInsegnamento = (id, updates) => {
    setInsegnamenti(insegnamenti.map(ins => 
      ins.id === id ? { ...ins, ...updates } : ins
    ))
  }

  const toggleCollapse = (id) => {
    setInsegnamenti(insegnamenti.map(ins =>
      ins.id === id ? { ...ins, collapsed: !ins.collapsed } : ins
    ))
  }

  const removeInsegnamento = (id) => {
    // Animate out before removing
    gsap.to(`#insegnamento-${id}`, {
      opacity: 0,
      x: -100,
      duration: 0.3,
      onComplete: () => {
        setInsegnamenti(insegnamenti.filter(ins => ins.id !== id))
      }
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setInsegnamenti((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const totalCFA = insegnamenti.reduce((sum, ins) => sum + (ins.cfa || 0), 0) + (provaFinale.cfa || 0)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Caricamento dati...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="left-column">
          <div className="column-header">
            <h2>Aggiungi Attività Formative</h2>
            <button className="btn-add" onClick={addInsegnamento}>
              + Nuova Attività Formativa
            </button>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={insegnamenti.map(ins => ins.id)}
              strategy={verticalListSortingStrategy}
            >
              <InsegnamentiList
                insegnamenti={insegnamenti}
                data={data}
                onUpdate={updateInsegnamento}
                onRemove={removeInsegnamento}
                onToggleCollapse={toggleCollapse}
              />
            </SortableContext>
          </DndContext>
          
          {/* Prova Finale - sempre alla fine */}
          <div className="prova-finale-container">
            <div className={`prova-finale-card ${provaFinale.collapsed ? 'collapsed' : ''}`}>
              <div className="card-header">
                <div className="header-left">
                  <h3>Prova Finale</h3>
                </div>
                <div className="header-right">
                  <button 
                    className="btn-icon btn-collapse" 
                    onClick={() => setProvaFinale({ ...provaFinale, collapsed: !provaFinale.collapsed })}
                    title={provaFinale.collapsed ? "Espandi" : "Comprimi"}
                  >
                    {provaFinale.collapsed ? '▼' : '▲'}
                  </button>
                </div>
              </div>
              {!provaFinale.collapsed && (
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Descrizione</label>
                    <textarea
                      value={provaFinale.descrizione}
                      onChange={(e) => setProvaFinale({ ...provaFinale, descrizione: e.target.value })}
                      className="form-control"
                      rows="4"
                      placeholder="Inserisci descrizione della prova finale"
                    />
                  </div>
                  <div className="form-group">
                    <label>Crediti (CFA) *</label>
                    <input
                      type="number"
                      value={provaFinale.cfa || 0}
                      onChange={(e) => setProvaFinale({ ...provaFinale, cfa: parseInt(e.target.value) || 0 })}
                      className="form-control"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="column-header">
            <h2>Riepilogo Piano Didattico</h2>
            <button className="btn-pdf" onClick={() => document.querySelector('.compiled-view').dispatchEvent(new CustomEvent('generatePDF'))}>
              📄 Genera PDF
            </button>
          </div>
          <CompiledView 
            insegnamenti={insegnamenti}
            provaFinale={provaFinale}
            titoloPDF={titoloPDF}
            setTitoloPDF={setTitoloPDF}
            creditiMassimi={creditiMassimi}
            setCreditiMassimi={setCreditiMassimi}
            totalCFA={totalCFA}
          />
        </div>
      </div>

      <div className={`total-cfa-fixed ${
        creditiMassimi > 0 ? (
          totalCFA === creditiMassimi ? 'valid' : 
          totalCFA > creditiMassimi ? 'exceeded' : 'missing'
        ) : ''
      }`}>
        <strong>Totale CFA:</strong>
        <span className="cfa-value">
          {creditiMassimi > 0 ? `${totalCFA}/${creditiMassimi}` : totalCFA}
        </span>
        {creditiMassimi > 0 && totalCFA === creditiMassimi && <span className="status-text">✓ Completo</span>}
        {creditiMassimi > 0 && totalCFA > creditiMassimi && <span className="status-text">⚠ Superati di {totalCFA - creditiMassimi}</span>}
        {creditiMassimi > 0 && totalCFA < creditiMassimi && <span className="status-text">⚠ Mancanti {creditiMassimi - totalCFA}</span>}
      </div>
    </div>
  )
}

export default App
