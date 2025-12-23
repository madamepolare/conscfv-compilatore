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
      tipoAttivita: 'Insegnamento',
      nomeAttivita: '',
      areaAFAM: '',
      sad: '',
      denominazioneSAD: '',
      profilo: '',
      cfa: 0,
      vecchioSAD: '',
      denominazioneVecchioSAD: '',
      insegnamento: '',
      campoDisciplinare: '',
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

  const totalCFA = insegnamenti.reduce((sum, ins) => sum + (ins.cfa || 0), 0)

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
        </div>

        <div className="right-column">
          <div className="column-header">
            <h2>Riepilogo Piano Didattico</h2>
          </div>
          <CompiledView 
            insegnamenti={insegnamenti}
            totalCFA={totalCFA}
          />
        </div>
      </div>

      <div className="total-cfa-fixed">
        <strong>Totale CFA:</strong>
        <span className="cfa-value">{totalCFA}</span>
      </div>
    </div>
  )
}

export default App
