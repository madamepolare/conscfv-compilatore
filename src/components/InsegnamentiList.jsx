import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import InsegnamentoForm from './InsegnamentoForm'

export default function InsegnamentiList({ insegnamenti, data, onUpdate, onRemove, onDuplicate, onToggleCollapse, totalCFA }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.insegnamento-card')
      gsap.fromTo(items,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }
      )
    }
  }, [insegnamenti.length])

  if (insegnamenti.length === 0) {
    return (
      <div className="empty-state">
        <p>Nessuna attività formativa aggiunta</p>
        <p>Clicca su + Nuova attività formativa</p>
      </div>
    )
  }

  return (
    <div ref={listRef} className="insegnamenti-list">
      {insegnamenti.map((insegnamento, index) => (
        <InsegnamentoForm
          key={insegnamento.id}
          insegnamento={insegnamento}
          index={index}
          data={data}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onToggleCollapse={onToggleCollapse}
          totalCFA={totalCFA}
        />
      ))}
    </div>
  )
}
