export function filterSADByArea(data, area) {
  if (!area) return []
  
  const filteredData = data.filter(row => row.Area === area && row['SAD nuovo 1'])
  const sadSet = new Set()
  
  filteredData.forEach(row => {
    const sad = row['SAD nuovo 1']
    if (sad) sadSet.add(sad)
  })
  
  return Array.from(sadSet).sort((a, b) => {
    const matchA = a.match(/\d+$/)
    const matchB = b.match(/\d+$/)
    if (!matchA || !matchB) return 0
    return parseInt(matchA[0]) - parseInt(matchB[0])
  })
}

export function getDenominazioneSAD(data, sad) {
  if (!sad) return ''
  const row = data.find(r => r['SAD nuovo 1'] === sad)
  return row ? row['SAD nuovo nome 1'] || '' : ''
}

export function filterProfili(data, sadNuovo) {
  if (!sadNuovo) return []
  
  const filteredData = data.filter(row =>
    row['SAD nuovo 1'] === sadNuovo &&
    row.Profili &&
    row.Profili !== null
  )
  
  const profiliSet = new Set()
  filteredData.forEach(row => {
    if (row.Profili) profiliSet.add(row.Profili)
  })
  
  return Array.from(profiliSet).sort()
}

export function filterVecchiSAD(data, sadNuovo) {
  if (!sadNuovo) return []
  
  const filteredData = data.filter(row =>
    row['SAD nuovo 1'] === sadNuovo &&
    row['SAD vecchio 1'] &&
    row['SAD vecchio 1'] !== null
  )
  
  const sadVecchiSet = new Set()
  filteredData.forEach(row => {
    if (row['SAD vecchio 1']) sadVecchiSet.add(row['SAD vecchio 1'])
  })
  
  return Array.from(sadVecchiSet).sort()
}

export function getDenominazioneVecchioSAD(data, sadVecchio) {
  if (!sadVecchio) return ''
  const row = data.find(r => r['SAD vecchio 1'] === sadVecchio)
  return row ? row['SAD vecchio nome 1'] || '' : ''
}

export function filterCampiDisciplinari(data, sadVecchio) {
  if (!sadVecchio) return []
  
  const filteredData = data.filter(row =>
    row['SAD vecchio 1'] === sadVecchio &&
    row['Campi disciplinari'] &&
    row['Campi disciplinari'] !== null
  )
  
  const campiSet = new Set()
  filteredData.forEach(row => {
    if (row['Campi disciplinari']) {
      campiSet.add(row['Campi disciplinari'])
    }
  })
  
  return Array.from(campiSet).sort()
}
