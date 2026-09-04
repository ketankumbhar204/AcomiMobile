/**
 * Translate remaining membership/occupancy/paymentCollection/complaints/inventory English → HI/MR
 * node scripts/translate-ops-remaining.cjs
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

const PREFIXES = [
  'membership.',
  'members.',
  'occupancy.',
  'occupancyWizard.',
  'paymentCollection.',
  'payments.',
  'complaints.',
  'inventory.',
  'spaces.',
  'onboarding.',
  'permissions.',
  'home.',
  'list.',
  'notifications.',
  'dashboard.',
];

const EXACT = {
  'No members yet': { hi: 'अभी कोई सदस्य नहीं', mr: 'अद्याप सदस्य नाहीत' },
  'People in this space': { hi: 'इस स्पेस के लोग', mr: 'या स्पेसमधील लोक' },
  'On ACOMI': { hi: 'ACOMI पर', mr: 'ACOMI वर' },
  'Not on ACOMI yet': { hi: 'अभी ACOMI पर नहीं', mr: 'अद्याप ACOMI वर नाही' },
  'Mobile: {{value}}': { hi: 'मोबाइल: {{value}}', mr: 'मोबाइल: {{value}}' },
  'Added: {{date}}': { hi: 'जोड़ा गया: {{date}}', mr: 'जोडले: {{date}}' },
  'Send invitation': { hi: 'निमंत्रण भेजें', mr: 'आमंत्रण पाठवा' },
  'Want them on ACOMI?': { hi: 'क्या उन्हें ACOMI पर लाना है?', mr: 'त्यांना ACOMI वर आणायचे?' },
  'Member details': { hi: 'सदस्य विवरण', mr: 'सदस्य तपशील' },
  OR: { hi: 'या', mr: 'किंवा' },
  'Import existing people': { hi: 'मौजूदा लोगों को इंपोर्ट करें', mr: 'विद्यमान लोकांना इंपोर्ट करा' },
  'Import from other spaces': { hi: 'अन्य स्पेस से इंपोर्ट करें', mr: 'इतर स्पेसमधून इंपोर्ट करा' },
  'Why add customers first?': {
    hi: 'पहले ग्राहक क्यों जोड़ें?',
    mr: 'आधी ग्राहक का जोडावेत?',
  },
  "Receive today's menu": { hi: 'आज का मेनू प्राप्त करें', mr: 'आजचा मेनू मिळवा' },
  'Accurate billing & delivery': {
    hi: 'सटीक बिलिंग और डिलीवरी',
    mr: 'अचूक बिलिंग आणि डिलिव्हरी',
  },
  'What happens next?': { hi: 'आगे क्या होगा?', mr: 'पुढे काय?' },
  'People from your other spaces': {
    hi: 'आपके अन्य स्पेस के लोग',
    mr: 'तुमच्या इतर स्पेसमधील लोक',
  },
  '{{count}} found': { hi: '{{count}} मिले', mr: '{{count}} सापडले' },
  'All ({{count}})': { hi: 'सभी ({{count}})', mr: 'सर्व ({{count}})' },
  'Customers ({{count}})': { hi: 'ग्राहक ({{count}})', mr: 'ग्राहक ({{count}})' },
  'Residents ({{count}})': { hi: 'निवासी ({{count}})', mr: 'रहिवासी ({{count}})' },
  'Former ({{count}})': { hi: 'पूर्व ({{count}})', mr: 'मागील ({{count}})' },
  'Former Customer': { hi: 'पूर्व ग्राहक', mr: 'मागील ग्राहक' },
  'Former Resident': { hi: 'पूर्व निवासी', mr: 'मागील रहिवासी' },
  'Current Resident': { hi: 'वर्तमान निवासी', mr: 'सध्याचे रहिवासी' },
  'Current Customer': { hi: 'वर्तमान ग्राहक', mr: 'सध्याचे ग्राहक' },
  'No people found': { hi: 'कोई व्यक्ति नहीं मिला', mr: 'कोणी सापडले नाही' },
  Role: { hi: 'भूमिका', mr: 'भूमिका' },
  Member: { hi: 'सदस्य', mr: 'सदस्य' },
  'Meal billing': { hi: 'भोजन बिलिंग', mr: 'जेवण बिलिंग' },
  'Change meal billing': { hi: 'भोजन बिलिंग बदलें', mr: 'जेवण बिलिंग बदला' },
  Male: { hi: 'पुरुष', mr: 'पुरुष' },
  Female: { hi: 'महिला', mr: 'स्त्री' },
  Other: { hi: 'अन्य', mr: 'इतर' },
  'Not set': { hi: 'सेट नहीं', mr: 'सेट नाही' },
  'No pending invitations': { hi: 'कोई लंबित निमंत्रण नहीं', mr: 'प्रलंबित आमंत्रणे नाहीत' },
  Invitations: { hi: 'निमंत्रण', mr: 'आमंत्रणे' },
  'Join a space': { hi: 'स्पेस से जुड़ें', mr: 'स्पेसशी जोडा' },
  "You're invited": { hi: 'आपको आमंत्रित किया गया है', mr: 'तुम्हाला आमंत्रित केले आहे' },
  'Accept invitation': { hi: 'निमंत्रण स्वीकारें', mr: 'आमंत्रण स्वीकारा' },
  'Accepting…': { hi: 'स्वीकार हो रहा है…', mr: 'स्वीकारत आहे…' },
  'Skip for now': { hi: 'अभी छोड़ें', mr: 'आता वगळा' },
  'Welcome to {{spaceName}}': { hi: '{{spaceName}} में स्वागत है', mr: '{{spaceName}} मध्ये स्वागत आहे' },
  '{{count}} pending invitation(s)': {
    hi: '{{count}} लंबित निमंत्रण',
    mr: '{{count}} प्रलंबित आमंत्रणे',
  },
  'Tap to review and join': { hi: 'समीक्षा और जुड़ने के लिए टैप करें', mr: 'पुनरावलोकन व जोडण्यासाठी टॅप करा' },
  Profile: { hi: 'प्रोफ़ाइल', mr: 'प्रोफाइल' },
  Notes: { hi: 'नोट्स', mr: 'नोट्स' },
  History: { hi: 'इतिहास', mr: 'इतिहास' },
  Vacated: { hi: 'खाली किया', mr: 'रिकामे केले' },
  Suspended: { hi: 'निलंबित', mr: 'निलंबित' },
  Blacklisted: { hi: 'ब्लैकलिस्ट', mr: 'ब्लॅकलिस्ट' },
  'Emergency Contact': { hi: 'आपातकालीन संपर्क', mr: 'आपत्कालीन संपर्क' },
  'Contact Name': { hi: 'संपर्क नाम', mr: 'संपर्क नाव' },
  Relation: { hi: 'रिश्ता', mr: 'नाते' },
  'From another space': { hi: 'अन्य स्पेस से', mr: 'इतर स्पेसमधून' },
  'New customer': { hi: 'नया ग्राहक', mr: 'नवा ग्राहक' },
  '+ Add': { hi: '+ जोड़ें', mr: '+ जोडा' },
  'Already in this mess': { hi: 'पहले से इस मेस में', mr: 'आधीपासून या मेसमध्ये' },
  'Invitation sent': { hi: 'निमंत्रण भेजा गया', mr: 'आमंत्रण पाठवले' },
  'Invitation sent.': { hi: 'निमंत्रण भेजा गया।', mr: 'आमंत्रण पाठवले.' },
  'Are you sure you want to remove this member?': {
    hi: 'क्या आप वाकई इस सदस्य को हटाना चाहते हैं?',
    mr: 'तुम्हाला खरोखर हा सदस्य काढायचा आहे का?',
  },
  'Member status updated.': { hi: 'सदस्य स्थिति अपडेट हुई।', mr: 'सदस्य स्थिती अपडेट झाली.' },
  'Active, left, or other status': {
    hi: 'सक्रिय, छोड़ा, या अन्य स्थिति',
    mr: 'सक्रिय, सोडले, किंवा इतर स्थिती',
  },
  'Name, relation, and mobile': {
    hi: 'नाम, रिश्ता और मोबाइल',
    mr: 'नाव, नाते आणि मोबाइल',
  },
  'Emergency contact updated.': {
    hi: 'आपातकालीन संपर्क अपडेट हुआ।',
    mr: 'आपत्कालीन संपर्क अपडेट झाला.',
  },
  'Customer added to this mess.': {
    hi: 'ग्राहक इस मेस में जोड़ा गया।',
    mr: 'ग्राहक या मेसमध्ये जोडला.',
  },
  'No invitations right now': {
    hi: 'अभी कोई निमंत्रण नहीं',
    mr: 'आता कोणतेही आमंत्रण नाही',
  },
  'Invites waiting to be accepted': {
    hi: 'स्वीकृति की प्रतीक्षा में निमंत्रण',
    mr: 'स्वीकृतीची वाट पाहणारी आमंत्रणे',
  },
  'Invited by: {{name}}': { hi: 'आमंत्रितकर्ता: {{name}}', mr: 'आमंत्रितकर्ता: {{name}}' },
  'Invited by {{name}}': { hi: '{{name}} द्वारा आमंत्रित', mr: '{{name}} यांनी आमंत्रित' },
  'Sent: {{date}}': { hi: 'भेजा: {{date}}', mr: 'पाठवले: {{date}}' },
  'Expires {{date}}': { hi: 'समाप्ति {{date}}', mr: 'कालबाह्य {{date}}' },
  'From {{space}}': { hi: '{{space}} से', mr: '{{space}} मधून' },
  'Lives in {{space}}': { hi: '{{space}} में रहता है', mr: '{{space}} मध्ये राहतो' },
  'e.g. Rahul Sharma': { hi: 'जैसे राहुल शर्मा', mr: 'उदा. राहुल शर्मा' },
  'e.g. 9876543210': { hi: 'जैसे 9876543210', mr: 'उदा. 9876543210' },
  'e.g. Priya Sharma': { hi: 'जैसे प्रिया शर्मा', mr: 'उदा. प्रिया शर्मा' },
  'e.g. Mother': { hi: 'जैसे माता', mr: 'उदा. आई' },
};

const WORD_HI = [
  [/invitation/gi, 'निमंत्रण'],
  [/Invitation/g, 'निमंत्रण'],
  [/members?/gi, 'सदस्य'],
  [/Members/g, 'सदस्य'],
  [/customers?/gi, 'ग्राहक'],
  [/Customers/g, 'ग्राहक'],
  [/residents?/gi, 'निवासी'],
  [/Residents/g, 'निवासी'],
  [/pending/gi, 'लंबित'],
  [/Pending/g, 'लंबित'],
  [/import/gi, 'इंपोर्ट'],
  [/Import/g, 'इंपोर्ट'],
  [/emergency/gi, 'आपातकालीन'],
  [/Emergency/g, 'आपातकालीन'],
  [/contact/gi, 'संपर्क'],
  [/Contact/g, 'संपर्क'],
  [/status/gi, 'स्थिति'],
  [/Status/g, 'स्थिति'],
  [/profile/gi, 'प्रोफ़ाइल'],
  [/Profile/g, 'प्रोफ़ाइल'],
  [/billing/gi, 'बिलिंग'],
  [/Billing/g, 'बिलिंग'],
  [/payment/gi, 'भुगतान'],
  [/Payment/g, 'भुगतान'],
  [/complaint/gi, 'शिकायत'],
  [/Complaint/g, 'शिकायत'],
  [/inventory/gi, 'इन्वेंटरी'],
  [/Inventory/g, 'इन्वेंटरी'],
  [/occupancy/gi, 'अधिभोग'],
  [/Occupancy/g, 'अधिभोग'],
  [/allocate/gi, 'आवंटित'],
  [/Allocate/g, 'आवंटित'],
  [/reserve/gi, 'आरक्षित'],
  [/Reserve/g, 'आरक्षित'],
  [/vacate/gi, 'खाली करें'],
  [/Vacate/g, 'खाली करें'],
  [/transfer/gi, 'ट्रांसफर'],
  [/Transfer/g, 'ट्रांसफर'],
  [/deposit/gi, 'जमा'],
  [/Deposit/g, 'जमा'],
  [/rent/gi, 'किराया'],
  [/Rent/g, 'किराया'],
  [/stock/gi, 'स्टॉक'],
  [/Stock/g, 'स्टॉक'],
  [/supplier/gi, 'सप्लायर'],
  [/Supplier/g, 'सप्लायर'],
  [/category/gi, 'श्रेणी'],
  [/Category/g, 'श्रेणी'],
  [/priority/gi, 'प्राथमिकता'],
  [/Priority/g, 'प्राथमिकता'],
  [/assigned/gi, 'असाइन'],
  [/Assigned/g, 'असाइन'],
  [/empty/gi, 'खाली'],
  [/Empty/g, 'खाली'],
  [/search/gi, 'खोज'],
  [/Search/g, 'खोज'],
  [/filter/gi, 'फ़िल्टर'],
  [/Filter/g, 'फ़िल्टर'],
  [/add /gi, 'जोड़ें '],
  [/Add /g, 'जोड़ें '],
  [/remove /gi, 'हटाएँ '],
  [/Remove /g, 'हटाएँ '],
  [/edit /gi, 'संपादित करें '],
  [/Edit /g, 'संपादित करें '],
  [/save /gi, 'सेव '],
  [/Save /g, 'सेव '],
  [/delete /gi, 'हटाएँ '],
  [/Delete /g, 'हटाएँ '],
  [/create /gi, 'बनाएँ '],
  [/Create /g, 'बनाएँ '],
  [/update /gi, 'अपडेट '],
  [/Update /g, 'अपडेट '],
  [/view /gi, 'देखें '],
  [/View /g, 'देखें '],
  [/send /gi, 'भेजें '],
  [/Send /g, 'भेजें '],
  [/accept /gi, 'स्वीकारें '],
  [/Accept /g, 'स्वीकारें '],
  [/please /gi, 'कृपया '],
  [/Please /g, 'कृपया '],
  [/failed/gi, 'विफल'],
  [/success/gi, 'सफल'],
  [/required/gi, 'आवश्यक'],
  [/optional/gi, 'वैकल्पिक'],
];

const WORD_MR = [
  [/invitation/gi, 'आमंत्रण'],
  [/Invitation/g, 'आमंत्रण'],
  [/members?/gi, 'सदस्य'],
  [/Members/g, 'सदस्य'],
  [/customers?/gi, 'ग्राहक'],
  [/Customers/g, 'ग्राहक'],
  [/residents?/gi, 'रहिवासी'],
  [/Residents/g, 'रहिवासी'],
  [/pending/gi, 'प्रलंबित'],
  [/Pending/g, 'प्रलंबित'],
  [/import/gi, 'इंपोर्ट'],
  [/Import/g, 'इंपोर्ट'],
  [/emergency/gi, 'आपत्कालीन'],
  [/Emergency/g, 'आपत्कालीन'],
  [/contact/gi, 'संपर्क'],
  [/Contact/g, 'संपर्क'],
  [/status/gi, 'स्थिती'],
  [/Status/g, 'स्थिती'],
  [/profile/gi, 'प्रोफाइल'],
  [/Profile/g, 'प्रोफाइल'],
  [/billing/gi, 'बिलिंग'],
  [/Billing/g, 'बिलिंग'],
  [/payment/gi, 'पेमेंट'],
  [/Payment/g, 'पेमेंट'],
  [/complaint/gi, 'तक्रार'],
  [/Complaint/g, 'तक्रार'],
  [/inventory/gi, 'इन्व्हेंटरी'],
  [/Inventory/g, 'इन्व्हेंटरी'],
  [/occupancy/gi, 'अधिभोग'],
  [/Occupancy/g, 'अधिभोग'],
  [/allocate/gi, 'वाटप'],
  [/Allocate/g, 'वाटप'],
  [/reserve/gi, 'राखीव'],
  [/Reserve/g, 'राखीव'],
  [/vacate/gi, 'रिकामे करा'],
  [/Vacate/g, 'रिकामे करा'],
  [/transfer/gi, 'ट्रान्सफर'],
  [/Transfer/g, 'ट्रान्सफर'],
  [/deposit/gi, 'डिपॉझिट'],
  [/Deposit/g, 'डिपॉझिट'],
  [/rent/gi, 'भाडे'],
  [/Rent/g, 'भाडे'],
  [/stock/gi, 'स्टॉक'],
  [/Stock/g, 'स्टॉक'],
  [/supplier/gi, 'सप्लायर'],
  [/Supplier/g, 'सप्लायर'],
  [/category/gi, 'श्रेणी'],
  [/Category/g, 'श्रेणी'],
  [/priority/gi, 'प्राधान्य'],
  [/Priority/g, 'प्राधान्य'],
  [/assigned/gi, 'असाइन'],
  [/Assigned/g, 'असाइन'],
  [/empty/gi, 'रिकामे'],
  [/Empty/g, 'रिकामे'],
  [/search/gi, 'शोध'],
  [/Search/g, 'शोध'],
  [/filter/gi, 'फिल्टर'],
  [/Filter/g, 'फिल्टर'],
  [/add /gi, 'जोडा '],
  [/Add /g, 'जोडा '],
  [/remove /gi, 'काढा '],
  [/Remove /g, 'काढा '],
  [/edit /gi, 'संपादित करा '],
  [/Edit /g, 'संपादित करा '],
  [/save /gi, 'सेव्ह '],
  [/Save /g, 'सेव्ह '],
  [/delete /gi, 'हटवा '],
  [/Delete /g, 'हटवा '],
  [/create /gi, 'तयार करा '],
  [/Create /g, 'तयार करा '],
  [/update /gi, 'अपडेट '],
  [/Update /g, 'अपडेट '],
  [/view /gi, 'पहा '],
  [/View /g, 'पहा '],
  [/send /gi, 'पाठवा '],
  [/Send /g, 'पाठवा '],
  [/accept /gi, 'स्वीकारा '],
  [/Accept /g, 'स्वीकारा '],
  [/please /gi, 'कृपया '],
  [/Please /g, 'कृपया '],
  [/failed/gi, 'अयशस्वी'],
  [/success/gi, 'यशस्वी'],
  [/required/gi, 'आवश्यक'],
  [/optional/gi, 'पर्यायी'],
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

const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8'));
const hi = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/hi.json'), 'utf8'));
const mr = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/mr.json'), 'utf8'));
const overlay = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'natural-ui-translations.json'), 'utf8'),
);
const hl = Object.fromEntries(leaves(hi));
const rem = leaves(en).filter(
  ([k, v]) => hl[k] === v && PREFIXES.some(p => k.startsWith(p)),
);

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
fs.writeFileSync(
  path.join(__dirname, 'natural-ui-translations.json'),
  JSON.stringify(overlay, null, 2) + '\n',
);
console.log(JSON.stringify({ remainingBefore: rem.length, patched: n }, null, 2));
