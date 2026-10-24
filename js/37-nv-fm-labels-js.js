
(() => {
  /* mots de la boutique absents du dictionnaire : [en, es, pt, ja] */
  const ADD = {
    'VENDU': ['SOLD', 'VENDIDO', 'VENDIDO', '売約済み'],
    'EN STOCK': ['IN STOCK', 'EN STOCK', 'EM ESTOQUE', '在庫'],
    'ÉPUISÉ': ['SOLD OUT', 'AGOTADO', 'ESGOTADO', '完売'],
    'SECTEURS': ['SECTORS', 'SECTORES', 'SETORES', 'セクター'],
    'SPÉCIALE': ['SPECIAL', 'ESPECIAL', 'ESPECIAL', 'スペシャル'],
    'Secteurs': ['Sectors', 'Sectores', 'Setores', 'セクター'],
    'Thème spécial': ['Special theme', 'Tema especial', 'Tema especial', '特別テーマ'],
    'HD · Combat moderne': ['HD · Modern combat', 'HD · Combate moderno', 'HD · Combate moderno', 'HD・現代戦'],
    'LES BACS': ['THE BINS', 'LOS CAJONES', 'AS CAIXAS', '陳列棚'],
    'LE MUR DES BANDES': ['THE TAPE WALL', 'EL MURO DE CINTAS', 'O MURO DAS FITAS', 'テープの壁'],
    'LE STAND À CASSETTES': ['THE CASSETTE STAND', 'EL PUESTO DE CASETES', 'A BANCA DE FITAS', 'カセット売り場'],
    'TIRAGE ORIGINAL · TAPES NUMÉROTÉES': ['ORIGINAL PRESSING · NUMBERED TAPES', 'EDICIÓN ORIGINAL · CINTAS NUMERADAS', 'TIRAGEM ORIGINAL · FITAS NUMERADAS', 'オリジナル版・ナンバー入りテープ'],
    'CHOISIS · ÉCOUTE · COLLECTIONNE — DES BANDES ORIGINALES DU JEU EN MP3': ['PICK · LISTEN · COLLECT — THE GAME’S ORIGINAL SOUNDTRACKS IN MP3', 'ELIGE · ESCUCHA · COLECCIONA — LAS BANDAS SONORAS DEL JUEGO EN MP3', 'ESCOLHA · OUÇA · COLECIONE — AS TRILHAS ORIGINAIS DO JOGO EM MP3', '選ぶ・聴く・集める — ゲームのサントラをMP3で'],
    'NEO-VANGUARD FM · ÉDITION ORIGINALE': ['NEO-VANGUARD FM · ORIGINAL EDITION', 'NEO-VANGUARD FM · EDICIÓN ORIGINAL', 'NEO-VANGUARD FM · EDIÇÃO ORIGINAL', 'NEO-VANGUARD FM・オリジナル版'],
    'COLLECTÉ': ['COLLECTED', 'COLECCIONADO', 'COLECIONADO', '収集済み'],
    'en grand': ['zoom', 'ampliar', 'ampliar', '拡大'],
    'parcourir': ['browse', 'explorar', 'navegar', '選ぶ'],
    'sortir': ['exit', 'salir', 'sair', '戻る'],
    'écouter': ['listen', 'escuchar', 'ouvir', '試聴'],
    '← RETOUR AU JEU': ['← BACK TO THE GAME', '← VOLVER AL JUEGO', '← VOLTAR AO JOGO', '← ゲームに戻る'],
    '↓ TÉLÉCHARGER LE MP3': ['↓ DOWNLOAD THE MP3', '↓ DESCARGAR EL MP3', '↓ BAIXAR O MP3', '↓ MP3をダウンロード'],
    '⌕ VOIR LA CASSETTE EN GRAND': ['⌕ VIEW THE CASSETTE', '⌕ VER EL CASETE EN GRANDE', '⌕ VER A FITA EM GRANDE', '⌕ カセットを拡大'],
    '⌕ VOIR LA JAQUETTE EN GRAND': ['⌕ VIEW THE COVER', '⌕ VER LA PORTADA EN GRANDE', '⌕ VER A CAPA EM GRANDE', '⌕ ジャケットを拡大'],
    '▶ ÉCOUTER L’APERÇU': ['▶ PLAY PREVIEW', '▶ ESCUCHAR AVANCE', '▶ OUVIR PRÉVIA', '▶ 試聴する'],
    "▶ ÉCOUTER L'APERÇU": ['▶ PLAY PREVIEW', '▶ ESCUCHAR AVANCE', '▶ OUVIR PRÉVIA', '▶ 試聴する'],
    'ACHETER': ['BUY', 'COMPRAR', 'COMPRAR', '購入'],
    '✓ CASSETTE DÉBLOQUÉE': ['✓ CASSETTE UNLOCKED', '✓ CASETE DESBLOQUEADO', '✓ FITA DESBLOQUEADA', '✓ カセット解放済み'],
    'THÈME DE BOSS': ['BOSS THEME', 'TEMA DE JEFE', 'TEMA DE CHEFE', 'ボステーマ'],
    'THÈME DE SECTEUR': ['SECTOR THEME', 'TEMA DE SECTOR', 'TEMA DE SETOR', 'セクターテーマ'],
    'PISTE SPÉCIALE': ['SPECIAL TRACK', 'PISTA ESPECIAL', 'FAIXA ESPECIAL', '特別トラック'],
    'CASSETTE DANS LA COLLECTION': ['CASSETTE IN YOUR COLLECTION', 'CASETE EN TU COLECCIÓN', 'FITA NA SUA COLEÇÃO', 'コレクション入り'],
    'ÉDITION SPÉCIALE · GAME OVER': ['SPECIAL EDITION · GAME OVER', 'EDICIÓN ESPECIAL · GAME OVER', 'EDIÇÃO ESPECIAL · GAME OVER', '特別版・GAME OVER'],
    'Choisis une cassette': ['Pick a cassette', 'Elige un casete', 'Escolha uma fita', 'カセットを選ぼう'],
    '31 bandes · six générations de consoles': ['31 tapes · six console generations', '31 cintas · seis generaciones de consolas', '31 fitas · seis gerações de consoles', '31本・6世代のハード'],
    'Fermer la vue détaillée': ['Close the detailed view', 'Cerrar la vista detallada', 'Fechar a vista detalhada', '詳細表示を閉じる']
  };
  try { for (const k in ADD) if (!LDATA[k]) LDATA[k] = ADD[k]; LIDX = null; LCACHE.clear(); } catch (e) {}
  const tr = window.nvTr = s => { try { return typeof L === 'function' ? L(s) : s; } catch (e) { return s; } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* le titre de la vue agrandie rétrécit jusqu'à tenir sur sa largeur */
  const zt = document.getElementById('nvZoomTitle');
  if (zt) {
    const fitTitle = () => { zt.style.fontSize = ''; requestAnimationFrame(() => { let f = parseFloat(getComputedStyle(zt).fontSize) || 40, n = 0; while (zt.scrollWidth > zt.clientWidth + 1 && f > 14 && n++ < 40) { f -= 2; zt.style.fontSize = f + 'px'; } }); };
    new MutationObserver(fitTitle).observe(zt, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', fitTitle);
  }
  window.nvCaseLabel = (t, open) => {
    if (!t) return '';
    const title = tr(t.title), sub = t.kind === 'sector' ? tr('Secteurs') + ' ' + t.levels : t.kind === 'boss' ? tr(t.levels) : tr('Thème spécial');
    return `<span class="nv-case-lbl ${open ? 'is-open' : 'is-case'}" aria-hidden="true" style="--n:${[...title].length}"><b>${esc(title)}</b><i>${esc(sub)}</i></span>`;
  };
})();
