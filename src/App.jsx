import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import InsegnamentiList from './components/InsegnamentiList'
import CompiledView from './components/CompiledView'
import { loadData } from './utils/dataLoader'
import './styles/App.css'

const AREA_AFAM_OPTIONS = [
  { value: 'ABA', label: 'ABA - Accademie di Belle Arti' },
  { value: 'AND', label: 'AND - Accademia Nazionale di Danza' },
  { value: 'ANAD', label: 'ANAD - Accademia Nazionale di Arte Drammatica' },
  { value: 'ISSM', label: 'ISSM - Istituti Superiori di Studi Musicali' },
  { value: 'ISIA', label: 'ISIA - Istituti Superiori per le Industrie Artistiche' }
]



function App() {
  const [data, setData] = useState([])
  const [insegnamenti, setInsegnamenti] = useState([])
  const [provaFinale, setProvaFinale] = useState({ descrizione: '', cfa: 0, collapsed: false })
  const [titoloPDF, setTitoloPDF] = useState('Denominazione del corso di studi')
  const [creditiMassimi, setCreditiMassimi] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showInitialModal, setShowInitialModal] = useState(true)
  const [tipoDiploma, setTipoDiploma] = useState('')
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [areaAFAM, setAreaAFAM] = useState('')
  const [nomeCorso, setNomeCorso] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [activeTab, setActiveTab] = useState('working') // 'working' or 'recap'
  // Draft-related state removed
  const stepContentRef = useRef(null)
  const modalContainerRef = useRef(null)

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
      curvatura: '',
      tipologiaValutazione: '',
      tipologiaLezione: '',
      oreLezione: 0,
      propedeuticita: '',
      tipoInsegnamento: 'campoDisciplinare',
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

    if (over && active.id !== over.id) {
      setInsegnamenti((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const totalCFA = insegnamenti.reduce((sum, ins) => sum + (ins.cfa || 0), 0) + (provaFinale.cfa || 0)

  const animateStepTransition = (nextStep) => {
    if (stepContentRef.current) {
      gsap.to(stepContentRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setOnboardingStep(nextStep)
          gsap.fromTo(stepContentRef.current, 
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
          )
        }
      })
    } else {
      setOnboardingStep(nextStep)
    }
  }

  const handleNextStep = () => {
    if (onboardingStep === 1 && tipoDiploma) {
      animateStepTransition(2)
    } else if (onboardingStep === 2 && areaAFAM) {
      animateStepTransition(3)
    } else if (onboardingStep === 3 && nomeCorso.trim()) {
      setTitoloPDF(nomeCorso)
      // Chiudi il modal direttamente senza animazione per evitare problemi
      setShowInitialModal(false)
    }
  }

  const handlePrevStep = () => {
    if (onboardingStep > 1) {
      gsap.to(stepContentRef.current, {
        opacity: 0,
        x: 30,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setOnboardingStep(onboardingStep - 1)
          gsap.fromTo(stepContentRef.current, 
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
          )
        }
      })
    }
  }

  const isCurrentStepValid = () => {
    if (onboardingStep === 1) return !!tipoDiploma
    if (onboardingStep === 2) return !!areaAFAM
    if (onboardingStep === 3) return !!nomeCorso.trim()
    return false
  }

  // Modal iniziale multi-step (mostra prima del loading check)
  if (showInitialModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-container onboarding-modal" ref={modalContainerRef}>
          {/* Progress indicator */}
          <div className="onboarding-progress">
            <div className={`progress-step ${onboardingStep >= 1 ? 'active' : ''} ${onboardingStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <span className="step-label">Diploma</span>
            </div>
            <div className="progress-line">
              <div className={`progress-fill ${onboardingStep > 1 ? 'filled' : ''}`}></div>
            </div>
            <div className={`progress-step ${onboardingStep >= 2 ? 'active' : ''} ${onboardingStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Area</span>
            </div>
            <div className="progress-line">
              <div className={`progress-fill ${onboardingStep > 2 ? 'filled' : ''}`}></div>
            </div>
            <div className={`progress-step ${onboardingStep >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">Corso</span>
            </div>
          </div>

          {/* Step content */}
          <div className="step-content" ref={stepContentRef}>
            {onboardingStep === 1 && (
              <>
                <div className="step-icon">🎓</div>
                <h2>Tipo di Diploma</h2>
                <p>Seleziona il tipo di diploma per questo piano didattico</p>
                <div className="modal-form">
                  <select
                    value={tipoDiploma}
                    onChange={(e) => setTipoDiploma(e.target.value)}
                    className="form-control modal-select"
                  >
                    <option value="">Seleziona tipo diploma...</option>
                    <option value="Diploma accademico di primo livello">Diploma accademico di primo livello</option>
                    <option value="Diploma accademico di secondo livello">Diploma accademico di secondo livello</option>
                    <option value="Diploma di Perfezionamento di primo livello">Diploma di Perfezionamento di primo livello</option>
                    <option value="Diploma di Perfezionamento di secondo livello">Diploma di Perfezionamento di secondo livello</option>
                    <option value="Master di primo livello">Master di primo livello</option>
                    <option value="Master di secondo livello">Master di secondo livello</option>
                  </select>
                </div>
              </>
            )}

            {onboardingStep === 2 && (
              <>
                <div className="step-icon">🏛️</div>
                <h2>Area AFAM</h2>
                <p>Seleziona l'area di riferimento del corso</p>
                <div className="modal-form">
                  <div className="area-grid">
                    {AREA_AFAM_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        className={`area-option ${areaAFAM === option.value ? 'selected' : ''}`}
                        onClick={() => setAreaAFAM(option.value)}
                      >
                        <span className="area-code">{option.value}</span>
                        <span className="area-name">{option.label.split(' - ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {onboardingStep === 3 && (
              <>
                <div className="step-icon">📚</div>
                <h2>Nome del Corso</h2>
                <p>Inserisci il nome completo del corso di studi</p>
                <div className="modal-form">
                  <textarea
                    value={nomeCorso}
                    onChange={(e) => setNomeCorso(e.target.value)}
                    className="form-control modal-input"
                    placeholder="Es. Diploma Accademico di I livello in Design"
                    autoFocus
                    rows="3"
                  />
                  <input
                    type="text"
                    value={indirizzo}
                    onChange={(e) => setIndirizzo(e.target.value)}
                    className="form-control modal-input"
                    placeholder="Indirizzo (opzionale)"
                    style={{ marginTop: '1rem' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="onboarding-buttons">
            {onboardingStep > 1 && (
              <button className="btn-modal-back" onClick={handlePrevStep}>
                ← Indietro
              </button>
            )}
            <button
              className="btn-modal-confirm"
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
            >
              {onboardingStep === 3 ? 'Inizia' : 'Avanti →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
      {/* Tab Switcher */}
      <div className="tab-switcher-container">
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'working' ? 'active' : ''}`}
            onClick={() => setActiveTab('working')}
            title="Inserisci e modifica le attività formative del piano didattico"
          >
            ✏️ Inserimento
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recap' ? 'active' : ''}`}
            onClick={() => setActiveTab('recap')}
            title="Visualizza il riepilogo completo ed esporta il piano didattico"
          >
            📋 Riepilogo
          </button>
          <div className={`tab-indicator ${activeTab === 'recap' ? 'right' : ''}`}></div>
        </div>
        

      </div>



      <div className="tab-content">
        {/* Working Tab */}
        {activeTab === 'working' && (
          <div className="working-tab">
            <div className="tab-header">
              <h2>Aggiungi Attività Formative</h2>
              <button 
                className="btn-add" 
                onClick={addInsegnamento}
                title="Aggiungi una nuova attività formativa (insegnamento o altra attività) al piano didattico"
              >
                + Nuova Attività Formativa
              </button>
            </div>
            
            <div className="tab-body">
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
              
              {/* Prova Finale */}
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
          </div>
        )}

        {/* Recap Tab */}
        {activeTab === 'recap' && (
          <div className="recap-tab">
            <div className="tab-header">
              <h2>Riepilogo Piano Didattico</h2>
              <div className="export-buttons">
                <button 
                  className="btn-excel" 
                  onClick={() => document.querySelector('.compiled-view').dispatchEvent(new CustomEvent('generateExcel'))}
                  title="Esporta il piano didattico in formato Excel (.xlsx)"
                >
                  📊 Esporta Excel
                </button>
                <button 
                  className="btn-pdf" 
                  onClick={() => document.querySelector('.compiled-view').dispatchEvent(new CustomEvent('generatePDF'))}
                  title="Genera e scarica il piano didattico in formato PDF"
                >
                  📄 Genera PDF
                </button>
              </div>
            </div>
            <div className="tab-body">
              <CompiledView 
                insegnamenti={insegnamenti}
                provaFinale={provaFinale}
                titoloPDF={titoloPDF}
                setTitoloPDF={setTitoloPDF}
                creditiMassimi={creditiMassimi}
                setCreditiMassimi={setCreditiMassimi}
                totalCFA={totalCFA}
                tipoDiploma={tipoDiploma}
                areaAFAM={areaAFAM}
                indirizzo={indirizzo}
              />
            </div>
          </div>
        )}
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
