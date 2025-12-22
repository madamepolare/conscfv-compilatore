export async function loadData() {
  try {
    const response = await fetch('/data.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Il file data.json non contiene dati validi')
    }
    
    return data
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error)
    throw error
  }
}
