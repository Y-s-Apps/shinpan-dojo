/*
 * 問題データ（js/questions.js）の書き間違いをチェックする。
 * 使い方: node tools/validate.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'js', 'questions.js');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: 'questions.js' });
const CH = sandbox.window.SHINPAN_CHAPTERS;

const errors = [];
const ids = new Set();
const SCENES = ['half', 'led', 'cards', 'signal', 'zoom'];
const TEAMS = ['a', 'd', 'g', 'r'];
const isNum = (n) => typeof n === 'number' && isFinite(n);

if (!Array.isArray(CH) || CH.length === 0) errors.push('window.SHINPAN_CHAPTERS が見つかりません');

(CH || []).forEach((c, ci) => {
  const where = `第${ci + 1}節(${c.id || '?'})`;
  ['id', 'title', 'meta', 'lead'].forEach((k) => { if (!c[k]) errors.push(`${where}: ${k} がありません`); });
  if (!Array.isArray(c.points) || c.points.length === 0) errors.push(`${where}: points がありません`);
  if (!Array.isArray(c.qs) || c.qs.length === 0) { errors.push(`${where}: 問題(qs)がありません`); return; }
  c.qs.forEach((q, qi) => {
    const w = `${where} 問${qi + 1}(${q.id || '?'})`;
    if (!q.id) errors.push(`${w}: id がありません`);
    else if (ids.has(q.id)) errors.push(`${w}: id「${q.id}」が重複しています`);
    ids.add(q.id);
    ['q', 'verdict', 'why'].forEach((k) => { if (!q[k]) errors.push(`${w}: ${k} がありません`); });
    if (!Array.isArray(q.c) || q.c.length < 2 || q.c.length > 4) errors.push(`${w}: 選択肢(c)は2〜4個にしてください`);
    else if (!(Number.isInteger(q.a) && q.a >= 0 && q.a < q.c.length)) errors.push(`${w}: 正解の番号(a)が選択肢の範囲外です（0から数えます）`);
    if (!q.card || !q.card.t || !q.card.b) errors.push(`${w}: 審判手帳の card {t, b} がありません`);
    const s = q.scene;
    if (!s || !SCENES.includes(s.v)) { errors.push(`${w}: scene.v は ${SCENES.join(' / ')} のどれかにしてください`); return; }
    if (s.v === 'half') {
      (s.p || []).forEach((p, pi) => {
        if (!TEAMS.includes(p[0])) errors.push(`${w}: 選手${pi + 1}のチーム「${p[0]}」が不正です`);
        if (!isNum(p[2]) || !isNum(p[3])) errors.push(`${w}: 選手${pi + 1}の座標が数値ではありません`);
      });
      (s.arr || []).forEach((a, ai) => {
        if (!['pass', 'run', 'shot'].includes(a[0])) errors.push(`${w}: 矢印${ai + 1}の種類「${a[0]}」が不正です`);
        if (![1, 2, 3, 4].every((i) => isNum(a[i]))) errors.push(`${w}: 矢印${ai + 1}の座標が数値ではありません`);
      });
    }
    if (s.v === 'led' && !(Array.isArray(s.rows) && s.rows.length)) errors.push(`${w}: led には rows が必要です`);
    if (s.v === 'cards' && !(Array.isArray(s.cards) && s.cards.length)) errors.push(`${w}: cards には cards が必要です`);
    if (s.v === 'zoom' && !isNum(s.y)) errors.push(`${w}: zoom には y（ボールの位置）が必要です`);
  });
});

const total = (CH || []).reduce((n, c) => n + ((c.qs && c.qs.length) || 0), 0);
if (errors.length) {
  console.error(`✕ ${errors.length}件の問題が見つかりました`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✓ OK：${CH.length}節・${total}場面`);
