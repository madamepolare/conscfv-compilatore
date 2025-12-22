<?php
/**
 * Plugin Name: Piano Didattico AFAM
 * Description: Compilatore piano didattico per Conservatorio Steffani
 * Version: 1.0
 * Author: Conservatorio A. Steffani
 */

// Shortcode per embeddare l'app
function piano_didattico_embed() {
    $plugin_url = plugin_dir_url(__FILE__) . 'dist/';
    
    // Enqueue degli assets
    wp_enqueue_style('piano-didattico-css', $plugin_url . 'assets/index.css');
    wp_enqueue_script('piano-didattico-js', $plugin_url . 'assets/index.js', array(), '1.0', true);
    
    // Container per l'app React
    return '<div id="root"></div>';
}
add_shortcode('piano_didattico', 'piano_didattico_embed');

// Istruzioni d'uso:
// 1. Fai build: npm run build
// 2. Copia la cartella dist/ in wp-content/plugins/piano-didattico-afam/
// 3. Attiva il plugin in WordPress
// 4. Usa lo shortcode [piano_didattico] in qualsiasi pagina
