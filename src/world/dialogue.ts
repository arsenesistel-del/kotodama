// Répliques du village, en japonais, avec la traduction que souffle ワケ (palier 1 : il traduit, à la demande).
// Lectures entre accolades : {萬作|まんさく} s'affiche avec son furigana.
// Avant guérison, personne n'emploie les quatre fins perdues (と思う, かもしれない, そうだ, んだ).

export interface Line {
  who: string; // id du personnage, ou « wake »
  jp?: string;
  fr: string; // traduction (ou réplique de ワケ, qui parle français)
}

export const SPEAKERS: Record<string, { name: string; face?: string }> = {
  mansaku: { name: '{萬作|まんさく}', face: 'actors/oldman3_face' },
  omitsu: { name: 'おみつ', face: 'actors/princess_face' },
  taichi: { name: '{太一|たいち}', face: 'actors/villager5_face' },
  otane: { name: 'おたね', face: 'actors/oldwoman_face' },
  gonbei: { name: '{権兵衛|ごんべえ}', face: 'actors/villager3_face' },
  wake: { name: 'ワケ', face: 'actors/spirit_face' },
  sign: { name: '' },
};

export const DIALOGUES: Record<string, Line[]> = {
  arrival: [
    { who: 'wake', fr: "Nous y voilà. Kirino, le village de la brume." },
    { who: 'wake', fr: "Écoute-les bien. Ils parlent, mais j'ai l'impression qu'il leur manque quelque chose." },
    { who: 'wake', fr: 'Approche-toi de quelqu’un et appuie sur Espace. Je traduis si tu me le demandes : touche T.' },
  ],
  mansaku: [
    { who: 'mansaku', jp: '旅の{者|もの}か。……{霧|きり}じゃ。{今日|きょう}も、霧じゃ。', fr: 'Un voyageur ? Du brouillard. Encore du brouillard aujourd’hui.' },
    { who: 'mansaku', jp: 'わしは{萬作|まんさく}。{昔|むかし}は{橋|はし}を{架|か}けておった。{今|いま}は、ただの{年寄|としよ}りじゃ。', fr: 'Je suis Mansaku. Autrefois, je construisais des ponts. Aujourd’hui, je ne suis qu’un vieux.' },
    { who: 'wake', fr: '« じゃ », c’est le « だ » des vieux. Et il ne dit jamais ce qu’il pense, seulement le temps qu’il fait.' },
  ],
  omitsu: [
    { who: 'omitsu', jp: 'いらっしゃい！お{茶|ちゃ}、{熱|あつ}いわ。お{団子|だんご}、{甘|あま}いわよ。……それだけ。', fr: 'Bienvenue ! Le thé, chaud. Les dango, sucrés. C’est tout.' },
    { who: 'omitsu', jp: '{峠|とうげ}に、{何|なに}かいる。……あれ？{続|つづ}きが{出|で}てこないの。', fr: 'Il y a quelque chose au col. Hein ? La suite ne vient pas.' },
  ],
  taichi: [
    { who: 'taichi', jp: 'お{侍|さむらい}さん！{水車小屋|すいしゃごや}に、{影|かげ}、いた！{顔|かお}、なかった！ほんとだもん！', fr: 'Monsieur le samouraï ! Au moulin, une ombre ! Sans visage ! C’est vrai, hein !' },
  ],
  otane: [
    { who: 'otane', jp: '{川|かわ}の{水|みず}、{冷|つめ}たい。……{冷|つめ}たい。', fr: 'L’eau de la rivière, froide. Froide.' },
  ],
  gonbei: [
    { who: 'gonbei', jp: '{田|た}んぼ、{霧|きり}。{稲|いね}、{少|すく}ない。', fr: 'Les rizières, du brouillard. Le riz, peu.' },
    { who: 'wake', fr: 'Il ne se plaint même pas. Il constate.' },
  ],
  'sign-north': [{ who: 'sign', jp: '{霧野峠|きりのとうげ}', fr: 'Le col de Kirino.' }],
  'sign-south': [{ who: 'sign', jp: 'この{先|さき}　{灯籠宿|とうろうじゅく}', fr: 'Plus loin : Tōrōjuku, le relais aux lanternes.' }],
  'sign-bridge': [
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}　{一人|ひとり}ずつ{渡|わた}ること', fr: 'Pont suspendu. Traverser un par un.' },
    { who: 'wake', fr: 'Il grince. Je ne monte pas dessus, moi. Enfin, je flotte, mais quand même.' },
  ],
  'tomb-otsuyu': [
    { who: 'sign', jp: '{露|つゆ}の{墓|はか}', fr: 'La tombe de Tsuyu.' },
    { who: 'wake', fr: 'Quelqu’un vient la nettoyer souvent. Les fleurs sont fraîches.' },
  ],
};
