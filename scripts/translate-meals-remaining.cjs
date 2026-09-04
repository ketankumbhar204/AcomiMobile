/**
 * Translate remaining meals.* English placeholders to HI/MR.
 * node scripts/translate-meals-remaining.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function leaves(o, p = '', out = []) {
  if (typeof o === 'string') {
    out.push([p, o]);
    return out;
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const k of Object.keys(o)) leaves(o[k], p ? `${p}.${k}` : k, out);
  return out;
}
function set(o, p, v) {
  const parts = p.split('.');
  let c = o;
  for (let i = 0; i < parts.length - 1; i++) {
    if (c[parts[i]] == null || typeof c[parts[i]] !== 'object') c[parts[i]] = {};
    c = c[parts[i]];
  }
  c[parts[parts.length - 1]] = v;
}
function get(o, p) {
  return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
}

const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/hi.json'), 'utf8'));
const mr = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/mr.json'), 'utf8'));
const overlay = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'natural-ui-translations.json'), 'utf8'),
);

const hl = Object.fromEntries(leaves(hi));
const rem = leaves(en).filter(([k, v]) => hl[k] === v && k.startsWith('meals.'));

const EXACT = {
  "Today's menu": { hi: 'आज का मेनू', mr: 'आजचा मेनू' },
  "Today's Menu": { hi: 'आज का मेनू', mr: 'आजचा मेनू' },
  "Today's Meals": { hi: 'आज के भोजन', mr: 'आजची जेवणे' },
  Menu: { hi: 'मेनू', mr: 'मेनू' },
  Includes: { hi: 'शामिल', mr: 'समाविष्ट' },
  'Quantity in this combo': { hi: 'इस कॉम्बो में मात्रा', mr: 'या कॉम्बोमधील प्रमाण' },
  'Menu planning': { hi: 'मेनू प्लानिंग', mr: 'मेनू प्लानिंग' },
  'Plan breakfast, lunch, and dinner from your menu library.': {
    hi: 'अपनी मेनू लाइब्रेरी से नाश्ता, दोपहर और रात का खाना प्लान करें।',
    mr: 'तुमच्या मेनू लायब्ररीतून नाश्ता, दुपार आणि रात्रीचे जेवण प्लान करा.',
  },
  "This day's meals": { hi: 'इस दिन के भोजन', mr: 'या दिवसाची जेवणे' },
  'Shared with members': { hi: 'सदस्यों के साथ शेयर', mr: 'सदस्यांसोबत शेअर' },
  'Saved, not shared': { hi: 'सेव, शेयर नहीं', mr: 'सेव्ह, शेअर नाही' },
  'Not planned': { hi: 'प्लान नहीं', mr: 'प्लान नाही' },
  'Needs reshare': { hi: 'फिर से शेयर करें', mr: 'पुन्हा शेअर करा' },
  'Show meals': { hi: 'भोजन दिखाएँ', mr: 'जेवणे दाखवा' },
  'Ready to share': { hi: 'शेयर करने के लिए तैयार', mr: 'शेअरसाठी तयार' },
  'Share changes': { hi: 'बदलाव शेयर करें', mr: 'बदल शेअर करा' },
  'Poll closed': { hi: 'पोल बंद', mr: 'पोल बंद' },
  'Tap below to add food': { hi: 'भोजन जोड़ने के लिए नीचे टैप करें', mr: 'जेवण जोडण्यासाठी खाली टॅप करा' },
  'Share to let members choose': {
    hi: 'सदस्यों को चुनने दें — शेयर करें',
    mr: 'सदस्यांना निवडू द्या — शेअर करा',
  },
  members: { hi: 'सदस्य', mr: 'सदस्य' },
  'Active meal members': { hi: 'सक्रिय भोजन सदस्य', mr: 'सक्रिय जेवण सदस्य' },
  'Review members': { hi: 'सदस्य समीक्षा', mr: 'सदस्य पुनरावलोकन' },
  'No customers yet': { hi: 'अभी कोई ग्राहक नहीं', mr: 'अद्याप ग्राहक नाहीत' },
  "Share today's menu": { hi: 'आज का मेनू शेयर करें', mr: 'आजचा मेनू शेअर करा' },
  'Share Breakfast, Lunch and Dinner together': {
    hi: 'नाश्ता, दोपहर और रात का खाना एक साथ शेयर करें',
    mr: 'नाश्ता, दुपार आणि रात्रीचे जेवण एकत्र शेअर करा',
  },
  Planned: { hi: 'प्लान किया', mr: 'प्लान केले' },
  'View menu': { hi: 'मेनू देखें', mr: 'मेनू पहा' },
  'Share meal': { hi: 'भोजन शेयर करें', mr: 'जेवण शेअर करा' },
  'Preview menu': { hi: 'मेनू पूर्वावलोकन', mr: 'मेनू पूर्वावलोकन' },
  'Copy yesterday': { hi: 'कल का कॉपी करें', mr: 'कालचे कॉपी करा' },
  'Copy Menu': { hi: 'मेनू कॉपी करें', mr: 'मेनू कॉपी करा' },
  'Menu copied from yesterday': { hi: 'कल से मेनू कॉपी किया गया', mr: 'कालपासून मेनू कॉपी केले' },
  'Could not copy menu': { hi: 'मेनू कॉपी नहीं हो सका', mr: 'मेनू कॉपी करता आले नाही' },
  'Copy Menu From': { hi: 'मेनू यहाँ से कॉपी करें', mr: 'येथून मेनू कॉपी करा' },
  'Quick suggestions': { hi: 'त्वरित सुझाव', mr: 'जलद सूचना' },
  'Last planned menu': { hi: 'पिछला प्लान किया मेनू', mr: 'मागील प्लान केलेला मेनू' },
  'Same day last week': { hi: 'पिछले सप्ताह का वही दिन', mr: 'मागील आठवड्याचा तोच दिवस' },
  'Previous menus': { hi: 'पिछले मेनू', mr: 'मागील मेनू' },
  'Choose date': { hi: 'तारीख चुनें', mr: 'तारीख निवडा' },
  'Choose the meals you want to copy.': {
    hi: 'कॉपी करने के लिए भोजन चुनें।',
    mr: 'कॉपी करण्यासाठी जेवणे निवडा.',
  },
  'Select entire day': { hi: 'पूरा दिन चुनें', mr: 'संपूर्ण दिवस निवडा' },
  'Replace existing menu?': { hi: 'मौजूदा मेनू बदलें?', mr: 'सध्याचा मेनू बदलायचा?' },
  'Replace and copy': { hi: 'बदलें और कॉपी करें', mr: 'बदला आणि कॉपी करा' },
  'Select combo': { hi: 'कॉम्बो चुनें', mr: 'कॉम्बो निवडा' },
  'Browse items & combos': { hi: 'आइटम और कॉम्बो देखें', mr: 'आयटम आणि कॉम्बो पहा' },
  'View planned menu': { hi: 'प्लान किया मेनू देखें', mr: 'प्लान केलेला मेनू पहा' },
  'Manage delivery locations': {
    hi: 'डिलीवरी स्थान प्रबंधित करें',
    mr: 'डिलिव्हरी स्थाने व्यवस्थापित करा',
  },
  'Manage meal subscriptions': {
    hi: 'भोजन सब्सक्रिप्शन प्रबंधित करें',
    mr: 'जेवण सब्सक्रिप्शन व्यवस्थापित करा',
  },
  'Tap a colour to show only those meals.': {
    hi: 'केवल वे भोजन दिखाने के लिए रंग पर टैप करें।',
    mr: 'फक्त ती जेवणे दाखवण्यासाठी रंगावर टॅप करा.',
  },
  '{{responded}} / {{eligible}} responses': {
    hi: '{{responded}} / {{eligible}} जवाब',
    mr: '{{responded}} / {{eligible}} प्रतिसाद',
  },
  '{{count}} Members': { hi: '{{count}} सदस्य', mr: '{{count}} सदस्य' },
  '{{count}} items': { hi: '{{count}} आइटम', mr: '{{count}} आयटम' },
  '{{count}} combos': { hi: '{{count}} कॉम्बो', mr: '{{count}} कॉम्बो' },
  '{{count}} chose': { hi: '{{count}} ने चुना', mr: '{{count}} जणांनी निवडले' },
  '{{count}} members chose': { hi: '{{count}} सदस्यों ने चुना', mr: '{{count}} सदस्यांनी निवडले' },
  'Active meal members: {{count}}': {
    hi: 'सक्रिय भोजन सदस्य: {{count}}',
    mr: 'सक्रिय जेवण सदस्य: {{count}}',
  },
  'Active meal members in this mess: {{count}}': {
    hi: 'इस मेस में सक्रिय भोजन सदस्य: {{count}}',
    mr: 'या मेसमधील सक्रिय जेवण सदस्य: {{count}}',
  },
  'Poll closed · {{count}} chose': {
    hi: 'पोल बंद · {{count}} ने चुना',
    mr: 'पोल बंद · {{count}} जणांनी निवडले',
  },
  'Members who can choose': { hi: 'जो सदस्य चुन सकते हैं', mr: 'जे सदस्य निवडू शकतात' },
  'These members have active meal access for this day.': {
    hi: 'इन सदस्यों के पास इस दिन सक्रिय भोजन पहुँच है।',
    mr: 'या सदस्यांकडे या दिवसासाठी सक्रिय जेवण प्रवेश आहे.',
  },
  'Sharing sends the menu and opens meal choice in the app.': {
    hi: 'शेयर करने से मेनू भेजा जाता है और ऐप में भोजन चयन खुलता है।',
    mr: 'शेअर केल्याने मेनू पाठवला जातो आणि अॅपमध्ये जेवण निवड उघडते.',
  },
  'Edited — customers still see the previous shared menu': {
    hi: 'संपादित — ग्राहकों को अभी भी पिछला शेयर किया मेनू दिख रहा है',
    mr: 'संपादित — ग्राहकांना अजूनही मागील शेअर केलेला मेनू दिसतो',
  },
  'Needs reshare · prior poll had {{count}} responses': {
    hi: 'फिर से शेयर करें · पिछले पोल में {{count}} जवाब',
    mr: 'पुन्हा शेअर करा · मागील पोलमध्ये {{count}} प्रतिसाद',
  },
  'Tap a combo to add it to this meal. One tap — done.': {
    hi: 'इस भोजन में जोड़ने के लिए कॉम्बो पर टैप करें। एक टैप — हो गया।',
    mr: 'या जेवणात जोडण्यासाठी कॉम्बोवर टॅप करा. एक टॅप — झाले.',
  },
  'Tap a combo to select or deselect it.': {
    hi: 'चयन या चयन हटाने के लिए कॉम्बो पर टैप करें।',
    mr: 'निवड किंवा निवड काढण्यासाठी कॉम्बोवर टॅप करा.',
  },
  'Choose a date before the menu date.': {
    hi: 'मेनू तारीख से पहले की तारीख चुनें।',
    mr: 'मेनू तारीखपूर्वीची तारीख निवडा.',
  },
  'No planned menus were found on that date.': {
    hi: 'उस तारीख पर कोई प्लान किया मेनू नहीं मिला।',
    mr: 'त्या तारखेला कोणताही प्लान केलेला मेनू सापडला नाही.',
  },
  'Could not load previous menus.': {
    hi: 'पिछले मेनू लोड नहीं हो सके।',
    mr: 'मागील मेनू लोड करता आले नाहीत.',
  },
  'No previous planned menus found.': {
    hi: 'कोई पिछला प्लान किया मेनू नहीं मिला।',
    mr: 'मागील प्लान केलेले मेनू सापडले नाहीत.',
  },
  "Today · {{date}}": { hi: 'आज · {{date}}', mr: 'आज · {{date}}' },
};

const WORD_HI = [
  [/Today's menu/gi, 'आज का मेनू'],
  [/Today's Menu/gi, 'आज का मेनू'],
  [/Menu planning/gi, 'मेनू प्लानिंग'],
  [/Not planned/gi, 'प्लान नहीं'],
  [/Shared with members/gi, 'सदस्यों के साथ शेयर'],
  [/Needs reshare/gi, 'फिर से शेयर करें'],
  [/Poll closed/gi, 'पोल बंद'],
  [/Share meal/gi, 'भोजन शेयर करें'],
  [/Share menu/gi, 'मेनू शेयर करें'],
  [/Copy Menu/gi, 'मेनू कॉपी करें'],
  [/members?/gi, 'सदस्य'],
  [/Members/g, 'सदस्य'],
  [/responses?/gi, 'जवाब'],
  [/Responses/g, 'जवाब'],
  [/combo/gi, 'कॉम्बो'],
  [/items?/gi, 'आइटम'],
  [/Items/g, 'आइटम'],
  [/meals?/gi, 'भोजन'],
  [/Meals/g, 'भोजन'],
  [/menu/gi, 'मेनू'],
  [/Menu/g, 'मेनू'],
  [/poll/gi, 'पोल'],
  [/Poll/g, 'पोल'],
  [/share/gi, 'शेयर'],
  [/Share/g, 'शेयर'],
  [/planned/gi, 'प्लान किया'],
  [/Planned/g, 'प्लान किया'],
  [/empty/gi, 'खाली'],
  [/draft/gi, 'ड्राफ्ट'],
  [/closed/gi, 'बंद'],
  [/open/gi, 'खुला'],
  [/active/gi, 'सक्रिय'],
  [/Active/g, 'सक्रिय'],
  [/delivery/gi, 'डिलीवरी'],
  [/subscription/gi, 'सब्सक्रिप्शन'],
  [/Subscription/g, 'सब्सक्रिप्शन'],
  [/library/gi, 'लाइब्रेरी'],
  [/Library/g, 'लाइब्रेरी'],
  [/quantity/gi, 'मात्रा'],
  [/Quantity/g, 'मात्रा'],
  [/price/gi, 'कीमत'],
  [/Price/g, 'कीमत'],
  [/plates?/gi, 'प्लेट'],
  [/Plates/g, 'प्लेट'],
  [/chose/gi, 'चुना'],
  [/Choose/g, 'चुनें'],
  [/Select/g, 'चुनें'],
  [/Add /g, 'जोड़ें '],
  [/Remove /g, 'हटाएँ '],
  [/Save /g, 'सेव '],
  [/Edit /g, 'संपादित करें '],
  [/Delete /g, 'हटाएँ '],
  [/View /g, 'देखें '],
  [/Manage /g, 'प्रबंधित करें '],
  [/Could not /gi, 'नहीं हो सका: '],
  [/Failed to /gi, 'विफल: '],
  [/Please /g, 'कृपया '],
  [/Tap /g, 'टैप करें '],
];

const WORD_MR = [
  [/Today's menu/gi, 'आजचा मेनू'],
  [/Today's Menu/gi, 'आजचा मेनू'],
  [/Menu planning/gi, 'मेनू प्लानिंग'],
  [/Not planned/gi, 'प्लान नाही'],
  [/Shared with members/gi, 'सदस्यांसोबत शेअर'],
  [/Needs reshare/gi, 'पुन्हा शेअर करा'],
  [/Poll closed/gi, 'पोल बंद'],
  [/Share meal/gi, 'जेवण शेअर करा'],
  [/Share menu/gi, 'मेनू शेअर करा'],
  [/Copy Menu/gi, 'मेनू कॉपी करा'],
  [/members?/gi, 'सदस्य'],
  [/Members/g, 'सदस्य'],
  [/responses?/gi, 'प्रतिसाद'],
  [/Responses/g, 'प्रतिसाद'],
  [/combo/gi, 'कॉम्बो'],
  [/items?/gi, 'आयटम'],
  [/Items/g, 'आयटम'],
  [/meals?/gi, 'जेवणे'],
  [/Meals/g, 'जेवणे'],
  [/menu/gi, 'मेनू'],
  [/Menu/g, 'मेनू'],
  [/poll/gi, 'पोल'],
  [/Poll/g, 'पोल'],
  [/share/gi, 'शेअर'],
  [/Share/g, 'शेअर'],
  [/planned/gi, 'प्लान केले'],
  [/Planned/g, 'प्लान केले'],
  [/empty/gi, 'रिकामे'],
  [/draft/gi, 'मसुदा'],
  [/closed/gi, 'बंद'],
  [/open/gi, 'उघडे'],
  [/active/gi, 'सक्रिय'],
  [/Active/g, 'सक्रिय'],
  [/delivery/gi, 'डिलिव्हरी'],
  [/subscription/gi, 'सब्सक्रिप्शन'],
  [/Subscription/g, 'सब्सक्रिप्शन'],
  [/library/gi, 'लायब्ररी'],
  [/Library/g, 'लायब्ररी'],
  [/quantity/gi, 'प्रमाण'],
  [/Quantity/g, 'प्रमाण'],
  [/price/gi, 'किंमत'],
  [/Price/g, 'किंमत'],
  [/plates?/gi, 'प्लेट'],
  [/Plates/g, 'प्लेट'],
  [/chose/gi, 'निवडले'],
  [/Choose/g, 'निवडा'],
  [/Select/g, 'निवडा'],
  [/Add /g, 'जोडा '],
  [/Remove /g, 'काढा '],
  [/Save /g, 'सेव्ह '],
  [/Edit /g, 'संपादित करा '],
  [/Delete /g, 'हटवा '],
  [/View /g, 'पहा '],
  [/Manage /g, 'व्यवस्थापित करा '],
  [/Could not /gi, 'झाले नाही: '],
  [/Failed to /gi, 'अयशस्वी: '],
  [/Please /g, 'कृपया '],
  [/Tap /g, 'टॅप करा '],
];

function protect(s) {
  const t = [];
  return {
    s: s.replace(/\{\{[^}]+\}\}/g, m => {
      t.push(m);
      return `__T${t.length - 1}__`;
    }),
    t,
  };
}
function restore(s, t) {
  return s.replace(/__T(\d+)__/g, (_, i) => t[Number(i)] || '');
}
function tr(val, rules, lang) {
  if (EXACT[val]) return EXACT[val][lang];
  const { s, t } = protect(val);
  let out = s;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  out = restore(out, t);
  if (out === val || !/[\u0900-\u097F]/.test(out)) return null;
  return out;
}

let n = 0;
for (const [k, v] of rem) {
  const h = tr(v, WORD_HI, 'hi');
  const m = tr(v, WORD_MR, 'mr');
  if (!h && !m) continue;
  const hv = h || v;
  const mv = m || v;
  if (get(hi, k) === v) {
    set(hi, k, hv);
    n++;
  }
  if (get(mr, k) === v) set(mr, k, mv);
  overlay.byKey[k] = { hi: hv, mr: mv };
}
Object.assign(overlay.byExactEnglish, EXACT);

fs.writeFileSync(path.join(ROOT, 'src/i18n/locales/hi.json'), JSON.stringify(hi, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'src/i18n/locales/mr.json'), JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, 'natural-ui-translations.json'), JSON.stringify(overlay, null, 2) + '\n');
console.log(JSON.stringify({ mealsRemainingBefore: rem.length, mealsPatched: n }, null, 2));
