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

export function filterVecchiSAD(data, area, sadNuovo) {
  if (!area || !sadNuovo) return []
  
  const sadVecchiSet = new Set()
  
  data.forEach(row => {
    if (row.Area === area && row['SAD nuovi'] && Array.isArray(row['SAD nuovi'])) {
      const hasSadNuovo = row['SAD nuovi'].some(s => s['SAD nuovo'] === sadNuovo)
      if (hasSadNuovo && row['SAD vecchio']) {
        sadVecchiSet.add(row['SAD vecchio'])
      }
    }
  })
  
  return Array.from(sadVecchiSet).sort()
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
