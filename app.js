let data = [];
let insegnamentiCounter = 0;
let insegnamentiList = [];

// Carica i dati dal file JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Il file data.json non contiene dati validi');
        }
        
        console.log('✓ Dati caricati correttamente:', data.length, 'righe');
        console.log('✓ Esempio prima riga:', data[0]);
        
        // Verifica la presenza delle colonne necessarie
        const requiredColumns = ['SAD vecchio 1', 'SAD vecchio nome 1', 'SAD nuovo 1', 'SAD nuovo nome 1', 'Area', 'Profili', 'Campi disciplinari'];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            console.warn('⚠ Colonne mancanti:', missingColumns);
        }
        
    } catch (error) {
        console.error('✗ Errore nel caricamento dei dati:', error);
        alert('Errore nel caricamento dei dati: ' + error.message + '\n\nAssicurati che il file data.json sia presente nella stessa cartella di index.html.');
    }
}

// Inizializza l'applicazione
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    
    document.getElementById('addInsegnamento').addEventListener('click', addInsegnamento);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    
    // Aggiungi il primo insegnamento automaticamente
    addInsegnamento();
});

// Aggiungi un nuovo insegnamento
function addInsegnamento() {
    insegnamentiCounter++;
    const id = insegnamentiCounter;
    
    const insegnamento = {
        id: id,
        areaAFAM: '',
        sad: '',
        denominazioneSAD: '',
        profilo: '',
        cfa: 0,
        vecchioSAD: '',
        denominazioneVecchioSAD: '',
        insegnamento: '',
        campoDisciplinare: ''
    };
    
    insegnamentiList.push(insegnamento);
    
    const container = document.getElementById('insegnamentiContainer');
    const insegnamentoDiv = createInsegnamentoForm(id);
    container.appendChild(insegnamentoDiv);
}

// Crea il form per un insegnamento
function createInsegnamentoForm(id) {
    const div = document.createElement('div');
    div.className = 'insegnamento-card';
    div.id = `insegnamento-${id}`;
    
    div.innerHTML = `
        <div class="card-header">
            <h3>Insegnamento #${id}</h3>
            <button class="btn-delete" onclick="removeInsegnamento(${id})">× Rimuovi</button>
        </div>
        <div class="form-grid">
            <!-- CAMPO 1: AREA AFAM -->
            <div class="form-group">
                <label for="areaAFAM-${id}">AREA AFAM *</label>
                <select id="areaAFAM-${id}" class="form-control" onchange="onAreaAFAMChange(${id})">
                    <option value="">Seleziona Area AFAM</option>
                    <option value="ABA">ABA</option>
                    <option value="AND">AND</option>
                    <option value="ANAD">ANAD</option>
                    <option value="ISSM">ISSM</option>
                    <option value="ISIA">ISIA</option>
                </select>
            </div>
            
            <!-- CAMPO 2: SAD -->
            <div class="form-group" id="sadGroup-${id}" style="display: none;">
                <label for="sad-${id}">SAD *</label>
                <select id="sad-${id}" class="form-control" onchange="onSADChange(${id})">
                    <option value="">Scegli SAD</option>
                </select>
            </div>
            
            <!-- CAMPO 3: Denominazione SAD -->
            <div class="form-group" id="denominazioneSADGroup-${id}" style="display: none;">
                <label for="denominazioneSAD-${id}">Denominazione SAD</label>
                <input type="text" id="denominazioneSAD-${id}" class="form-control" readonly>
            </div>
            
            <!-- CAMPO 4: Profilo -->
            <div class="form-group" id="profiloGroup-${id}" style="display: none;">
                <label for="profilo-${id}">Profilo</label>
                <select id="profilo-${id}" class="form-control" onchange="onProfiloChange(${id})">
                    <option value="">Seleziona Profilo</option>
                </select>
            </div>
            
            <!-- CAMPO 5: CFA -->
            <div class="form-group" id="cfaGroup-${id}" style="display: none;">
                <label for="cfa-${id}">CFA *</label>
                <input type="number" id="cfa-${id}" class="form-control" min="0" onchange="onCFAChange(${id})" value="0">
            </div>
            
            <!-- CAMPO 6: Vecchio/Vecchi SAD -->
            <div class="form-group" id="vecchioSADGroup-${id}" style="display: none;">
                <label for="vecchioSAD-${id}">Vecchio/Vecchi SAD</label>
                <select id="vecchioSAD-${id}" class="form-control" onchange="onVecchioSADChange(${id})">
                    <option value="">Scegli SAD</option>
                </select>
            </div>
            
            <!-- CAMPO 7: Denominazione SAD vecchio -->
            <div class="form-group" id="denominazioneVecchioSADGroup-${id}" style="display: none;">
                <label for="denominazioneVecchioSAD-${id}">Denominazione SAD vecchio</label>
                <input type="text" id="denominazioneVecchioSAD-${id}" class="form-control" readonly>
            </div>
            
            <!-- CAMPO 8: Insegnamento -->
            <div class="form-group full-width" id="insegnamentoGroup-${id}" style="display: none;">
                <label for="insegnamento-${id}">Insegnamento</label>
                <textarea id="insegnamento-${id}" class="form-control" rows="3" onchange="onInsegnamentoChange(${id})"></textarea>
            </div>
            
            <!-- CAMPO 9: Campo disciplinare -->
            <div class="form-group" id="campoDisciplinareGroup-${id}" style="display: none;">
                <label for="campoDisciplinare-${id}">Campo disciplinare 1</label>
                <select id="campoDisciplinare-${id}" class="form-control" onchange="onCampoDisciplinareChange(${id})">
                    <option value="">Seleziona Campo Disciplinare</option>
                </select>
            </div>
        </div>
    `;
    
    return div;
}

// CAMPO 1: Gestisce il cambio di Area AFAM
function onAreaAFAMChange(id) {
    const areaSelect = document.getElementById(`areaAFAM-${id}`);
    const value = areaSelect.value;
    
    console.log(`📍 CAMPO 1 - Area AFAM cambiata per insegnamento ${id}:`, value);
    console.log(`📊 Dati disponibili:`, data.length, 'righe');
    
    // Trova l'insegnamento nell'array
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.areaAFAM = value;
    }
    
    if (value) {
        console.log(`✅ Mostrando campi e popolando SAD per area: ${value}`);
        
        // Mostra tutti i campi successivi
        showAllFields(id);
        
        // Popola il menu SAD
        populateSADMenu(id, value);
    } else {
        console.log(`❌ Area deselezionata, nascondo campi`);
        // Nasconde tutti i campi e resetta i valori
        hideAllFields(id);
        resetAllFields(id);
    }
}

// Mostra tutti i campi
function showAllFields(id) {
    const fields = ['sad', 'denominazioneSAD', 'profilo', 'cfa', 'vecchioSAD', 'denominazioneVecchioSAD', 'insegnamento', 'campoDisciplinare'];
    fields.forEach(field => {
        const element = document.getElementById(`${field}Group-${id}`);
        if (element) {
            element.style.display = 'block';
        }
    });
}

// Nasconde tutti i campi
function hideAllFields(id) {
    const fields = ['sad', 'denominazioneSAD', 'profilo', 'cfa', 'vecchioSAD', 'denominazioneVecchioSAD', 'insegnamento', 'campoDisciplinare'];
    fields.forEach(field => {
        const element = document.getElementById(`${field}Group-${id}`);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Resetta tutti i campi
function resetAllFields(id) {
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.sad = '';
        insegnamento.denominazioneSAD = '';
        insegnamento.profilo = '';
        insegnamento.cfa = 0;
        insegnamento.vecchioSAD = '';
        insegnamento.denominazioneVecchioSAD = '';
        insegnamento.insegnamento = '';
        insegnamento.campoDisciplinare = '';
    }
    
    // Reset dei campi nel DOM
    document.getElementById(`sad-${id}`).innerHTML = '<option value="">Scegli SAD</option>';
    document.getElementById(`denominazioneSAD-${id}`).value = '';
    document.getElementById(`profilo-${id}`).innerHTML = '<option value="">Seleziona Profilo</option>';
    document.getElementById(`cfa-${id}`).value = 0;
    document.getElementById(`vecchioSAD-${id}`).innerHTML = '<option value="">Scegli SAD</option>';
    document.getElementById(`denominazioneVecchioSAD-${id}`).value = '';
    document.getElementById(`insegnamento-${id}`).value = '';
    document.getElementById(`campoDisciplinare-${id}`).innerHTML = '<option value="">Seleziona Campo Disciplinare</option>';
    
    updateTotalCFA();
}

// CAMPO 2: Popola il menu SAD in base all'Area selezionata
function populateSADMenu(id, area) {
    const sadSelect = document.getElementById(`sad-${id}`);
    sadSelect.innerHTML = '<option value="">Scegli SAD</option>';
    
    console.log(`🔍 Popolando menu SAD per area: ${area}`);
    
    if (!area) return;
    
    // Filtra i dati per l'area selezionata e SAD nuovo 1 non nullo
    const filteredData = data.filter(row => row.Area === area && row['SAD nuovo 1']);
    
    console.log(`   Righe filtrate per area ${area}:`, filteredData.length);
    
    // Estrai i SAD unici
    const sadSet = new Set();
    
    filteredData.forEach(row => {
        const sad = row['SAD nuovo 1'];
        if (sad) {
            sadSet.add(sad);
        }
    });
    
    console.log(`   SAD unici trovati:`, sadSet.size);
    
    // Ordina per gli ultimi 3 numeri del codice (es. AFAM032 -> 032)
    const sadArray = Array.from(sadSet).sort((a, b) => {
        const matchA = a.match(/\d+$/);
        const matchB = b.match(/\d+$/);
        if (!matchA || !matchB) return 0;
        const numA = parseInt(matchA[0]);
        const numB = parseInt(matchB[0]);
        return numA - numB;
    });
    
    console.log(`   Primi 5 SAD ordinati:`, sadArray.slice(0, 5));
    
    // Popola il menu
    sadArray.forEach(sad => {
        const option = document.createElement('option');
        option.value = sad;
        option.textContent = sad;
        sadSelect.appendChild(option);
    });
    
    console.log(`✅ Menu SAD popolato con ${sadArray.length} opzioni`);
}

// CAMPO 2: Gestisce il cambio di SAD
function onSADChange(id) {
    const sadSelect = document.getElementById(`sad-${id}`);
    const value = sadSelect.value;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.sad = value;
    }
    
    if (value && value !== '' && value !== 'Scegli SAD') {
        // CAMPO 3: Popola Denominazione SAD
        const row = data.find(r => r['SAD nuovo 1'] === value);
        if (row) {
            const denominazioneSAD = row['SAD nuovo nome 1'];
            document.getElementById(`denominazioneSAD-${id}`).value = denominazioneSAD || '';
            if (insegnamento) {
                insegnamento.denominazioneSAD = denominazioneSAD || '';
            }
        } else {
            console.warn('Nessuna corrispondenza trovata per SAD:', value);
        }
        
        // CAMPO 4: Popola Profilo
        populateProfiloMenu(id, value);
        
        // CAMPO 6: Popola Vecchio SAD
        populateVecchioSADMenu(id, value);
    } else {
        // Reset dei campi successivi
        document.getElementById(`denominazioneSAD-${id}`).value = '';
        document.getElementById(`profilo-${id}`).innerHTML = '<option value="">Seleziona Profilo</option>';
        document.getElementById(`vecchioSAD-${id}`).innerHTML = '<option value="">Scegli SAD</option>';
        document.getElementById(`denominazioneVecchioSAD-${id}`).value = '';
        document.getElementById(`campoDisciplinare-${id}`).innerHTML = '<option value="">Seleziona Campo Disciplinare</option>';
        
        if (insegnamento) {
            insegnamento.denominazioneSAD = '';
            insegnamento.profilo = '';
            insegnamento.vecchioSAD = '';
            insegnamento.denominazioneVecchioSAD = '';
            insegnamento.campoDisciplinare = '';
        }
    }
}

// CAMPO 4: Popola il menu Profilo
// I Profili sono nella colonna 9 e vanno filtrati per SAD nuovo 1 (colonna 3)
function populateProfiloMenu(id, sadNuovo) {
    const profiloSelect = document.getElementById(`profilo-${id}`);
    profiloSelect.innerHTML = '<option value="">Seleziona Profilo</option>';
    
    if (!sadNuovo || sadNuovo === '') {
        profiloSelect.disabled = true;
        return;
    }
    
    // Filtra i dati dove 'SAD nuovo 1' (colonna 3) corrisponde al valore selezionato in CAMPO 2
    // e leggi i valori dalla colonna 'Profili' (colonna 9)
    const filteredData = data.filter(row => 
        row['SAD nuovo 1'] === sadNuovo && 
        row.Profili &&
        row.Profili !== null
    );
    
    // Estrai i profili unici dalla colonna 'Profili'
    const profiliSet = new Set();
    filteredData.forEach(row => {
        const profilo = row.Profili;
        if (profilo) {
            profiliSet.add(profilo);
        }
    });
    
    // Popola il menu ordinato alfabeticamente
    const profiliArray = Array.from(profiliSet).sort();
    profiliArray.forEach(profilo => {
        const option = document.createElement('option');
        option.value = profilo;
        option.textContent = profilo;
        profiloSelect.appendChild(option);
    });
    
    // Se non ci sono profili, disabilita il select
    if (profiliSet.size === 0) {
        profiloSelect.disabled = true;
    } else {
        profiloSelect.disabled = false;
    }
    
    console.log(`✓ Profili trovati per ${sadNuovo}:`, profiliArray.length);
}

// CAMPO 4: Gestisce il cambio di Profilo
function onProfiloChange(id) {
    const profiloSelect = document.getElementById(`profilo-${id}`);
    const value = profiloSelect.value;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.profilo = value;
    }
}

// CAMPO 5: Gestisce il cambio di CFA
function onCFAChange(id) {
    const cfaInput = document.getElementById(`cfa-${id}`);
    const value = parseInt(cfaInput.value) || 0;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.cfa = value;
    }
    
    updateTotalCFA();
}

// CAMPO 6: Popola il menu Vecchio SAD
function populateVecchioSADMenu(id, sadNuovo) {
    const vecchioSADSelect = document.getElementById(`vecchioSAD-${id}`);
    vecchioSADSelect.innerHTML = '<option value="">Scegli SAD</option>';
    
    if (!sadNuovo || sadNuovo === '') return;
    
    // Filtra i dati per il SAD nuovo selezionato e SAD vecchio non nullo
    const filteredData = data.filter(row => 
        row['SAD nuovo 1'] === sadNuovo && 
        row['SAD vecchio 1'] &&
        row['SAD vecchio 1'] !== null
    );
    
    // Estrai i SAD vecchi unici
    const sadVecchiSet = new Set();
    filteredData.forEach(row => {
        const sadVecchio = row['SAD vecchio 1'];
        if (sadVecchio) {
            sadVecchiSet.add(sadVecchio);
        }
    });
    
    // Ordina alfabeticamente
    const sadVecchiArray = Array.from(sadVecchiSet).sort();
    
    // Popola il menu
    sadVecchiArray.forEach(sadVecchio => {
        const option = document.createElement('option');
        option.value = sadVecchio;
        option.textContent = sadVecchio;
        vecchioSADSelect.appendChild(option);
    });
}

// CAMPO 6: Gestisce il cambio di Vecchio SAD
function onVecchioSADChange(id) {
    const vecchioSADSelect = document.getElementById(`vecchioSAD-${id}`);
    const value = vecchioSADSelect.value;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.vecchioSAD = value;
    }
    
    if (value && value !== '' && value !== 'Scegli SAD') {
        // CAMPO 7: Popola Denominazione SAD vecchio
        const row = data.find(r => r['SAD vecchio 1'] === value);
        if (row) {
            const denominazioneVecchioSAD = row['SAD vecchio nome 1'];
            document.getElementById(`denominazioneVecchioSAD-${id}`).value = denominazioneVecchioSAD || '';
            if (insegnamento) {
                insegnamento.denominazioneVecchioSAD = denominazioneVecchioSAD || '';
            }
        } else {
            console.warn('Nessuna corrispondenza trovata per SAD vecchio:', value);
        }
        
        // CAMPO 9: Popola Campo disciplinare
        populateCampoDisciplinareMenu(id, value);
    } else {
        // Reset dei campi successivi
        document.getElementById(`denominazioneVecchioSAD-${id}`).value = '';
        document.getElementById(`campoDisciplinare-${id}`).innerHTML = '<option value="">Seleziona Campo Disciplinare</option>';
        
        if (insegnamento) {
            insegnamento.denominazioneVecchioSAD = '';
            insegnamento.campoDisciplinare = '';
        }
    }
}

// CAMPO 9: Popola il menu Campo disciplinare
// I Campi disciplinari sono nella colonna 13 e vanno filtrati per SAD vecchio 1 (colonna 1)
function populateCampoDisciplinareMenu(id, sadVecchio) {
    const campoDisciplinareSelect = document.getElementById(`campoDisciplinare-${id}`);
    campoDisciplinareSelect.innerHTML = '<option value="">Seleziona Campo Disciplinare</option>';
    
    if (!sadVecchio || sadVecchio === '') {
        campoDisciplinareSelect.disabled = true;
        return;
    }
    
    // Filtra i dati dove 'SAD vecchio 1' (colonna 1) corrisponde al valore selezionato in CAMPO 6
    // e leggi i valori dalla colonna 'Campi disciplinari' (colonna 13)
    const filteredData = data.filter(row => 
        row['SAD vecchio 1'] === sadVecchio && 
        row['Campi disciplinari'] &&
        row['Campi disciplinari'] !== null
    );
    
    // Estrai i campi disciplinari unici dalla colonna 'Campi disciplinari'
    const campiSet = new Set();
    filteredData.forEach(row => {
        const campo = row['Campi disciplinari'];
        if (campo) {
            campiSet.add(campo);
        }
    });
    
    // Popola il menu ordinato alfabeticamente
    const campiArray = Array.from(campiSet).sort();
    campiArray.forEach(campo => {
        const option = document.createElement('option');
        option.value = campo;
        option.textContent = campo;
        campoDisciplinareSelect.appendChild(option);
    });
    
    // Se non ci sono campi disciplinari, disabilita il select
    if (campiSet.size === 0) {
        campoDisciplinareSelect.disabled = true;
    } else {
        campoDisciplinareSelect.disabled = false;
    }
    
    console.log(`✓ Campi disciplinari trovati per ${sadVecchio}:`, campiArray.length);
}

// CAMPO 9: Gestisce il cambio di Campo disciplinare
function onCampoDisciplinareChange(id) {
    const campoDisciplinareSelect = document.getElementById(`campoDisciplinare-${id}`);
    const value = campoDisciplinareSelect.value;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.campoDisciplinare = value;
    }
}

// CAMPO 8: Gestisce il cambio di Insegnamento
function onInsegnamentoChange(id) {
    const insegnamentoInput = document.getElementById(`insegnamento-${id}`);
    const value = insegnamentoInput.value;
    
    const insegnamento = insegnamentiList.find(i => i.id === id);
    if (insegnamento) {
        insegnamento.insegnamento = value;
    }
}

// Calcola e aggiorna il totale CFA
function updateTotalCFA() {
    const total = insegnamentiList.reduce((sum, ins) => sum + (ins.cfa || 0), 0);
    document.getElementById('cfaSum').textContent = total;
}

// Rimuovi un insegnamento
function removeInsegnamento(id) {
    // Rimuovi dall'array
    const index = insegnamentiList.findIndex(i => i.id === id);
    if (index > -1) {
        insegnamentiList.splice(index, 1);
    }
    
    // Rimuovi dal DOM
    const element = document.getElementById(`insegnamento-${id}`);
    if (element) {
        element.remove();
    }
    
    updateTotalCFA();
}

// Genera il PDF
function generatePDF() {
    if (insegnamentiList.length === 0) {
        alert('Aggiungi almeno un insegnamento prima di generare il PDF.');
        return;
    }
    
    // Verifica che almeno un insegnamento abbia l'area AFAM compilata
    const validInsegnamenti = insegnamentiList.filter(ins => ins.areaAFAM && ins.areaAFAM !== '');
    if (validInsegnamenti.length === 0) {
        alert('Compila almeno il campo AREA AFAM di un insegnamento prima di generare il PDF.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Titolo
    doc.setFontSize(16);
    doc.text('Piano Didattico di Corso di Studi AFAM', 14, 20);
    
    // Data
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('it-IT');
    doc.text(`Data: ${date}`, 14, 28);
    
    // Prepara i dati per la tabella
    const tableData = insegnamentiList.map((ins, index) => [
        index + 1,
        ins.areaAFAM || '-',
        ins.sad || '-',
        ins.denominazioneSAD || '-',
        ins.profilo || '-',
        ins.cfa || 0,
        ins.vecchioSAD || '-',
        ins.denominazioneVecchioSAD || '-',
        ins.insegnamento || '-',
        ins.campoDisciplinare || '-'
    ]);
    
    // Aggiungi la riga del totale
    const total = insegnamentiList.reduce((sum, ins) => sum + (ins.cfa || 0), 0);
    tableData.push(['', '', '', '', 'TOTALE', total, '', '', '', '']);
    
    // Crea la tabella
    doc.autoTable({
        head: [['#', 'Area AFAM', 'SAD', 'Denominazione SAD', 'Profilo', 'CFA', 'Vecchio SAD', 'Den. Vecchio SAD', 'Insegnamento', 'Campo Disc.']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 10 },
            5: { cellWidth: 15, halign: 'center' }
        },
        didParseCell: function(data) {
            // Evidenzia la riga del totale
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [230, 230, 230];
            }
        }
    });
    
    // Salva il PDF
    doc.save('piano_didattico_afam.pdf');
}
