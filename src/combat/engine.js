/* ===== 言霊 : moteur de phrases (sans DOM) ===== */
const R = a => a[Math.floor(Math.random() * a.length)];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (...xs) => '(?:' + [...new Set(xs.flat().filter(Boolean))].map(esc).join('|') + ')';
function norm(s) { return (s || '').normalize('NFKC').replace(/[\s、。，,．.！？!?「」『』…〜~]/g, ''); }

const NA = [
  [['この町', 'このまち', 'この街'], ['静か', 'しずか']], [['このアプリ', 'このあぷり'], ['便利', 'べんり']],
  [['あの店', 'あのみせ'], ['有名', 'ゆうめい']], [['彼', 'かれ'], ['元気', 'げんき']],
  [['この仕事', 'このしごと'], ['大変', 'たいへん']], [['この問題', 'このもんだい'], ['簡単', 'かんたん']],
  [['パスポート', 'ぱすぽーと'], ['必要', 'ひつよう']], [['この時間', 'このじかん'], ['大切', 'たいせつ']],
  [['週末', 'しゅうまつ'], ['暇', 'ひま']], [['この部屋', 'このへや'], ['きれい', 'きれい', '綺麗']],
  [['この道', 'このみち'], ['安全', 'あんぜん']], [['その話', 'そのはなし'], ['変', 'へん']],
  [['このルール', 'このるーる'], ['複雑', 'ふくざつ']], [['あの人', 'あのひと'], ['親切', 'しんせつ']],
  [['この辺', 'このへん'], ['不便', 'ふべん']], [['彼女', 'かのじょ'], ['真面目', 'まじめ']],
  [['この公園', 'このこうえん'], ['にぎやか', 'にぎやか', '賑やか']], [['この村', 'このむら'], ['平和', 'へいわ']],
  [['あの歌手', 'あのかしゅ'], ['有名', 'ゆうめい']], [['この方法', 'このほうほう'], ['無理', 'むり']],
  [['その服', 'そのふく'], ['派手', 'はで']], [['この機械', 'このきかい'], ['丈夫', 'じょうぶ']],
  [['彼の日本語', 'かれのにほんご'], ['上手', 'じょうず']], [['私の英語', 'わたしのえいご'], ['下手', 'へた']],
  [['この計画', 'このけいかく'], ['危険', 'きけん']], [['その考え', 'そのかんがえ'], ['素敵', 'すてき', 'ステキ']],
  [['明日', 'あした'], ['暇', 'ひま']], [['この席', 'このせき'], ['自由', 'じゆう']],
  [['その説明', 'そのせつめい'], ['十分', 'じゅうぶん', '充分']], [['この場所', 'このばしょ'], ['特別', 'とくべつ']]];
const NO = [
  [['彼', 'かれ'], ['学生', 'がくせい']], [['月曜日', 'げつようび'], ['休み', 'やすみ']],
  [['あの人', 'あのひと'], ['日本人', 'にほんじん']], [['これ', 'これ'], ['無料', 'むりょう']],
  [['その話', 'そのはなし'], ['本当', 'ほんとう']], [['あの人', 'あのひと'], ['先生', 'せんせい']],
  [['今日', 'きょう'], ['雨', 'あめ']], [['それ', 'それ'], ['冗談', 'じょうだん']],
  [['原因', 'げんいん'], ['風邪', 'かぜ']], [['次', 'つぎ'], ['私の番', 'わたしのばん']],
  [['ここ', 'ここ'], ['出口', 'でぐち']], [['彼女', 'かのじょ'], ['留守', 'るす']],
  [['彼女', 'かのじょ'], ['医者', 'いしゃ']], [['明日', 'あした'], ['祝日', 'しゅくじつ']],
  [['あれ', 'あれ'], ['嘘', 'うそ', 'ウソ']], [['ここ', 'ここ'], ['入口', 'いりぐち', '入り口']],
  [['彼', 'かれ'], ['社長', 'しゃちょう']], [['今', 'いま'], ['チャンス', 'ちゃんす']],
  [['あの二人', 'あのふたり', 'あの2人'], ['兄弟', 'きょうだい']], [['目的', 'もくてき'], ['お金', 'おかね']],
  [['彼の趣味', 'かれのしゅみ'], ['釣り', 'つり']], [['これ', 'これ'], ['夢', 'ゆめ']],
  [['相手', 'あいて'], ['子供', 'こども', '子ども']], [['あの建物', 'あのたてもの'], ['病院', 'びょういん']]];
const IA = [
  [['このホテル', 'このほてる'], ['高', 'たか']], [['今日', 'きょう'], ['寒', 'さむ']],
  [['この映画', 'このえいが'], ['面白', 'おもしろ']], [['あの先生', 'あのせんせい'], ['厳し', 'きびし']],
  [['この本', 'このほん'], ['難し', 'むずかし']], [['駅', 'えき'], ['近', 'ちか']],
  [['日本の夏', 'にほんのなつ'], ['暑', 'あつ']], [['この料理', 'このりょうり'], ['おいし', 'おいし', '美味し']],
  [['彼の話', 'かれのはなし'], ['長', 'なが']], [['あのゲーム', 'あのげーむ'], ['楽し', 'たのし']],
  [['今週', 'こんしゅう'], ['忙し', 'いそがし']], [['この道', 'このみち'], ['危な', 'あぶな']],
  [['この部屋', 'このへや'], ['広', 'ひろ']], [['その店', 'そのみせ'], ['安', 'やす']],
  [['この川', 'このかわ'], ['深', 'ふか']], [['彼の車', 'かれのくるま'], ['新し', 'あたらし']],
  [['あの山', 'あのやま'], ['高', 'たか']], [['この荷物', 'このにもつ'], ['重', 'おも']],
  [['その話', 'そのはなし'], ['怖', 'こわ', '恐']], [['この薬', 'このくすり'], ['苦', 'にが']],
  [['彼女の声', 'かのじょのこえ'], ['小さ', 'ちいさ']], [['今年の冬', 'ことしのふゆ'], ['寒', 'さむ']],
  [['この刀', 'このかたな'], ['古', 'ふる']], [['あの道', 'あのみち'], ['狭', 'せま']],
  [['旅', 'たび'], ['楽し', 'たのし']], [['風', 'かぜ'], ['強', 'つよ']],
  [['夜', 'よる'], ['長', 'なが']], [['彼の説明', 'かれのせつめい'], ['詳し', 'くわし']]];
const VE = [
  [['彼', 'かれ'], ['来る', 'くる'], ['来ない', 'こない'], ['来た', 'きた']],
  [['バス', 'ばす'], ['遅れる', 'おくれる'], ['遅れない', 'おくれない'], ['遅れた', 'おくれた']],
  [['雨', 'あめ'], ['降る', 'ふる'], ['降らない', 'ふらない'], ['降った', 'ふった']],
  [['会議', 'かいぎ'], ['終わる', 'おわる', '終る'], ['終わらない', 'おわらない', '終らない'], ['終わった', 'おわった', '終った']],
  [['田中さん', 'たなかさん'], ['行く', 'いく'], ['行かない', 'いかない'], ['行った', 'いった']],
  [['この店', 'このみせ'], ['閉まる', 'しまる'], ['閉まらない', 'しまらない'], ['閉まった', 'しまった']],
  [['試験', 'しけん'], ['始まる', 'はじまる'], ['始まらない', 'はじまらない'], ['始まった', 'はじまった']],
  [['彼女', 'かのじょ'], ['分かる', 'わかる'], ['分からない', 'わからない'], ['分かった', 'わかった']],
  [['電車', 'でんしゃ'], ['止まる', 'とまる'], ['止まらない', 'とまらない'], ['止まった', 'とまった']],
  [['彼', 'かれ'], ['知っている', 'しっている', '知ってる'], ['知らない', 'しらない'], ['知っていた', 'しっていた', '知ってた']],
  [['友達', 'ともだち', '友だち'], ['帰る', 'かえる'], ['帰らない', 'かえらない'], ['帰った', 'かえった']],
  [['雪', 'ゆき'], ['積もる', 'つもる'], ['積もらない', 'つもらない'], ['積もった', 'つもった']],
  [['先生', 'せんせい'], ['怒る', 'おこる'], ['怒らない', 'おこらない'], ['怒った', 'おこった']],
  [['荷物', 'にもつ'], ['届く', 'とどく'], ['届かない', 'とどかない'], ['届いた', 'とどいた']],
  [['彼女', 'かのじょ'], ['笑う', 'わらう'], ['笑わない', 'わらわない'], ['笑った', 'わらった']],
  [['時間', 'じかん'], ['足りる', 'たりる'], ['足りない', 'たりない'], ['足りた', 'たりた']],
  [['子供', 'こども', '子ども'], ['泣く', 'なく'], ['泣かない', 'なかない'], ['泣いた', 'ないた']],
  [['彼', 'かれ'], ['間に合う', 'まにあう', '間にあう'], ['間に合わない', 'まにあわない', '間にあわない'], ['間に合った', 'まにあった', '間にあった']],
  [['月', 'つき'], ['出る', 'でる'], ['出ない', 'でない'], ['出た', 'でた']],
  [['火', 'ひ'], ['消える', 'きえる'], ['消えない', 'きえない'], ['消えた', 'きえた']]];
const FRAMES = {
  omou: { lab: '〜と思う', k: 'と思う', r: 'とおもう', rx: 'と(?:思う|おもう|思います|おもいます)' },
  kamo: { lab: '〜かもしれない', k: 'かもしれない', r: 'かもしれない', rx: 'かも(?:しれない|知れない|しれません|知れません)' },
  souda: { lab: '〜そうです', k: 'そうです', r: 'そうです', rx: 'そう(?:です|だ)' },
  ndesu: { lab: '〜んです', k: 'んです', r: 'んです', rx: '(?:ん|の)(?:です|だ)' }
};
const TYPES = { na: 'な形容詞', no: '名詞', ia: 'い形容詞', ve: '動詞' };
const FORMS = { aff: '', neg: '否定', past: '過去' };
const FORMNAME = { aff: 'la forme simple', neg: 'le négatif (否定)', past: 'le passé (過去)' };

// prédicat pour une forme donnée : écriture, lecture, regex
function pred(type, e, form, frame) {
  if (type === 'na' || type === 'no') {
    const w = e[1];
    const link = form === 'neg' ? ['じゃない', '(?:じゃない|ではない|じゃ無い|では無い)'] : form === 'past' ? ['だった', 'だった']
      : frame === 'kamo' ? ['', ''] : frame === 'ndesu' ? ['な', 'な'] : ['だ', 'だ'];
    return { k: w[0] + link[0], r: w[1] + link[0], rx: alt(w) + link[1] };
  }
  if (type === 'ia') {
    const w = e[1], end = form === 'neg' ? 'くない' : form === 'past' ? 'かった' : 'い';
    return { k: w[0] + end, r: w[1] + end, rx: alt(w) + (form === 'neg' ? 'く(?:ない|無い)' : end) };
  }
  const w = form === 'neg' ? e[2] : form === 'past' ? e[3] : e[1];
  return { k: w[0], r: w[1], rx: alt(w) };
}
function genJoint(frame, type, forms) {
  const F = FRAMES[frame], form = R(forms || ['aff', 'aff', 'neg', 'past']);
  const e = R({ na: NA, no: NO, ia: IA, ve: VE }[type]);
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
  }
  if (type === 've') add(p.rx + '(?:だ|な)', 'Pas de だ ni de な après un verbe.');
  if ((type === 'na' || type === 'no') && form === 'neg') add(w + 'くない', 'くない est réservé aux adjectifs en い : じゃない.');
  if ((type === 'na' || type === 'no') && form === 'past') add(w + 'かった', 'かった est réservé aux adjectifs en い : だった.');
  for (const f of ['aff', 'neg', 'past']) if (f !== form) bad.push({ rx: head + pred(type, e, f, frame).rx + F.rx, msg: 'Il fallait ' + FORMNAME[form] + '.' });
  for (const f in FRAMES) if (f !== frame) bad.push({ rx: head + '.*' + FRAMES[f].rx, msg: 'La fin demandée était ' + F.lab + '.' });
  return {
    key: frame + '.' + type, form,
    cue: { a: subj[0], ar: subj[1], b: dict, br: dictR, form: FORMS[form], frame: F.lab },
    canon: subj[0] + 'は' + p.k + F.k, kana: subj[1] + 'は' + p.r + F.r,
    rx: head + p.rx + F.rx, bad, broken: broken(type, e, form, frame)
  };
}
// une version fausse de la phrase, à corriger à voix haute (祓)
function broken(type, e, form, frame) {
  const F = FRAMES[frame]; let w, tail;
  if (type === 'na' || type === 'no') {
    w = e[1];
    tail = form === 'neg' ? 'くない' : form === 'past' ? 'かった' : frame === 'kamo' ? R(['だ', 'な']) : frame === 'ndesu' ? R(['だ', '']) : R(['', 'な']);
  } else if (type === 'ia') {
    w = e[1];
    tail = form === 'neg' ? R(['いくない', 'いじゃない', 'くないだ']) : form === 'past' ? R(['いかった', 'いだった', 'かっただ']) : R(['いだ', 'いな']);
  } else {
    w = form === 'neg' ? e[2] : form === 'past' ? e[3] : e[1];
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
function nextItem(stage, stats, last) {
  const w = { neuf: 3, essai: 3, casse: 4, lent: 2, reflexe: 1 };
  const pool = stage.keys.map(k => [k, w[statusOf(stats[k])]]), tot = pool.reduce((s, x) => s + x[1], 0);
  for (let tries = 0; tries < 20; tries++) {
    let r = Math.random() * tot, k = pool[0][0];
    for (const [kk, ww] of pool) { r -= ww; if (r <= 0) { k = kk; break; } }
    const it = gen(k, stage.forms);
    if (!last || it.canon !== last.canon) return it;
  }
  return gen(R(stage.keys), stage.forms);
}
export { gen, genJoint, broken, matches, diagnose, norm, med, ALLKEYS, STAGES, nextItem, keyLabel, statusOf, FRAMES, TYPES, FORMS };
