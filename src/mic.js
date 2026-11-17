/* ===== 言霊 : le micro, partagé par le combat et les dialogues =====
   Web Speech API de Chrome (ja-JP), une seule session continue pour tout le jeu : Chrome ne redemande pas la
   permission, et l'écoute ne se coupe pas entre deux scènes. Chaque phrase ne lit que ce qui est dit après son départ
   (`arm`). `listen` abonne une fonction aux changements d'état (ouvert, coupé, refusé). */
import { norm } from './combat/engine.js';

export const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const Mic = {
  rec: null, subs: [], want: false, live: false, base: 0, len: 0, pending: false, pIdx: -1, pLen: 0, carryIdx: -1, carryLen: 0, handler: null, denied: false, restarts: 0,
  start() {
    if (!SR) return false; if (this.rec) return true;
    const r = this.rec = new SR(); r.lang = 'ja-JP'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 5;
    r.onstart = () => { this.live = true; this.base = 0; this.len = 0; this.pending = false; this.pIdx = -1; this.carryIdx = -1; this.emit(); };
    r.onend = () => { this.live = false; this.pending = false; this.emit(); if (this.want && !this.denied) { this.restarts++; setTimeout(() => { try { r.start(); } catch (e) { } }, 120); } };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.denied = true; this.want = false; this.emit(); } };
    r.onresult = e => {
      this.len = e.results.length; let inter = '', pIdx = -1, pLen = 0; const fins = [];
      for (let j = 0; j < e.results.length; j++) {
        const x = e.results[j]; if (!x.isFinal && pIdx < 0) { pIdx = j; pLen = x[0].transcript.length; }
        if (j < this.base) continue;
        // la phrase précédente peut encore être en cours de finalisation : on ne garde que ce qui a été dit après
        const cut = t => (j === this.carryIdx ? (t.length > this.carryLen ? t.slice(this.carryLen) : '') : t);
        if (x.isFinal) { const alts = Array.from(x).map(a => cut(a.transcript)); if (j === this.carryIdx && norm(alts[0]).length <= 2) continue; fins.push(alts); }
        else inter += cut(x[0].transcript);
      }
      this.pending = pIdx >= 0; this.pIdx = pIdx; this.pLen = pLen; if (!this.handler) return;
      const fin = fins.map(a => a[0]).join(''), cands = [fin + inter];
      fins.forEach((alts, i) => alts.slice(1).forEach(a => cands.push(fins.map((b, k) => k === i ? a : b[0]).join('') + inter)));
      this.handler({ fin, inter, cands, settled: !!fin && !inter });
    };
    this.want = true; try { r.start(); } catch (e) { } return true;
  },
  arm(h) { if (this.pending && this.pIdx >= 0) { this.base = this.pIdx; this.carryIdx = this.pIdx; this.carryLen = this.pLen; } else { this.base = this.len; this.carryIdx = -1; } this.handler = h; },
  disarm() { this.handler = null; },
  flush() { if (this.rec && this.live) { try { this.rec.abort(); } catch (e) { } } },
  listen(f) { this.subs.push(f); },
  emit() { for (const f of this.subs) { try { f(); } catch (e) { } } },
  inject(text) { if (this.handler) this.handler({ fin: text, inter: '', cands: [text], settled: true }); }
};
