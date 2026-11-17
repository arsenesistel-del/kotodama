// Lexique des répliques : chaque mot touché affiche son sens en français.
// Clé : la forme du dictionnaire (ou l'expression entière). `forms` : les autres formes qu'on rencontre dans les répliques.
// Les répliques sont découpées par correspondance la plus longue sur ces formes (voir text.ts) ;
// `npm test` signale tout morceau de réplique qui n'est pas couvert.

export interface Entry {
  fr: string; // sens en français, court
  pos: string; // nature du mot, en français
  r?: string; // lecture du lemme, quand il a des kanji et qu'il diffère de la forme rencontrée
  forms?: string[];
  marker?: string; // 役割語 : renvoie à MARKERS
  note?: string; // remarque de grammaire, une ligne
  name?: boolean; // nom propre : furigana toujours affiché
}

/** Marqueurs de 役割語. ワケ les signale la première fois qu'ils apparaissent (DESIGN, règle 1 des 役割語). */
export const MARKERS: Record<string, { who: string; std: string; wake: string }> = {
  じゃ: { who: '老人', std: 'だ', wake: '« じゃ », c’est le « だ » des vieux. Tu vas l’entendre souvent ici.' },
  わし: { who: '老人', std: '私', wake: '« わし », c’est « moi » dans la bouche d’un vieil homme.' },
  おる: { who: '老人', std: 'いる', wake: '« おった », c’est « いた ». Les vieux disent おる au lieu de いる.' },
  のう: { who: '老人', std: 'ね', wake: '« のう », c’est son « ね ». Un soupir qui attend qu’on soit d’accord.' },
  わ: { who: '町娘', std: '（なし）', wake: '« わ » en fin de phrase : une jeune femme qui affirme, en douceur. Rien à traduire, c’est le ton.' },
  もん: { who: '子ども', std: 'から', wake: '« もん » : un enfant qui se justifie. « C’est vrai, na ! »' },
};

export const MARKER_WHO: Record<string, string> = { 老人: 'vieillard', 町娘: 'jeune femme', 子ども: 'enfant' };

export const LEX: Record<string, Entry> = {
  // ---------- particules et petits mots ----------
  の: { pos: 'particule', fr: 'de (relie deux noms) ; en fin de phrase : explique, adoucit' },
  は: { pos: 'particule', fr: 'quant à… (marque le thème)' },
  が: { pos: 'particule', fr: 'marque le sujet' },
  を: { pos: 'particule', fr: 'marque l’objet du verbe' },
  に: { pos: 'particule', fr: 'à, dans (lieu où l’on se trouve)' },
  も: { pos: 'particule', fr: 'aussi, encore' },
  か: { pos: 'particule', fr: 'marque la question : « … ? »' },
  だ: { pos: 'copule', fr: 'c’est, être' },
  じゃ: { pos: 'copule', fr: 'c’est, être', marker: 'じゃ' },
  わ: { pos: 'particule finale', fr: 'affirmation douce', marker: 'わ' },
  わよ: { pos: 'particule finale', fr: 'affirmation douce, « je te le dis »', marker: 'わ', note: 'わ + よ' },
  のう: { pos: 'particule finale', fr: 'hein, n’est-ce pas', marker: 'のう' },
  もん: { pos: 'particule finale', fr: 'parce que ! (on se justifie)', marker: 'もん' },
  あれ: { pos: 'interjection', fr: 'hein ? tiens ? (surprise)' },
  あら: { pos: 'interjection', fr: 'tiens ! oh ! (surtout chez les femmes)' },
  いらっしゃい: { pos: 'expression', fr: 'bienvenue ! (accueil d’une boutique)' },
  それだけ: { pos: 'expression', fr: 'c’est tout, rien de plus' },
  ただの: { pos: 'expression', fr: 'un simple…, rien qu’un…' },
  この先: { pos: 'expression', fr: 'plus loin, au-delà d’ici' },
  一人ずつ: { pos: 'expression', fr: 'un par un' },
  何か: { pos: 'expression', fr: 'quelque chose' },

  // ---------- personnes ----------
  わし: { pos: 'pronom', fr: 'moi, je (vieil homme)', marker: 'わし' },
  お前さん: { pos: 'pronom', fr: 'toi (vieil homme, familier mais chaleureux)' },
  お侍さん: { pos: 'nom', fr: 'monsieur le samouraï', note: 'お + 侍 + さん : poli, un peu naïf' },
  お客さん: { pos: 'nom', fr: 'client ; visiteur' },
  旅の者: { pos: 'expression', fr: 'voyageur, étranger de passage' },
  年寄り: { pos: 'nom', fr: 'vieillard, personne âgée' },
  萬作: { pos: 'nom propre', fr: 'Mansaku, le vieux charpentier', name: true },
  露: { pos: 'nom propre', fr: 'Tsuyu (prénom ; le mot veut dire « rosée »)', name: true },

  // ---------- lieux et choses ----------
  霧: { pos: 'nom', fr: 'brouillard, brume' },
  今日: { pos: 'nom', fr: 'aujourd’hui' },
  今: { pos: 'nom', fr: 'maintenant' },
  昔: { pos: 'nom', fr: 'autrefois, jadis' },
  橋: { pos: 'nom', fr: 'pont' },
  吊り橋: { pos: 'nom', fr: 'pont suspendu' },
  峠: { pos: 'nom', fr: 'col de montagne' },
  お茶: { pos: 'nom', fr: 'thé' },
  お団子: { pos: 'nom', fr: 'dango, boulettes de riz sucrées' },
  続き: { pos: 'nom', fr: 'la suite' },
  水車小屋: { pos: 'nom', fr: 'moulin à eau (la cabane de la roue)' },
  影: { pos: 'nom', fr: 'ombre' },
  顔: { pos: 'nom', fr: 'visage' },
  ほんと: { pos: 'nom', fr: 'vrai, pour de vrai (familier de 本当)' },
  川: { pos: 'nom', fr: 'rivière' },
  水: { pos: 'nom', fr: 'eau' },
  田んぼ: { pos: 'nom', fr: 'rizière' },
  稲: { pos: 'nom', fr: 'riz (la plante sur pied)' },
  墓: { pos: 'nom', fr: 'tombe' },
  霧野峠: { pos: 'nom propre', fr: 'le col de Kirino', name: true },
  灯籠宿: { pos: 'nom propre', fr: 'Tōrōjuku, le relais aux lanternes', name: true },

  // ---------- verbes et adjectifs ----------
  いる: { pos: 'verbe', fr: 'être là, se trouver (êtres vivants)', forms: ['いた'] },
  架ける: {
    pos: 'verbe',
    r: 'かける',
    fr: 'jeter (un pont) d’une rive à l’autre, construire',
    forms: ['架けておった'],
    marker: 'おる',
    note: '～ておった = ～ていた : « je construisais »',
  },
  出てくる: { pos: 'verbe', r: 'でてくる', fr: 'sortir, venir ; ici : les mots ne viennent pas', forms: ['出てこない'], note: '出てこない : forme négative' },
  渡る: { pos: 'verbe', r: 'わたる', fr: 'traverser', forms: ['渡ること'], note: 'verbe + こと : consigne écrite, « il faut… »' },
  ない: { pos: 'adjectif い', fr: 'il n’y a pas ; ne pas avoir', forms: ['なかった'], note: 'なかった : passé, « il n’y avait pas »' },
  熱い: { pos: 'adjectif い', fr: 'chaud, brûlant (une boisson, un objet)' },
  甘い: { pos: 'adjectif い', fr: 'sucré' },
  冷たい: { pos: 'adjectif い', fr: 'froid (au toucher)' },
  少ない: { pos: 'adjectif い', fr: 'peu nombreux, rare' },
  こわい: { pos: 'adjectif い', fr: 'qui fait peur ; avoir peur', forms: ['こわくない'], note: 'こわくない : forme négative' },
};
