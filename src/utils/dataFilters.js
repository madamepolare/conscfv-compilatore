/**
 * Normalizza una stringa in token (parole) comparabili.
 */
function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // rimuove diacritici
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9àèìòù\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Verifica se due stringhe hanno almeno una parola in comune
 */
function hasCommonWord(a, b) {
  const A = new Set(tokenize(a))
  const B = new Set(tokenize(b))
  if (A.size === 0 || B.size === 0) return false
  
  for (const x of A) {
    if (B.has(x)) return true
  }
  return false
}

/**
 * Similarità Jaccard su insiemi di parole:
 * |intersezione| / |unione|
 */
function jaccard(a, b) {
  const A = new Set(tokenize(a))
  const B = new Set(tokenize(b))
  if (A.size === 0 && B.size === 0) return 1
  if (A.size === 0 || B.size === 0) return 0

  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const uni = A.size + B.size - inter
  return uni === 0 ? 0 : inter / uni
}

/**
 * Trova il SAD vecchio e il campo disciplinare più simile al profilo scelto.
 * 
 * @param {Array} data - array di oggetti del JSON
 * @param {string} sadNuovoCercato - il SAD nuovo selezionato
 * @param {string} profiloCercato - il profilo scelto dall'utente
 * @param {boolean} softMatch - se true, confronta ignorando maiuscole/spazi
 * @return {object|null} risultato con SAD vecchio + best campo + score, oppure null
 */
export function trovaSADVecchioConBestCampo(data, sadNuovoCercato, profiloCercato, softMatch = true) {
  if (!sadNuovoCercato || !profiloCercato) return null
  
  const norm = (s) => (s || "").toLowerCase().trim()

  for (const obj of data) {
    const sadVecchio = obj["SAD vecchio"]
    const sadVecchioNome = obj["SAD vecchio nome"] || ""
    const campi = obj["Campi disciplinari"] || []
    const sadNuovi = obj["SAD nuovi"] || []

    for (const sn of sadNuovi) {
      const sadNuovo = sn["SAD nuovo"]
      const okSad = softMatch 
        ? (norm(sadNuovo) === norm(sadNuovoCercato)) 
        : (sadNuovo === sadNuovoCercato)
      
      if (!okSad) continue

      const profili = sn["Profili"] || []

      // match del profilo scelto dentro profili
      let profiloTrovato = null
      if (softMatch) {
        for (const p of profili) {
          if (norm(p) === norm(profiloCercato)) { 
            profiloTrovato = p
            break 
          }
        }
      } else {
        if (profili.includes(profiloCercato)) profiloTrovato = profiloCercato
      }

      if (!profiloTrovato) continue

      // Calcola similarità con "Campi disciplinari" nello stesso oggetto
      let bestCampo = null
      let bestScore = -1

      for (const c of campi) {
        const score = jaccard(profiloTrovato, c)
        if (score > bestScore) {
          bestScore = score
          bestCampo = c
        }
      }

      return {
        sadVecchio,
        sadVecchioNome,
        sadNuovo,
        profilo: profiloTrovato,
        bestCampoDisciplinare: bestCampo,
        score: bestScore
      }
    }
  }

  return null
}

export function filterSADByArea(data, area) {
  if (!area) return []
  
  const sadSet = new Set()
  
  data.forEach(row => {
    if (row.Area === area && row['SAD nuovi'] && Array.isArray(row['SAD nuovi'])) {
      row['SAD nuovi'].forEach(sad => {
        if (sad['SAD nuovo']) {
          sadSet.add(sad['SAD nuovo'])
        }
      })
    }
  })
  
  return Array.from(sadSet).sort((a, b) => {
    const matchA = a.match(/\d+$/)
    const matchB = b.match(/\d+$/)
    if (!matchA || !matchB) return 0
    return parseInt(matchA[0]) - parseInt(matchB[0])
  })
}

export function getDenominazioneSAD(data, sadNuovo) {
  if (!sadNuovo) return ''
  
  for (const row of data) {
    if (row['SAD nuovi'] && Array.isArray(row['SAD nuovi'])) {
      const found = row['SAD nuovi'].find(s => s['SAD nuovo'] === sadNuovo)
      if (found && found['SAD nuovo nome']) {
        return found['SAD nuovo nome']
      }
    }
  }
  return ''
}

export function filterProfili(data, sadNuovo) {
  if (!sadNuovo) return []
  
  for (const row of data) {
    if (row['SAD nuovi'] && Array.isArray(row['SAD nuovi'])) {
      const found = row['SAD nuovi'].find(s => s['SAD nuovo'] === sadNuovo)
      if (found && found.Profili && Array.isArray(found.Profili)) {
        return found.Profili.length > 0 ? found.Profili : ['- - -']
      }
    }
  }
  return ['- - -']
}

export function filterVecchiSAD(data, area, sadNuovo, profilo = null) {
  if (!area || !sadNuovo) return []
  
  const sadVecchiList = []
  
  data.forEach(row => {
    if (row.Area === area && row['SAD nuovi'] && Array.isArray(row['SAD nuovi'])) {
      const hasSadNuovo = row['SAD nuovi'].some(s => s['SAD nuovo'] === sadNuovo)
      if (hasSadNuovo && row['SAD vecchio']) {
        const sadVecchioNome = row['SAD vecchio nome'] || ''
        
        // Se c'è un profilo, filtra solo i SAD vecchi con almeno una parola in comune
        if (profilo) {
          if (hasCommonWord(profilo, sadVecchioNome)) {
            sadVecchiList.push({
              codice: row['SAD vecchio'],
              nome: sadVecchioNome
            })
          }
        } else {
          sadVecchiList.push({
            codice: row['SAD vecchio'],
            nome: sadVecchioNome
          })
        }
      }
    }
  })
  
  // Rimuovi duplicati e restituisci solo i codici
  const uniqueCodici = [...new Set(sadVecchiList.map(s => s.codice))]
  return uniqueCodici.sort()
}

export function getDenominazioneVecchioSAD(data, sadVecchio) {
  if (!sadVecchio) return ''
  const row = data.find(r => r['SAD vecchio'] === sadVecchio)
  return row ? row['SAD vecchio nome'] || '' : ''
}

export function filterCampiDisciplinari(data, sadVecchio) {
  if (!sadVecchio) return []
  
  const row = data.find(r => r['SAD vecchio'] === sadVecchio)
  
  if (row && row['Campi disciplinari'] && Array.isArray(row['Campi disciplinari'])) {
    return row['Campi disciplinari'].sort()
  }
  
  return []
}
