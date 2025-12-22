# Installazione in WordPress

## Metodo 1: iFrame (Più Semplice)

1. Deploya l'app su Vercel
2. In WordPress, crea una nuova pagina
3. Aggiungi blocco HTML personalizzato:
```html
<iframe 
  src="https://your-vercel-url.vercel.app" 
  width="100%" 
  height="800px" 
  style="border: none; min-height: 100vh;">
</iframe>
```

**Pro**: Facile, aggiornamenti automatici  
**Contro**: iFrame può avere limitazioni (mobile, SEO)

---

## Metodo 2: Plugin WordPress (Integrazione Completa)

### Passo 1: Build l'app
```bash
npm run build
```

### Passo 2: Crea il plugin
1. Vai in `wp-content/plugins/`
2. Crea cartella `piano-didattico-afam/`
3. Copia dentro:
   - `dist/` (contenuto della build)
   - `wordpress-embed.php` (rinomina in `piano-didattico-afam.php`)

### Passo 3: Attiva il plugin
1. Vai in WordPress Admin → Plugin
2. Attiva "Piano Didattico AFAM"

### Passo 4: Usa lo shortcode
Aggiungi in qualsiasi pagina/post:
```
[piano_didattico]
```

**Pro**: Integrazione nativa, veloce  
**Contro**: Richiede rebuild e upload per aggiornamenti

---

## Metodo 3: Upload in Sottocartella

### Passo 1: Build
```bash
npm run build
```

### Passo 2: Upload via FTP
1. Carica `dist/` in `wp-content/uploads/piano-didattico/`
2. In WordPress, crea pagina con template full-width
3. Aggiungi codice HTML:
```html
<div id="root"></div>
<script type="module" src="/wp-content/uploads/piano-didattico/assets/index.js"></script>
<link rel="stylesheet" href="/wp-content/uploads/piano-didattico/assets/index.css">
```

---

## Configurazione Consigliata

Per il sito conscfv.it, consiglio **Metodo 1 (iFrame)** perché:
- Zero modifica al tema WordPress esistente
- Aggiornamenti automatici da Vercel
- Deploy separato (più sicuro)
- Manutenzione più semplice

### CSS da aggiungere al tema per iFrame responsive:
```css
.piano-didattico-container {
  width: 100%;
  position: relative;
  padding-bottom: 100vh;
  min-height: 800px;
}

.piano-didattico-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .piano-didattico-container {
    padding-bottom: 120vh;
  }
}
```

### Shortcode avanzato per iFrame:
Aggiungi in `functions.php` del tema:
```php
function piano_didattico_iframe_shortcode() {
    return '<div class="piano-didattico-container">
        <iframe 
          src="https://conscfv-compilatore.vercel.app" 
          width="100%" 
          height="100%" 
          frameborder="0"
          loading="lazy">
        </iframe>
    </div>';
}
add_shortcode('piano_didattico', 'piano_didattico_iframe_shortcode');
```

Poi usa semplicemente `[piano_didattico]` ovunque.
