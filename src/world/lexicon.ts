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
  あ: { pos: 'interjection', fr: 'ah ! (on se souvient de quelque chose)' },
  あら: { pos: 'interjection', fr: 'tiens ! oh ! (surtout chez les femmes)' },
  いらっしゃい: { pos: 'expression', fr: 'bienvenue ! (accueil d’une boutique)' },
  それだけ: { pos: 'expression', fr: 'c’est tout, rien de plus' },
  ただの: { pos: 'expression', fr: 'un simple…, rien qu’un…' },
  この先: { pos: 'expression', fr: 'plus loin, au-delà d’ici' },
  一人ずつ: { pos: 'expression', fr: 'un par un' },
  何か: { pos: 'expression', fr: 'quelque chose' },
  ね: { pos: 'particule finale', fr: 'hein, n’est-ce pas (on cherche l’accord)' },
  です: { pos: 'copule polie', fr: 'c’est, être (poli)', note: 'la forme polie de だ' },
  はい: { pos: 'interjection', fr: 'oui ; voilà (en tendant quelque chose)' },
  うん: { pos: 'interjection', fr: 'oui, d’accord (familier)' },
  ふふ: { pos: 'interjection', fr: 'hi hi (petit rire)' },
  えへへ: { pos: 'interjection', fr: 'hé hé (rire gêné, content)' },
  あの: { pos: 'démonstratif', fr: 'ce… là-bas (que l’on connaît tous les deux)' },
  とても: { pos: 'adverbe', fr: 'très' },
  もうすぐ: { pos: 'adverbe', fr: 'bientôt, d’ici peu' },
  ください: { pos: 'expression', fr: 'donnez-moi, s’il vous plaît', note: 'nom + を + ください : pour commander' },
  よろしくお願いします: { pos: 'expression', fr: 'enchanté ; je compte sur vous', note: 'se dit en se présentant' },
  ありがとう: { pos: 'expression', fr: 'merci' },
  ごめんなさい: { pos: 'expression', fr: 'pardon, je suis désolée' },

  // ---------- les fins que le village a perdues (le joueur, lui, les a encore) ----------
  と思う: {
    pos: 'fin de phrase',
    r: 'とおもう',
    fr: 'je pense que…, je trouve que… (donner son avis)',
    forms: ['と思います'],
    note: 'nom ou adjectif な + だと思う ; adjectif い ou verbe + と思う, sans だ',
  },
  かもしれない: {
    pos: 'fin de phrase',
    fr: 'peut-être que…, il se peut que…',
    forms: ['かもしれません'],
    note: 'jamais de だ devant : 霧かもしれない',
  },
  んです: {
    pos: 'fin de phrase',
    fr: 'c’est que…, est-ce que… ? (on explique, on demande une explication)',
    forms: ['んですか', 'なんです', 'なんですか'],
    note: 'après un nom ou un adjectif な, だ devient な : 冬なんです',
  },
  じゃない: { pos: 'copule négative', fr: 'ce n’est pas', note: 'familier de ではない ; après un nom ou un adjectif な' },

  // ---------- personnes ----------
  わし: { pos: 'pronom', fr: 'moi, je (vieil homme)', marker: 'わし' },
  お前さん: { pos: 'pronom', fr: 'toi (vieil homme, familier mais chaleureux)' },
  お侍さん: { pos: 'nom', fr: 'monsieur le samouraï', note: 'お + 侍 + さん : poli, un peu naïf' },
  お客さん: { pos: 'nom', fr: 'client ; visiteur' },
  旅の者: { pos: 'expression', fr: 'voyageur, étranger de passage' },
  年寄り: { pos: 'nom', fr: 'vieillard, personne âgée' },
  さん: { pos: 'suffixe', fr: 'monsieur, madame (après un nom)' },
  くん: { pos: 'suffixe', fr: 'après le prénom d’un garçon, affectueux' },
  子: { pos: 'nom', fr: 'enfant' },
  太一: { pos: 'nom propre', fr: 'Taichi, le petit-fils du meunier', name: true },
  萬作: { pos: 'nom propre', fr: 'Mansaku, le vieux charpentier', name: true },
  露: { pos: 'nom propre', fr: 'Tsuyu (prénom ; le mot veut dire « rosée »)', name: true },

  // ---------- lieux et choses ----------
  霧: { pos: 'nom', fr: 'brouillard, brume' },
  今日: { pos: 'nom', fr: 'aujourd’hui' },
  今: { pos: 'nom', fr: 'maintenant' },
  明日: { pos: 'nom', fr: 'demain' },
  今年: { pos: 'nom', fr: 'cette année' },
  冬: { pos: 'nom', fr: 'hiver' },
  もの: { pos: 'nom', fr: 'chose' },
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
  見る: { pos: 'verbe', r: 'みる', fr: 'voir, regarder', forms: ['見た'], note: '見た : passé' },
  言う: { pos: 'verbe', r: 'いう', fr: 'dire', forms: ['言えない'], note: '言えない : « ne pas pouvoir dire » (potentiel négatif)' },
  好き: { pos: 'adjectif な', fr: 'aimer, qui plaît' },
  大丈夫: { pos: 'adjectif な', fr: 'ça va, pas de problème, sans danger' },
  おいしい: { pos: 'adjectif い', fr: 'bon, délicieux' },
  悪い: { pos: 'adjectif い', fr: 'mauvais, méchant' },
  強い: { pos: 'adjectif い', fr: 'fort, courageux' },
  大きい: { pos: 'adjectif い', r: 'おおきい', fr: 'grand, gros', forms: ['大きかった'], note: '大きかった : passé' },
  寒い: { pos: 'adjectif い', r: 'さむい', fr: 'froid (le temps qu’il fait)', forms: ['寒かった'], note: '寒かった : passé' },
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
  こわい: { pos: 'adjectif い', fr: 'qui fait peur ; avoir peur', forms: ['こわくない', 'こわかった'], note: 'こわくない : négatif ; こわかった : passé' },
};
