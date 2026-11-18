// Répliques du village, en japonais, avec la traduction que souffle ワケ (palier 1 : il traduit, à la demande).
// Chaque kanji porte sa lecture entre accolades : {萬作|まんさく}. Le furigana ne s'affiche que si le joueur
// ne sait pas lire le mot (voir prefs.ts). Chaque mot doit être dans lexicon.ts : `npm test` le vérifie.
// Une variante « id:again » est dite quand on reparle à quelqu'un.
// Avant guérison, personne n'emploie les quatre fins perdues (と思う, かもしれない, そうだ, んだ).

// Le joueur répond à voix haute (échelle « Lire » du DESIGN, chapitre 1) : une réplique « player » s'affiche,
// il la dit, et le moteur vérifie (voir answer.ts). Il parle poli et standard, et lui garde les fins perdues :
// c'est sa lame. Une réplique « player » avec des `choices` propose plusieurs phrases ; celle qu'il dit mène à
// son dialogue `goto`, puis on reprend la suite.

import { QUEST_DIALOGUES, QUEST_SPEAKERS } from './quest-lines';
import { STORY_DIALOGUES, STORY_SPEAKERS } from './story-lines';
import { VILLAGE_DIALOGUES, VILLAGE_SPEAKERS } from './village-lines';

export interface Choice {
  jp: string;
  fr: string;
  goto?: string; // dialogue joué ensuite, avant de reprendre la suite
  act?: string; // action transmise au jeu quand cette phrase est dite (déduction d'un contrat)
}

export interface Line {
  who: string; // id du personnage, « wake », « sign » ou « player »
  jp?: string;
  fr: string; // traduction (ou réplique de ワケ, qui parle français ; ou consigne d'un choix)
  choices?: Choice[];
}

export const SPEAKERS: Record<string, { name: string; face?: string }> = {
  mansaku: { name: '{萬作|まんさく}', face: 'actors/oldman3_face' },
  omitsu: { name: 'おみつ', face: 'actors/princess_face' },
  taichi: { name: '{太一|たいち}', face: 'actors/villager5_face' },
  otane: { name: 'おたね', face: 'actors/oldwoman_face' },
  gonbei: { name: '{権兵衛|ごんべえ}', face: 'actors/villager3_face' },
  wake: { name: 'ワケ', face: 'actors/spirit_face' },
  player: { name: 'あなた', face: 'actors/samuraiblue_face' },
  sign: { name: '' },
  ...QUEST_SPEAKERS,
  ...STORY_SPEAKERS,
  ...VILLAGE_SPEAKERS,
};

export const DIALOGUES: Record<string, Line[]> = {
  mansaku: [
    { who: 'mansaku', jp: '{旅|たび}の{者|もの}か。……{霧|きり}じゃ。{今日|きょう}も、{霧|きり}じゃ。', fr: 'Un voyageur ? Du brouillard. Encore du brouillard aujourd’hui.' },
    { who: 'player', jp: 'はい、{旅|たび}の{者|もの}です。よろしくお{願|ねが}いします。', fr: 'Oui, je suis un voyageur. Enchanté.' },
    { who: 'mansaku', jp: 'わしは{萬作|まんさく}。{昔|むかし}は{橋|はし}を{架|か}けておった。{今|いま}は、ただの{年寄|としよ}りじゃ。', fr: 'Je suis Mansaku. Autrefois, je construisais des ponts. Aujourd’hui, je ne suis qu’un vieux.' },
    { who: 'player', jp: 'あの{吊|つ}り{橋|ばし}も、{萬作|まんさく}さんの{橋|はし}なんですか。', fr: 'Le pont suspendu aussi, c’est un de vos ponts ?' },
    { who: 'mansaku', jp: '……{吊|つ}り{橋|ばし}か。あれは……。', fr: 'Le pont suspendu… Celui-là…' },
    { who: 'mansaku', jp: '……{霧|きり}じゃ。', fr: '… Du brouillard.' },
    { who: 'wake', fr: 'Tu as vu ? Il allait dire quelque chose sur le pont, et c’est reparti sur le temps qu’il fait.' },
  ],
  'mansaku:again': [
    { who: 'mansaku', jp: 'お{前|まえ}さんか。……{霧|きり}じゃのう。', fr: 'Ah, c’est toi. Du brouillard, hein.' },
    { who: 'player', jp: '{明日|あした}も{霧|きり}かもしれませんね。', fr: 'Demain aussi, il y aura peut-être du brouillard.' },
    { who: 'mansaku', jp: '……{明日|あした}も、{霧|きり}。', fr: '… Demain aussi, du brouillard.' },
  ],
  omitsu: [
    { who: 'omitsu', jp: 'いらっしゃい！お{茶|ちゃ}、{熱|あつ}いわ。お{団子|だんご}、{甘|あま}いわよ。……それだけ。', fr: 'Bienvenue ! Le thé, chaud. Les dango, sucrés. C’est tout.' },
    {
      who: 'player',
      fr: 'Commande quelque chose : dis l’une des deux phrases.',
      choices: [
        { jp: 'お{茶|ちゃ}をください。', fr: 'Un thé, s’il vous plaît.', goto: 'omitsu:tea' },
        { jp: 'お{団子|だんご}をください。', fr: 'Des dango, s’il vous plaît.', goto: 'omitsu:dango' },
      ],
    },
    { who: 'player', jp: 'とてもおいしいと{思|おも}います。', fr: 'Je trouve ça très bon.' },
    { who: 'omitsu', jp: 'ありがとう。……あ。', fr: 'Merci. … Ah.' },
    { who: 'omitsu', jp: '{峠|とうげ}に、{何|なに}かいる。……あれ？{続|つづ}きが{出|で}てこないの。', fr: 'Il y a quelque chose au col. Hein ? La suite ne vient pas.' },
    { who: 'player', jp: '{峠|とうげ}に{何|なに}かいるんですか。', fr: 'Il y a quelque chose au col ?' },
    { who: 'omitsu', jp: '……{言|い}えないの。ごめんなさい。', fr: '… Je n’arrive pas à le dire. Pardon.' },
    { who: 'wake', fr: 'Elle voulait te raconter quelque chose, et la phrase s’est arrêtée net. Retiens ça : le col.' },
  ],
  'omitsu:tea': [{ who: 'omitsu', jp: 'はい、お{茶|ちゃ}。{熱|あつ}いわよ。', fr: 'Voilà, le thé. Il est chaud.' }],
  'omitsu:dango': [{ who: 'omitsu', jp: 'はい、お{団子|だんご}。{甘|あま}いわよ。', fr: 'Voilà, les dango. Ils sont sucrés.' }],
  'omitsu:again': [
    { who: 'omitsu', jp: 'あら、お{客|きゃく}さん。お{団子|だんご}、{甘|あま}いわよ。……{甘|あま}いわ。', fr: 'Tiens, un client. Les dango, sucrés. Sucrés.' },
    { who: 'player', jp: '{甘|あま}いものが{好|す}きなんです。', fr: 'J’aime les choses sucrées.' },
    { who: 'omitsu', jp: 'あら。……ふふ。', fr: 'Oh. … Hi hi.' },
  ],
  taichi: [
    { who: 'taichi', jp: 'お{侍|さむらい}さん！{水車小屋|すいしゃごや}に、{影|かげ}、いた！{顔|かお}、なかった！ほんとだもん！', fr: 'Monsieur le samouraï ! Au moulin, une ombre ! Sans visage ! C’est vrai, hein !' },
    { who: 'player', jp: '{影|かげ}を{見|み}たんですか。', fr: 'Tu as vu une ombre ?' },
    { who: 'taichi', jp: '{見|み}た！{大|おお}きかった！……こわかった。', fr: 'Oui ! Elle était grande ! … J’ai eu peur.' },
    { who: 'player', jp: '{悪|わる}い{影|かげ}じゃないかもしれません。', fr: 'Ce n’est peut-être pas une ombre méchante.' },
    { who: 'taichi', jp: '……ほんと？', fr: '… C’est vrai ?' },
    { who: 'player', jp: 'はい。{大丈夫|だいじょうぶ}だと{思|おも}います。', fr: 'Oui. Je pense que ça va aller.' },
    { who: 'taichi', jp: '……うん！', fr: '… D’accord !' },
    { who: 'wake', fr: 'Une ombre sans visage au moulin. Ça, c’est pour nous.' },
  ],
  'taichi:again': [
    { who: 'taichi', jp: '{水車小屋|すいしゃごや}、こわい。……こわくないもん！', fr: 'Le moulin, ça fait peur. … Même pas peur !' },
    { who: 'player', jp: '{太一|たいち}くんは{強|つよ}い{子|こ}だと{思|おも}います。', fr: 'Je trouve que tu es un garçon courageux, Taichi.' },
    { who: 'taichi', jp: 'えへへ。', fr: 'Hé hé.' },
  ],
  otane: [
    { who: 'otane', jp: '{川|かわ}の{水|みず}、{冷|つめ}たい。……{冷|つめ}たい。', fr: 'L’eau de la rivière, froide. Froide.' },
    { who: 'player', jp: 'もうすぐ{冬|ふゆ}なんですね。', fr: 'L’hiver approche, hein.' },
    { who: 'otane', jp: '……{冬|ふゆ}。', fr: '… L’hiver.' },
  ],
  gonbei: [
    { who: 'gonbei', jp: '{田|た}んぼ、{霧|きり}。{稲|いね}、{少|すく}ない。', fr: 'Les rizières, du brouillard. Le riz, peu.' },
    { who: 'player', jp: '{今年|ことし}は{寒|さむ}かったんですか。', fr: 'Il a fait froid, cette année ?' },
    { who: 'gonbei', jp: '{寒|さむ}かった。……{霧|きり}。', fr: 'Froid. … Le brouillard.' },
    { who: 'wake', fr: 'Il ne se plaint même pas. Il constate.' },
  ],
  'sign-north': [{ who: 'sign', jp: '{霧野峠|きりのとうげ}', fr: 'Le col de Kirino.' }],
  'sign-south': [{ who: 'sign', jp: 'この{先|さき}　{灯籠宿|とうろうじゅく}', fr: 'Plus loin : Tōrōjuku, le relais aux lanternes.' }],
  // Session 10 : 薄野原, la lande aux herbes hautes, et les 言蟲.
  'sign-east': [
    { who: 'sign', jp: '{東|ひがし}　{薄野原|すすきのはら}', fr: 'À l’est : Susukinohara.' },
    { who: 'wake', fr: 'Des herbes hautes à perte de vue. C’est là que traînent les 言蟲. Rien de bien méchant, mais ça grignote.' },
  ],
  'sign-susuki': [{ who: 'sign', jp: '{草|くさ}の{中|なか}に、{言蟲|ことむし}がいます。', fr: 'Dans les herbes, il y a des kotomushi.' }],
  'susuki:intro': [
    { who: 'wake', fr: 'Tu sens ? Ça grouille, dans les herbes.' },
    { who: 'wake', fr: 'Les grosses phrases jamais finies deviennent des distorsions. Les petites, les « euh… », les avis ravalés, elles s’agglutinent en bêtes : les 言蟲.' },
    { who: 'wake', fr: 'Pas méchantes. Elles grignotent les mots qui traînent. Si tu en croises une, finis sa phrase et elle s’apaise.' },
    { who: 'wake', fr: 'Chaque espèce porte une fin. Regarde-la bien, tu sauras quoi dire. Et plus on s’éloigne du village, plus elles sont coriaces.' },
    { who: 'wake', fr: 'Le 地蔵 de l’entrée a quelque chose autour du cou. Va voir.' },
  ],
  'susuki:bell': [
    { who: 'sign', jp: '{旅|たび}のお{守|まも}り。ご{自由|じゆう}にどうぞ。', fr: 'Porte-bonheur du voyageur. Servez-vous.' },
    { who: 'wake', fr: 'Un 鈴. Les 言蟲 détestent ce son : tant qu’il tinte, elles te laissent passer.' },
    { who: 'wake', fr: 'Touche X pour le faire tinter ou le ranger (ou メニュー → 持ち物). Range-le quand tu veux t’entraîner : chaque bête, c’est une phrase de plus.' },
  ],
  // Session 12 : le fond de la lande reste dans la brume jusqu'au contrat du col.
  'susuki:fog': [
    { who: 'wake', fr: 'Trop épais, par là. On n’y verrait pas nos pieds.' },
    { who: 'wake', fr: 'Derrière, il y a l’étang, et des bêtes plus coriaces. La brume s’éclaircira quand le village aura retrouvé un peu de sa voix : finissons d’abord l’affaire du col.' },
  ],
  'susuki:bell:again': [{ who: 'wake', fr: 'La corde du 地蔵 est vide. Le 鈴, c’est toi qui l’as : touche X.' }],
  'sign-bridge': [
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}　{一人|ひとり}ずつ{渡|わた}ること', fr: 'Pont suspendu. Traverser un par un.' },
    { who: 'wake', fr: 'Il grince. Je ne monte pas dessus, moi. Enfin, je flotte, mais quand même.' },
  ],
  'tomb-otsuyu': [
    { who: 'sign', jp: '{露|つゆ}の{墓|はか}', fr: 'La tombe de Tsuyu.' },
    { who: 'wake', fr: 'Quelqu’un vient la nettoyer souvent. Les fleurs sont fraîches.' },
  ],
  ...QUEST_DIALOGUES,
  ...STORY_DIALOGUES,
  ...VILLAGE_DIALOGUES,
};
