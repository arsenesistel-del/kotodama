/* ===== 言霊 : moteur de phrases (sans DOM) ===== */
const R = a => a[Math.floor(Math.random() * a.length)];
// Préférences du suivi caché (src/world/progress.ts, branchées par game.js) : `key(k)` pondère une structure,
// `entry(e, type)` un couple de mots. Sans elles (tests), le tirage reste uniforme.
let BIAS = { key: null, entry: null };
function setBias(b) { BIAS = Object.assign({ key: null, entry: null }, b || {}); }
function pickW(list, f) {
  if (!f) return R(list);
  const ws = list.map(x => Math.max(0.05, f(x) || 0)), tot = ws.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (...xs) => '(?:' + [...new Set(xs.flat().filter(Boolean))].map(esc).join('|') + ')';
function norm(s) { return (s || '').normalize('NFKC').replace(/[\s、。，,．.！？!?「」『』…〜~]/g, ''); }

// Vocabulaire des chasses, accordé au monde : un Japon de la fin d'Edo, ses villages, ses routes, ses métiers.
// Chaque entrée : sujet (écritures acceptées), puis le mot (et, pour un verbe, ses formes négative et passée).
const NA = [
  [['この村', 'このむら'], ['静か', 'しずか']], [['あの茶屋', 'あのちゃや'], ['有名', 'ゆうめい']],
  [['あの職人', 'あのしょくにん'], ['有名', 'ゆうめい']], [['彼', 'かれ'], ['元気', 'げんき']],
  [['この仕事', 'このしごと'], ['大変', 'たいへん']], [['この問題', 'このもんだい'], ['簡単', 'かんたん']],
  [['通行手形', 'つうこうてがた'], ['必要', 'ひつよう']], [['この時間', 'このじかん'], ['大切', 'たいせつ']],
  [['明日', 'あした'], ['暇', 'ひま']], [['この部屋', 'このへや'], ['きれい', 'きれい', '綺麗']],
  [['この道', 'このみち'], ['安全', 'あんぜん']], [['その話', 'そのはなし'], ['変', 'へん']],
  [['この決まり', 'このきまり'], ['複雑', 'ふくざつ']], [['あの人', 'あのひと'], ['親切', 'しんせつ']],
  [['この辺', 'このへん'], ['不便', 'ふべん']], [['彼女', 'かのじょ'], ['真面目', 'まじめ']],
  [['この宿', 'このやど'], ['にぎやか', 'にぎやか', '賑やか']], [['この国', 'このくに'], ['平和', 'へいわ']],
  [['この方法', 'このほうほう'], ['無理', 'むり']], [['その着物', 'そのきもの'], ['派手', 'はで']],
  [['この橋', 'このはし'], ['丈夫', 'じょうぶ']], [['彼の字', 'かれのじ'], ['上手', 'じょうず']],
  [['私の歌', 'わたしのうた'], ['下手', 'へた']], [['この計画', 'このけいかく'], ['危険', 'きけん']],
  [['その考え', 'そのかんがえ'], ['素敵', 'すてき', 'ステキ']], [['あの侍', 'あのさむらい'], ['暇', 'ひま']],
  [['この席', 'このせき'], ['自由', 'じゆう']], [['その説明', 'そのせつめい'], ['十分', 'じゅうぶん', '充分']],
  [['この場所', 'このばしょ'], ['特別', 'とくべつ']], [['あの祭り', 'あのまつり'], ['にぎやか', 'にぎやか', '賑やか']]];
const NO = [
  [['彼', 'かれ'], ['旅人', 'たびびと']], [['明日', 'あした'], ['祭り', 'まつり']],
  [['あの人', 'あのひと'], ['侍', 'さむらい']], [['その話', 'そのはなし'], ['本当', 'ほんとう']],
  [['あの人', 'あのひと'], ['医者', 'いしゃ']], [['今日', 'きょう'], ['雨', 'あめ']],
  [['それ', 'それ'], ['冗談', 'じょうだん']], [['原因', 'げんいん'], ['風邪', 'かぜ']],
  [['次', 'つぎ'], ['私の番', 'わたしのばん']], [['ここ', 'ここ'], ['出口', 'でぐち']],
  [['彼女', 'かのじょ'], ['留守', 'るす']], [['あの人', 'あのひと'], ['大工', 'だいく']],
  [['明日', 'あした'], ['休み', 'やすみ']], [['あれ', 'あれ'], ['嘘', 'うそ', 'ウソ']],
  [['ここ', 'ここ'], ['入口', 'いりぐち', '入り口']], [['彼', 'かれ'], ['庄屋', 'しょうや']],
  [['あの店', 'あのみせ'], ['茶屋', 'ちゃや']], [['あの二人', 'あのふたり', 'あの2人'], ['兄弟', 'きょうだい']],
  [['目的', 'もくてき'], ['お金', 'おかね']], [['彼の趣味', 'かれのしゅみ'], ['釣り', 'つり']],
  [['これ', 'これ'], ['夢', 'ゆめ']], [['相手', 'あいて'], ['子供', 'こども', '子ども']],
  [['あの建物', 'あのたてもの'], ['お寺', 'おてら']], [['あの影', 'あのかげ'], ['幽霊', 'ゆうれい']]];
const IA = [
  [['この宿', 'このやど'], ['高', 'たか']], [['今日', 'きょう'], ['寒', 'さむ']],
  [['この話', 'このはなし'], ['面白', 'おもしろ']], [['あの師匠', 'あのししょう'], ['厳し', 'きびし']],
  [['この本', 'このほん'], ['難し', 'むずかし']], [['次の宿', 'つぎのやど'], ['近', 'ちか']],
  [['都の夏', 'みやこのなつ'], ['暑', 'あつ']], [['この料理', 'このりょうり'], ['おいし', 'おいし', '美味し']],
  [['彼の話', 'かれのはなし'], ['長', 'なが']], [['あの祭り', 'あのまつり'], ['楽し', 'たのし']],
  [['今週', 'こんしゅう'], ['忙し', 'いそがし']], [['この道', 'このみち'], ['危な', 'あぶな']],
  [['この部屋', 'このへや'], ['広', 'ひろ']], [['その店', 'そのみせ'], ['安', 'やす']],
  [['この川', 'このかわ'], ['深', 'ふか']], [['彼の刀', 'かれのかたな'], ['新し', 'あたらし']],
  [['あの山', 'あのやま'], ['高', 'たか']], [['この荷物', 'このにもつ'], ['重', 'おも']],
  [['その話', 'そのはなし'], ['怖', 'こわ', '恐']], [['この薬', 'このくすり'], ['苦', 'にが']],
  [['彼女の声', 'かのじょのこえ'], ['小さ', 'ちいさ']], [['今年の冬', 'ことしのふゆ'], ['寒', 'さむ']],
  [['この刀', 'このかたな'], ['古', 'ふる']], [['あの道', 'あのみち'], ['狭', 'せま']],
  [['旅', 'たび'], ['楽し', 'たのし']], [['風', 'かぜ'], ['強', 'つよ']],
  [['夜', 'よる'], ['長', 'なが']], [['彼の説明', 'かれのせつめい'], ['詳し', 'くわし']]];
const VE = [
  [['彼', 'かれ'], ['来る', 'くる'], ['来ない', 'こない'], ['来た', 'きた']],
  [['渡し舟', 'わたしぶね'], ['遅れる', 'おくれる'], ['遅れない', 'おくれない'], ['遅れた', 'おくれた']],
  [['雨', 'あめ'], ['降る', 'ふる'], ['降らない', 'ふらない'], ['降った', 'ふった']],
  [['寄り合い', 'よりあい'], ['終わる', 'おわる', '終る'], ['終わらない', 'おわらない', '終らない'], ['終わった', 'おわった', '終った']],
  [['お客さん', 'おきゃくさん'], ['行く', 'いく'], ['行かない', 'いかない'], ['行った', 'いった']],
  [['この店', 'このみせ'], ['閉まる', 'しまる'], ['閉まらない', 'しまらない'], ['閉まった', 'しまった']],
  [['芝居', 'しばい'], ['始まる', 'はじまる'], ['始まらない', 'はじまらない'], ['始まった', 'はじまった']],
  [['彼女', 'かのじょ'], ['分かる', 'わかる'], ['分からない', 'わからない'], ['分かった', 'わかった']],
  [['水車', 'すいしゃ'], ['止まる', 'とまる'], ['止まらない', 'とまらない'], ['止まった', 'とまった']],
  [['彼', 'かれ'], ['知っている', 'しっている', '知ってる'], ['知らない', 'しらない'], ['知っていた', 'しっていた', '知ってた']],
  [['友達', 'ともだち', '友だち'], ['帰る', 'かえる'], ['帰らない', 'かえらない'], ['帰った', 'かえった']],
  [['雪', 'ゆき'], ['積もる', 'つもる'], ['積もらない', 'つもらない'], ['積もった', 'つもった']],
  [['親方', 'おやかた'], ['怒る', 'おこる'], ['怒らない', 'おこらない'], ['怒った', 'おこった']],
  [['手紙', 'てがみ'], ['届く', 'とどく'], ['届かない', 'とどかない'], ['届いた', 'とどいた']],
  [['彼女', 'かのじょ'], ['笑う', 'わらう'], ['笑わない', 'わらわない'], ['笑った', 'わらった']],
  [['時間', 'じかん'], ['足りる', 'たりる'], ['足りない', 'たりない'], ['足りた', 'たりた']],
  [['子供', 'こども', '子ども'], ['泣く', 'なく'], ['泣かない', 'なかない'], ['泣いた', 'ないた']],
  [['彼', 'かれ'], ['間に合う', 'まにあう', '間にあう'], ['間に合わない', 'まにあわない', '間にあわない'], ['間に合った', 'まにあった', '間にあった']],
  [['月', 'つき'], ['出る', 'でる'], ['出ない', 'でない'], ['出た', 'でた']],
  [['火', 'ひ'], ['消える', 'きえる'], ['消えない', 'きえない'], ['消えた', 'きえた']],
  [['霧', 'きり'], ['晴れる', 'はれる'], ['晴れない', 'はれない'], ['晴れた', 'はれた']]];
const FRAMES = {
  omou: { lab: '〜と思う', k: 'と思う', r: 'とおもう', rx: 'と(?:思う|おもう|思います|おもいます)' },
  kamo: { lab: '〜かもしれない', k: 'かもしれない', r: 'かもしれない', rx: 'かも(?:しれない|知れない|しれません|知れません)' },
  souda: { lab: '〜そうです', k: 'そうです', r: 'そうです', rx: 'そう(?:です|だ)' },
  ndesu: { lab: '〜んです', k: 'んです', r: 'んです', rx: '(?:ん|の)(?:です|だ)' }
};
const TYPES = { na: 'な形容詞', no: '名詞', ia: 'い形容詞', ve: '動詞' };
// negpast : le négatif passé (session 10, niveaux 7 à 9 des 言蟲).
const FORMS = { aff: '', neg: '否定', past: '過去', negpast: '否定・過去' };
const FORMNAME = { aff: 'la forme simple', neg: 'le négatif (否定)', past: 'le passé (過去)', negpast: 'le négatif passé (否定・過去)' };
// Négatif passé d'un verbe : sa forme négative, ない devient なかった.
const negPast = w => w.map(x => x.replace(/ない$/, 'なかった').replace(/無い$/, '無かった'));

// prédicat pour une forme donnée : écriture, lecture, regex
function pred(type, e, form, frame) {
  if (type === 'na' || type === 'no') {
    const w = e[1];
    const link = form === 'neg' ? ['じゃない', '(?:じゃない|ではない|じゃ無い|では無い)'] : form === 'negpast' ? ['じゃなかった', '(?:じゃなかった|ではなかった)'] : form === 'past' ? ['だった', 'だった']
      : frame === 'kamo' ? ['', ''] : frame === 'ndesu' ? ['な', 'な'] : ['だ', 'だ'];
    return { k: w[0] + link[0], r: w[1] + link[0], rx: alt(w) + link[1] };
  }
  if (type === 'ia') {
    const w = e[1], end = form === 'neg' ? 'くない' : form === 'negpast' ? 'くなかった' : form === 'past' ? 'かった' : 'い';
    return { k: w[0] + end, r: w[1] + end, rx: alt(w) + (form === 'neg' ? 'く(?:ない|無い)' : end) };
  }
  const w = form === 'neg' ? e[2] : form === 'negpast' ? negPast(e[2]) : form === 'past' ? e[3] : e[1];
  return { k: w[0], r: w[1], rx: alt(w) };
}
function genJoint(frame, type, forms) {
  const F = FRAMES[frame], form = R(forms || ['aff', 'aff', 'neg', 'past']);
  const e = pickW({ na: NA, no: NO, ia: IA, ve: VE }[type], BIAS.entry && (x => BIAS.entry(x, type)));
  const subj = e[0], dict = type === 'ia' ? e[1][0] + 'い' : e[1][0], dictR = type === 'ia' ? e[1][1] + 'い' : e[1][1];
  const part = type === 've' ? '(?:は|が)' : 'は';
  const head = alt(subj) + part, p = pred(type, e, form, frame);
  const bad = [];
  const add = (mid, msg) => bad.push({ rx: head + mid + F.rx, msg });
  const w = type === 've' ? null : alt(e[1]);
  if ((type === 'na' || type === 'no') && form === 'aff') {
    if (frame === 'omou' || frame === 'souda') { add(w, 'Il manque だ avant ' + F.k + '.'); add(w + 'な', 'Ici c\'est だ, pas な.'); }
    if (frame === 'kamo') { add(w + 'だ', 'Pas de だ avant かもしれない.'); add(w + 'な', 'Pas de な avant かもしれない.'); }
    if (frame === 'ndesu') { add(w + 'だ', 'Devant んです, だ devient な.'); add(w, 'Il manque な devant んです.'); }
  }
  if (type === 'ia') {
    if (form === 'aff') { add(w + 'いだ', 'Pas de だ après un adjectif en い.'); add(w + 'いな', 'Pas de な après un adjectif en い.'); }
    if (form === 'past') { add(w + 'いかった', 'Au passé, い devient かった.'); add(w + 'いだった', 'Au passé, い devient かった, sans だった.'); add(w + 'かっただ', 'Pas de だ après かった.'); }
    if (form === 'neg') { add(w + 'いくない', 'Au négatif, い devient くない.'); add(w + 'い?(?:じゃない|ではない)', 'Au négatif, un adjectif en い prend くない.'); add(w + 'くないだ', 'Pas de だ après くない.'); }
    if (form === 'negpast') { add(w + 'いくなかった', 'Au négatif passé, い devient くなかった.'); add(w + 'くないだった', 'Au négatif passé : くなかった, pas くないだった.'); add(w + 'い?(?:じゃなかった|ではなかった)', 'Un adjectif en い prend くなかった.'); add(w + 'くなかっただ', 'Pas de だ après くなかった.'); }
  }
  if (type === 've') add(p.rx + '(?:だ|な)', 'Pas de だ ni de な après un verbe.');
  if ((type === 'na' || type === 'no') && form === 'neg') add(w + 'くない', 'くない est réservé aux adjectifs en い : じゃない.');
  if ((type === 'na' || type === 'no') && form === 'past') add(w + 'かった', 'かった est réservé aux adjectifs en い : だった.');
  if ((type === 'na' || type === 'no') && form === 'negpast') { add(w + 'くなかった', 'くなかった est réservé aux adjectifs en い : じゃなかった.'); add(w + '(?:じゃない|ではない)だった', 'Au négatif passé : じゃなかった, pas じゃないだった.'); }
  for (const f of ['aff', 'neg', 'past', 'negpast']) if (f !== form) bad.push({ rx: head + pred(type, e, f, frame).rx + F.rx, msg: 'Il fallait ' + FORMNAME[form] + '.' });
  for (const f in FRAMES) if (f !== frame) bad.push({ rx: head + '.*' + FRAMES[f].rx, msg: 'La fin demandée était ' + F.lab + '.' });
  return {
    key: frame + '.' + type, form,
    cue: { a: subj[0], ar: subj[1], b: dict, br: dictR, form: FORMS[form], frame: F.lab },
    canon: subj[0] + 'は' + p.k + F.k, kana: subj[1] + 'は' + p.r + F.r,
    pk: p.k, pr: p.r, fk: F.k, fr: F.r,
    rx: head + p.rx + F.rx, bad, broken: broken(type, e, form, frame)
  };
}
// une version fausse de la phrase, à corriger à voix haute (祓)
function broken(type, e, form, frame) {
  const F = FRAMES[frame]; let w, tail;
  if (type === 'na' || type === 'no') {
    w = e[1];
    tail = form === 'neg' ? 'くない' : form === 'negpast' ? 'くなかった' : form === 'past' ? 'かった' : frame === 'kamo' ? R(['だ', 'な']) : frame === 'ndesu' ? R(['だ', '']) : R(['', 'な']);
  } else if (type === 'ia') {
    w = e[1];
    tail = form === 'neg' ? R(['いくない', 'いじゃない', 'くないだ']) : form === 'negpast' ? R(['いくなかった', 'くないだった']) : form === 'past' ? R(['いかった', 'いだった', 'かっただ']) : R(['いだ', 'いな']);
  } else {
    w = form === 'neg' ? e[2] : form === 'negpast' ? negPast(e[2]) : form === 'past' ? e[3] : e[1];
    tail = frame === 'ndesu' ? 'な' : 'だ';
  }
  return { a: e[0][0], ar: e[0][1], w: w[0], wr: w[1], tail, fk: F.k, fr: F.r, text: e[0][0] + 'は' + w[0] + tail + F.k };
}
function gen(key, forms) { const [a, b] = key.split('.'); return genJoint(a, b, forms); }
function keyLabel(key) { const [a, b] = key.split('.'); return FRAMES[a].lab + ' × ' + TYPES[b]; }
function matches(item, heard) { return new RegExp(item.rx + '$').test(norm(heard)); }
function diagnose(item, heard) {
  const h = norm(heard); if (!h) return '';
  for (const b of item.bad) if (new RegExp(b.rx + '$').test(h)) return b.msg;
  return '';
}
const ALLKEYS = []; for (const f in FRAMES) for (const t in TYPES) ALLKEYS.push(f + '.' + t);
function med(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
function statusOf(st) {
  if (!st || !st.h || !st.h.length) return 'neuf';
  const h = st.h, ok = h.filter(x => x.ok), rate = ok.length / h.length, m = med(ok.map(x => x.t));
  if (h.length < 4) return 'essai';
  if (rate < 0.7) return 'casse';
  if (m !== null && m <= 3000 && rate >= 0.8) return 'reflexe';
  return 'lent';
}

/* ---------- les distorsions ---------- */
const STAGES = [
  { id: 'kake', name: '欠けの影', fr: 'L\'ombre du manque', hint: 'だ avant と思う', keys: ['omou.na', 'omou.no'], forms: ['aff'], hp: 130, timer: 14, hue: 188, glyphs: 'だだだ欠影' },
  { id: 'kuzure', name: '崩れ', fr: 'L\'effondrement', hint: 'passé et négatif devant と思う', keys: ['omou.ia', 'omou.ve', 'omou.na', 'omou.no'], forms: ['neg', 'past', 'past', 'aff'], hp: 150, timer: 13, hue: 28, glyphs: 'かったくない崩' },
  { id: 'yuragi', name: '揺らぎ', fr: 'Le vacillement', hint: 'かもしれない sans だ, と思う avec', keys: ['kamo.na', 'kamo.no', 'kamo.ia', 'kamo.ve', 'omou.na', 'omou.no'], forms: ['aff', 'aff', 'neg', 'past'], hp: 170, timer: 12, hue: 268, glyphs: 'かもだ揺' },
  { id: 'tsutae', name: '伝え火', fr: 'Le feu rapporté', hint: 'そうです : ce qu\'on t\'a dit', keys: ['souda.na', 'souda.no', 'souda.ia', 'souda.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 180, timer: 12, hue: 48, glyphs: 'そうだ伝火' },
  { id: 'wake', name: '訳の主', fr: 'Le maître des raisons', hint: 'んです : だ devient な', keys: ['ndesu.na', 'ndesu.no', 'ndesu.ia', 'ndesu.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 190, timer: 11, hue: 328, glyphs: 'なんです訳' },
  { id: 'ou', name: '歪みの王', fr: 'Le roi des distorsions', hint: 'tout le sabre de l\'avis', keys: ALLKEYS, forms: ['aff', 'neg', 'past'], hp: 300, timer: 10, hue: 2, glyphs: '歪王だなかった' }
];
// Chasses des contrats du chapitre 1 (src/world/quests.ts) : la créature de la v4 (`art`), la fin que le village a perdue.
const CONTRACT_STAGES = [
  { id: 'c-kake', art: 'kake', lvl: 0, name: '欠けの影', fr: 'L\'ombre du manque', hint: 'と思う : un avis', keys: ['omou.na', 'omou.no', 'omou.ia', 'omou.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 140, timer: 14, hue: 188, glyphs: 'と思う欠影' },
  { id: 'c-yuragi', art: 'yuragi', lvl: 1, name: '揺らぎ', fr: 'Le vacillement', hint: 'そうです : ce qu\'on t\'a dit', keys: ['souda.na', 'souda.no', 'souda.ia', 'souda.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 160, timer: 13, hue: 268, glyphs: 'そうだ揺' },
  { id: 'c-kuzure', art: 'kuzure', lvl: 2, name: '崩れ', fr: 'L\'effondrement', hint: 'かもしれない : un doute, sans だ', keys: ['kamo.na', 'kamo.no', 'kamo.ia', 'kamo.ve', 'omou.na'], forms: ['aff', 'aff', 'neg', 'past'], hp: 170, timer: 13, hue: 28, glyphs: 'かもしれ崩' },
  // Contrats de révision, tirés des rumeurs : ils mélangent les fins déjà rendues au village.
  { id: 'c-tsubu', art: 'tsubu', lvl: 1, name: '呟き', fr: 'Le marmonnement', hint: 'révision : と思う (un avis) ou そうです (un on-dit)', keys: ['omou.na', 'omou.no', 'omou.ia', 'omou.ve', 'souda.na', 'souda.no', 'souda.ia', 'souda.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 130, timer: 13, hue: 200, glyphs: 'と思うそうだ呟' },
  { id: 'c-mayoi', art: 'mayoi', lvl: 2, name: '迷い', fr: 'L\'hésitation', hint: 'révision : と思う, そうです, かもしれない', keys: ['omou.na', 'omou.ia', 'omou.ve', 'souda.no', 'souda.ia', 'souda.ve', 'kamo.na', 'kamo.no', 'kamo.ia', 'kamo.ve'], forms: ['aff', 'aff', 'neg', 'past'], hp: 150, timer: 12, hue: 40, glyphs: 'かも思そう迷' },
  // Le cœur de la brume : le boss du chapitre mêle les quatre fins, comme un examen.
  { id: 'c-kiri', art: 'kiri', lvl: 4, boss: true, name: '霧の主', fr: 'Le seigneur de la brume', hint: 'les quatre fins mêlées : と思う, かもしれない, そうです, んです', keys: ALLKEYS, forms: ['aff', 'aff', 'neg', 'past'], hp: 260, timer: 11, hue: 210, glyphs: '霧主思かもそうん' }
];
function nextItem(stage, stats, last) {
  const w = { neuf: 3, essai: 3, casse: 4, lent: 2, reflexe: 1 };
  const pool = stage.keys.map(k => [k, w[statusOf(stats[k])] * (BIAS.key ? BIAS.key(k) : 1)]), tot = pool.reduce((s, x) => s + x[1], 0);
  for (let tries = 0; tries < 20; tries++) {
    let r = Math.random() * tot, k = pool[0][0];
    for (const [kk, ww] of pool) { r -= ww; if (r <= 0) { k = kk; break; } }
    const it = gen(k, stage.forms);
    if (!last || it.canon !== last.canon) return it;
  }
  return gen(R(stage.keys), stage.forms);
}
export { setBias, gen, genJoint, broken, matches, diagnose, norm, med, ALLKEYS, STAGES, CONTRACT_STAGES, nextItem, keyLabel, statusOf, FRAMES, TYPES, FORMS };
