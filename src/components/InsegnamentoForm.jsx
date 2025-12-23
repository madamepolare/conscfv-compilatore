import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react'
import {
  filterSADByArea,
  getDenominazioneSAD,
  filterProfili,
  filterVecchiSAD,
  getDenominazioneVecchioSAD,
  filterCampiDisciplinari
} from '../utils/dataFilters'

const AREA_OPTIONS = ['ABA', 'AND', 'ANAD', 'ISSM', 'ISIA']

export default function InsegnamentoForm({ insegnamento, index, data, onUpdate, onRemove }) {
  const [showFields, setShowFields] = useState(!!insegnamento.areaAFAM)
  const [collapsed, setCollapsed] = useState(false)
  const [isInsegnamentoLibero, setIsInsegnamentoLibero] = useState(insegnamento.tipoInsegnamento !== 'campoDisciplinare')
  const [sadOptions, setSadOptions] = useState([])
  const [profiliOptions, setProfiliOptions] = useState([])
  const [vecchiSADOptions, setVecchiSADOptions] = useState([])
  const [campiDisciplinariOptions, setCampiDisciplinariOptions] = useState([])
  
  const cardRef = useRef(null)
  const fieldsRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: insegnamento.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Check if form is complete
  const isComplete = insegnamento.areaAFAM && insegnamento.sad && insegnamento.cfa > 0

  useEffect(() => {
    if (cardRef.current && !isDragging) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
      )
    }
  }, [])

  useEffect(() => {
    if (showFields && fieldsRef.current) {
      gsap.fromTo(fieldsRef.current.children,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }
      )
    }
  }, [showFields])

  // Initialize dropdowns with existing data
  useEffect(() => {
    if (!data || data.length === 0) return
    
    if (insegnamento.areaAFAM) {
      const sads = filterSADByArea(data, insegnamento.areaAFAM)
      setSadOptions(sads)
      setShowFields(true)
      
      if (insegnamento.sad) {
        const profili = filterProfili(data, insegnamento.sad)
        const vecchiSAD = filterVecchiSAD(data, insegnamento.areaAFAM, insegnamento.sad)
        setProfiliOptions(profili)
        setVecchiSADOptions(vecchiSAD)
      }
    }
    
    // Initialize campi disciplinari separately to ensure it updates
    if (insegnamento.vecchioSAD) {
      const campi = filterCampiDisciplinari(data, insegnamento.vecchioSAD)
      setCampiDisciplinariOptions(campi)
    }
  }, [data, insegnamento.areaAFAM, insegnamento.sad, insegnamento.vecchioSAD])

  const handleAreaChange = (e) => {
    const area = e.target.value
    
    if (area) {
      setShowFields(true)
      const sads = filterSADByArea(data, area)
      setSadOptions(sads)
      
      onUpdate(insegnamento.id, {
        areaAFAM: area,
        sad: '',
        denominazioneSAD: '',
        profilo: '',
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        campoDisciplinare: ''
      })
    } else {
      setShowFields(false)
      setSadOptions([])
      setProfiliOptions([])
      setVecchiSADOptions([])
      setCampiDisciplinariOptions([])
      
      onUpdate(insegnamento.id, {
        areaAFAM: '',
        sad: '',
        denominazioneSAD: '',
        profilo: '',
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        campoDisciplinare: ''
      })
    }
  }

  const handleSADChange = (e) => {
    const sad = e.target.value
    
    if (sad) {
      const denominazione = getDenominazioneSAD(data, sad)
      const profili = filterProfili(data, sad)
      const vecchiSAD = filterVecchiSAD(data, insegnamento.areaAFAM, sad)
      
      setProfiliOptions(profili)
      setVecchiSADOptions(vecchiSAD)
      
      onUpdate(insegnamento.id, {
        sad,
        denominazioneSAD: denominazione,
        profilo: '',
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        campoDisciplinare: ''
      })
    } else {
      setProfiliOptions([])
      setVecchiSADOptions([])
      setCampiDisciplinariOptions([])
      
      onUpdate(insegnamento.id, {
        sad: '',
        denominazioneSAD: '',
        profilo: '',
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        campoDisciplinare: ''
      })
    }
  }

  const handleVecchioSADChange = (e) => {
    const vecchioSAD = e.target.value
    
    if (vecchioSAD) {
      const denominazione = getDenominazioneVecchioSAD(data, vecchioSAD)
      const campi = filterCampiDisciplinari(data, vecchioSAD)
      
      setCampiDisciplinariOptions(campi)
      
      onUpdate(insegnamento.id, {
        vecchioSAD,
        denominazioneVecchioSAD: denominazione,
        campoDisciplinare: ''
      })
    } else {
      setCampiDisciplinariOptions([])
      
      onUpdate(insegnamento.id, {
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        campoDisciplinare: ''
      })
    }
  }

  const handleRemove = () => {
    onRemove(insegnamento.id)
  }

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div 
      ref={(node) => {
        setNodeRef(node)
        cardRef.current = node
      }}
      style={style}
      id={`insegnamento-${insegnamento.id}`} 
      className={`insegnamento-card ${collapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-header">
        <div className="header-left">
          <button 
            className="drag-handle" 
            {...attributes} 
            {...listeners}
            title="Trascina per riordinare"
          >
            <GripVertical size={18} strokeWidth={1.5} />
          </button>
          <h3>#{index + 1}</h3>
          <input
            type="text"
            value={insegnamento.nomeAttivita || ''}
            onChange={(e) => onUpdate(insegnamento.id, { nomeAttivita: e.target.value })}
            className="nome-attivita-input"
            placeholder="Nome attività"
          />
          <div className="cfa-inline">
            <input
              type="number"
              value={insegnamento.cfa || 0}
              onChange={(e) => onUpdate(insegnamento.id, { cfa: parseInt(e.target.value) || 0 })}
              className="cfa-input-inline"
              min="0"
            />
            <span className="cfa-label">CFA</span>
          </div>
          {insegnamento.sad && !collapsed && (
            <span className="info-badge">{insegnamento.sad}</span>
          )}
        </div>
        <div className="header-right">
          {isComplete && (
            <button 
              className="btn-icon btn-collapse" 
              onClick={toggleCollapse}
              title={collapsed ? "Espandi" : "Comprimi"}
            >
              {collapsed ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronUp size={16} strokeWidth={1.5} />}
            </button>
          )}
          <button className="btn-icon btn-remove" onClick={handleRemove} title="Rimuovi">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="collapsed-view">
          <div className="collapsed-info">
            <span className="info-badge">{insegnamento.areaAFAM}</span>
            <span className="info-text">{insegnamento.sad}</span>
            <span className="info-badge cfa-badge">{insegnamento.cfa} CFA</span>
          </div>
          <p className="collapsed-title">{insegnamento.denominazioneSAD}</p>
        </div>
      ) : (
        <div className="form-grid">
          {/* SELEZIONE TIPO ATTIVITÀ */}
          <div className="form-group full-width">
            <label>Tipo di Attività Formativa *</label>
            <select
              value={insegnamento.tipoAttivita || 'Insegnamento'}
              onChange={(e) => onUpdate(insegnamento.id, { tipoAttivita: e.target.value })}
              className="form-control"
            >
              <option value="Insegnamento">Insegnamento</option>
              <option value="Laboratori">Laboratori</option>
              <option value="Seminari">Seminari</option>
              <option value="Masterclass">Masterclass</option>
              <option value="Altro">Altro</option>
            </select>
          </div>

          {/* MOSTRA FORM COMPLETO SOLO PER INSEGNAMENTO */}
          {insegnamento.tipoAttivita === 'Insegnamento' && (
            <>
              {/* CAMPO 1: AREA AFAM */}
              <div className="form-group">
                <label>AREA AFAM *</label>
                <select
                  value={insegnamento.areaAFAM}
                  onChange={handleAreaChange}
                  className="form-control"
                >
                  <option value="">Seleziona Area AFAM</option>
                  {AREA_OPTIONS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

          {showFields && (
            <div ref={fieldsRef} className="fields-container">
              {/* CAMPO 2: SAD */}
              <div className="form-group">
                <label>SAD *</label>
                <select
                  value={insegnamento.sad}
                  onChange={handleSADChange}
                  className="form-control"
                >
                  <option value="">Scegli SAD</option>
                  {sadOptions.map(sad => (
                    <option key={sad} value={sad}>{sad}</option>
                  ))}
                </select>
              </div>

              {/* CAMPO 3: Denominazione SAD */}
              <div className="form-group">
                <label>Denominazione SAD</label>
                <input
                  type="text"
                  value={insegnamento.denominazioneSAD}
                  className="form-control"
                  readOnly
                />
              </div>

              {/* CAMPO 4: Profilo */}
              <div className="form-group">
                <label>Profilo</label>
                <select
                  value={insegnamento.profilo}
                  onChange={(e) => onUpdate(insegnamento.id, { profilo: e.target.value })}
                  className="form-control"
                  disabled={profiliOptions.length === 0}
                >
                  <option value="">Seleziona Profilo</option>
                  {profiliOptions.map(profilo => (
                    <option key={profilo} value={profilo}>{profilo}</option>
                  ))}
                </select>
              </div>

              {/* CAMPO 5: CFA */}
              <div className="form-group">
                <label>CFA *</label>
                <input
                  type="number"
                  value={insegnamento.cfa}
                  onChange={(e) => onUpdate(insegnamento.id, { cfa: parseInt(e.target.value) || 0 })}
                  className="form-control"
                  min="0"
                />
              </div>

              {/* CAMPO 6: Vecchio/Vecchi SAD */}
              <div className="form-group">
                <label>Vecchio/Vecchi SAD</label>
                <select
                  value={insegnamento.vecchioSAD}
                  onChange={handleVecchioSADChange}
                  className="form-control"
                >
                  <option value="">Scegli SAD</option>
                  {vecchiSADOptions.map(sad => (
                    <option key={sad} value={sad}>{sad}</option>
                  ))}
                </select>
              </div>

              {/* CAMPO 7: Denominazione SAD vecchio */}
              <div className="form-group">
                <label>Denominazione SAD vecchio</label>
                <input
                  type="text"
                  value={insegnamento.denominazioneVecchioSAD}
                  className="form-control"
                  readOnly
                />
              </div>

              {/* SWITCHER: Insegnamento Libero vs Campo Disciplinare */}
              <div className="form-group full-width">
                <div className="switcher-container">
                  <label className="switcher-label">Tipo di insegnamento</label>
                  <div className="switcher-toggle">
                    <button
                      type="button"
                      className={`toggle-btn ${isInsegnamentoLibero ? 'active' : ''}`}
                      onClick={() => {
                        setIsInsegnamentoLibero(true)
                        onUpdate(insegnamento.id, { 
                          tipoInsegnamento: 'libero',
                          campoDisciplinare: '' 
                        })
                      }}
                    >
                      Insegnamento Libero
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!isInsegnamentoLibero ? 'active' : ''}`}
                      onClick={() => {
                        setIsInsegnamentoLibero(false)
                        onUpdate(insegnamento.id, { 
                          tipoInsegnamento: 'campoDisciplinare',
                          insegnamento: '' 
                        })
                      }}
                    >
                      Campo Disciplinare
                    </button>
                  </div>
                </div>
              </div>

              {/* CAMPO 8: Insegnamento (condizionale) */}
              {isInsegnamentoLibero && (
                <div className="form-group full-width">
                  <label>Insegnamento</label>
                  <textarea
                    value={insegnamento.insegnamento}
                    onChange={(e) => onUpdate(insegnamento.id, { insegnamento: e.target.value })}
                    className="form-control"
                    rows="3"
                    placeholder="Inserisci nome insegnamento"
                  />
                </div>
              )}

              {/* CAMPO 9: Campo disciplinare (condizionale) */}
              {!isInsegnamentoLibero && (
                <div className="form-group full-width">
                  <label>Campo Disciplinare</label>
                  <select
                    value={insegnamento.campoDisciplinare}
                    onChange={(e) => onUpdate(insegnamento.id, { campoDisciplinare: e.target.value })}
                    className="form-control"
                    disabled={campiDisciplinariOptions.length === 0}
                  >
                    <option value="">Seleziona Campo Disciplinare</option>
                    {campiDisciplinariOptions.map(campo => (
                      <option key={campo} value={campo}>{campo}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
