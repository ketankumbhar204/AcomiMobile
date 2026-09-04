/**
 * Generate HI/MR translations for remaining English placeholders using:
 * 1) exact full-string dictionary
 * 2) common word/phrase replacements for short labels
 * 3) skip if already natural / contains only {{vars}} and numbers
 *
 * Usage: node scripts/generate-remaining-translations.cjs
 * Then: node scripts/apply-natural-translations.cjs [--web]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8'));
const overlayPath = path.join(__dirname, 'natural-ui-translations.json');
const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));

function leaves(o, p = '', out = []) {
  if (typeof o === 'string') {
    out.push([p, o]);
    return out;
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const k of Object.keys(o)) leaves(o[k], p ? `${p}.${k}` : k, out);
  return out;
}

/** Exact English → {hi, mr} for full leaf values */
const EXACT = {
  // already partly covered — keep expanding
  'Search…': { hi: 'खोजें…', mr: 'शोधा…' },
  'Search by bed number': { hi: 'बिस्तर नंबर से खोजें', mr: 'बेड क्रमांकाने शोधा' },
  Name: { hi: 'नाम', mr: 'नाव' },
  Code: { hi: 'कोड', mr: 'कोड' },
  Created: { hi: 'बनाया गया', mr: 'तयार केले' },
  Updated: { hi: 'अपडेट किया गया', mr: 'अपडेट केले' },
  'Default monthly rent (prefill only)': {
    hi: 'डिफ़ॉल्ट मासिक किराया (केवल प्रीफ़िल)',
    mr: 'डिफॉल्ट मासिक भाडे (फक्त प्रीफिल)',
  },
  'Default deposit (prefill only)': {
    hi: 'डिफ़ॉल्ट जमा (केवल प्रीफ़िल)',
    mr: 'डिफॉल्ट डिपॉझिट (फक्त प्रीफिल)',
  },
  'Enter rent': { hi: 'किराया दर्ज करें', mr: 'भाडे भरा' },
  'Enter deposit': { hi: 'जमा दर्ज करें', mr: 'डिपॉझिट भरा' },
  'Set rent after you save': {
    hi: 'सेव करने के बाद किराया सेट करें',
    mr: 'सेव्ह केल्यानंतर भाडे सेट करा',
  },
  'Please select a status.': { hi: 'कृपया स्थिति चुनें।', mr: 'कृपया स्थिती निवडा.' },
  'Please select a room type.': {
    hi: 'कृपया कमरे का प्रकार चुनें।',
    mr: 'कृपया खोलीचा प्रकार निवडा.',
  },
  'Room Type': { hi: 'कमरे का प्रकार', mr: 'खोलीचा प्रकार' },
  Deactivated: { hi: 'निष्क्रिय', mr: 'निष्क्रिय' },
  'Property layout': { hi: 'प्रॉपर्टी लेआउट', mr: 'प्रॉपर्टी लेआउट' },
  Selected: { hi: 'चयनित', mr: 'निवडलेले' },
  'Corridor PG': { hi: 'कॉरिडोर पीजी', mr: 'कॉरिडॉर पीजी' },
  'Apartment PG': { hi: 'अपार्टमेंट पीजी', mr: 'अपार्टमेंट पीजी' },
  'Co-living': { hi: 'को-लिविंग', mr: 'को-लिव्हिंग' },
  Rental: { hi: 'किराया', mr: 'भाडे' },
  'Rooms arranged along a central corridor. Ideal for traditional PG buildings.': {
    hi: 'केंद्रीय कॉरिडोर के साथ कमरे। पारंपरिक पीजी इमारतों के लिए आदर्श।',
    mr: 'मध्यवर्ती कॉरिडॉरसह खोल्या. पारंपरिक पीजी इमारतींसाठी आदर्श.',
  },
  'Separate apartments with multiple rooms. Suitable for apartment-style properties.': {
    hi: 'कई कमरों वाले अलग अपार्टमेंट। अपार्टमेंट-स्टाइल प्रॉपर्टी के लिए उपयुक्त।',
    mr: 'अनेक खोल्या असलेली स्वतंत्र अपार्टमेंट. अपार्टमेंट-स्टाइल प्रॉपर्टीसाठी योग्य.',
  },
  'Units with shared or private rooms': {
    hi: 'साझा या निजी कमरों वाली यूनिट',
    mr: 'सामायिक किंवा खाजगी खोल्या असलेली युनिट',
  },
  'Rentable units without room subdivisions': {
    hi: 'बिना कमरे विभाजन के किराए की यूनिट',
    mr: 'खोली उपविभाग नसलेली भाड्याची युनिट',
  },
  'Quick Setup': { hi: 'त्वरित सेटअप', mr: 'जलद सेटअप' },
  'Quick setup': { hi: 'त्वरित सेटअप', mr: 'जलद सेटअप' },
  'Build your property': { hi: 'अपनी प्रॉपर्टी बनाएँ', mr: 'तुमची प्रॉपर्टी तयार करा' },
  'Answer a few steps to generate floors, rooms, and beds.': {
    hi: 'मंजिलें, कमरे और बिस्तर बनाने के लिए कुछ चरण पूरे करें।',
    mr: 'मजले, खोल्या आणि बेड तयार करण्यासाठी काही टप्पे पूर्ण करा.',
  },
  Building: { hi: 'इमारत', mr: 'इमारत' },
  Floor: { hi: 'मंजिल', mr: 'मजला' },
  Room: { hi: 'कमरा', mr: 'खोली' },
  Bed: { hi: 'बिस्तर', mr: 'बेड' },
  Unit: { hi: 'यूनिट', mr: 'युनिट' },
  Capacity: { hi: 'क्षमता', mr: 'क्षमता' },
  Inactive: { hi: 'निष्क्रिय', mr: 'निष्क्रिय' },
  'Nearly Full': { hi: 'लगभग भरा', mr: 'जवळजवळ पूर्ण' },
  Full: { hi: 'भरा', mr: 'पूर्ण' },
  Blocked: { hi: 'ब्लॉक', mr: 'ब्लॉक' },
  Dormitory: { hi: 'डॉर्मिटरी', mr: 'डॉर्मिटरी' },
  CORRIDOR: { hi: 'कॉरिडोर', mr: 'कॉरिडॉर' },
  STAIR: { hi: 'सीढ़ी', mr: 'जिना' },
  LIFT: { hi: 'लिफ्ट', mr: 'लिफ्ट' },
  HALL: { hi: 'हॉल', mr: 'हॉल' },
  GROUND: { hi: 'भूतल', mr: 'तळमजला' },
  'Door →': { hi: 'दरवाज़ा →', mr: 'दरवाजा →' },
  Hostel: { hi: 'हॉस्टल', mr: 'हॉस्टेल' },
  Edit: { hi: 'संपादित करें', mr: 'संपादित करा' },
  Save: { hi: 'सेव करें', mr: 'सेव्ह करा' },
  Cancel: { hi: 'रद्द करें', mr: 'रद्द करा' },
  Delete: { hi: 'हटाएँ', mr: 'हटवा' },
  Add: { hi: 'जोड़ें', mr: 'जोडा' },
  Remove: { hi: 'हटाएँ', mr: 'काढा' },
  Confirm: { hi: 'पुष्टि करें', mr: 'पुष्टी करा' },
  Submit: { hi: 'जमा करें', mr: 'सबमिट करा' },
  Search: { hi: 'खोजें', mr: 'शोधा' },
  Filter: { hi: 'फ़िल्टर', mr: 'फिल्टर' },
  All: { hi: 'सभी', mr: 'सर्व' },
  None: { hi: 'कोई नहीं', mr: 'काहीही नाही' },
  Yes: { hi: 'हाँ', mr: 'होय' },
  No: { hi: 'नहीं', mr: 'नाही' },
  Loading: { hi: 'लोड हो रहा है', mr: 'लोड होत आहे' },
  Error: { hi: 'त्रुटि', mr: 'त्रुटी' },
  Success: { hi: 'सफल', mr: 'यशस्वी' },
  Warning: { hi: 'चेतावनी', mr: 'इशारा' },
  Info: { hi: 'जानकारी', mr: 'माहिती' },
  Optional: { hi: 'वैकल्पिक', mr: 'पर्यायी' },
  Required: { hi: 'आवश्यक', mr: 'आवश्यक' },
  Details: { hi: 'विवरण', mr: 'तपशील' },
  Summary: { hi: 'सारांश', mr: 'सारांश' },
  Overview: { hi: 'अवलोकन', mr: 'आढावा' },
  Actions: { hi: 'क्रियाएँ', mr: 'क्रिया' },
  Settings: { hi: 'सेटिंग्स', mr: 'सेटिंग्ज' },
  Members: { hi: 'सदस्य', mr: 'सदस्य' },
  Payments: { hi: 'भुगतान', mr: 'पेमेंट्स' },
  Complaints: { hi: 'शिकायतें', mr: 'तक्रारी' },
  Inventory: { hi: 'इन्वेंटरी', mr: 'इन्व्हेंटरी' },
  Notifications: { hi: 'सूचनाएँ', mr: 'सूचना' },
  Meals: { hi: 'भोजन', mr: 'जेवणे' },
  Breakfast: { hi: 'नाश्ता', mr: 'नाश्ता' },
  Lunch: { hi: 'दोपहर का खाना', mr: 'दुपारचे जेवण' },
  Dinner: { hi: 'रात का खाना', mr: 'रात्रीचे जेवण' },
  Today: { hi: 'आज', mr: 'आज' },
  Yesterday: { hi: 'कल', mr: 'काल' },
  Tomorrow: { hi: 'कल', mr: 'उद्या' },
  Pending: { hi: 'लंबित', mr: 'प्रलंबित' },
  Paid: { hi: 'भुगतान हुआ', mr: 'भरले' },
  Rejected: { hi: 'अस्वीकृत', mr: 'नाकारले' },
  Active: { hi: 'सक्रिय', mr: 'सक्रिय' },
  Inactive: { hi: 'निष्क्रिय', mr: 'निष्क्रिय' },
  Draft: { hi: 'ड्राफ्ट', mr: 'मसुदा' },
  Published: { hi: 'प्रकाशित', mr: 'प्रकाशित' },
  Closed: { hi: 'बंद', mr: 'बंद' },
  Open: { hi: 'खुला', mr: 'उघडे' },
  Empty: { hi: 'खाली', mr: 'रिकामे' },
  Shared: { hi: 'शेयर', mr: 'शेअर' },
  'Not shared': { hi: 'शेयर नहीं', mr: 'शेअर नाही' },
  Owner: { hi: 'मालिक', mr: 'मालक' },
  Manager: { hi: 'मैनेजर', mr: 'मॅनेजर' },
  Tenant: { hi: 'किरायेदार', mr: 'भाडेकरू' },
  Customer: { hi: 'ग्राहक', mr: 'ग्राहक' },
  Resident: { hi: 'निवासी', mr: 'रहिवासी' },
  Allocate: { hi: 'आवंटित करें', mr: 'वाटप करा' },
  Reserve: { hi: 'आरक्षित करें', mr: 'राखीव ठेवा' },
  Transfer: { hi: 'ट्रांसफर', mr: 'ट्रान्सफर' },
  Vacate: { hi: 'खाली करें', mr: 'रिकामे करा' },
  'Move in': { hi: 'मूव-इन', mr: 'मूव्ह-इन' },
  'Move In': { hi: 'मूव-इन', mr: 'मूव्ह-इन' },
  'Plan menu': { hi: 'मेनू प्लान करें', mr: 'मेनू प्लान करा' },
  'Share menu': { hi: 'मेनू शेयर करें', mr: 'मेनू शेअर करा' },
  'View responses': { hi: 'जवाब देखें', mr: 'प्रतिसाद पहा' },
  'View payments': { hi: 'भुगतान देखें', mr: 'पेमेंट्स पहा' },
  'Load more': { hi: 'और लोड करें', mr: 'आणखी लोड करा' },
  'Try again': { hi: 'फिर से कोशिश करें', mr: 'पुन्हा प्रयत्न करा' },
  'Something went wrong. Please try again.': {
    hi: 'कुछ गलत हुआ। कृपया फिर से कोशिश करें।',
    mr: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
  },
  'No results found': { hi: 'कोई परिणाम नहीं मिला', mr: 'कोणतेही निकाल सापडले नाहीत' },
  'No data': { hi: 'कोई डेटा नहीं', mr: 'डेटा नाही' },
  'Coming soon': { hi: 'जल्द आ रहा है', mr: 'लवकरच येत आहे' },
};

/** Word-level replacements applied left-to-right for medium strings (preserve {{tokens}}) */
const WORD_HI = [
  [/Move-ins this month/gi, 'इस महीने आए नए सदस्य'],
  [/Occupied beds/gi, 'भरे हुए बिस्तर'],
  [/Vacant beds/gi, 'खाली बिस्तर'],
  [/Property operations/gi, 'प्रॉपर्टी परिचालन'],
  [/Meal operations/gi, 'भोजन परिचालन'],
  [/Payment Summary/gi, 'भुगतान सारांश'],
  [/Space Health/gi, 'स्पेस स्वास्थ्य'],
  [/Good morning/gi, 'सुप्रभात'],
  [/Good afternoon/gi, 'नमस्कार'],
  [/Good evening/gi, 'शुभ संध्या'],
  [/Under Review/gi, 'समीक्षाधीन'],
  [/This month/gi, 'इस महीने'],
  [/Quick Setup/gi, 'त्वरित सेटअप'],
  [/Quick setup/gi, 'त्वरित सेटअप'],
  [/Quick actions/gi, 'त्वरित क्रिया'],
  [/Start Setup/gi, 'सेटअप शुरू करें'],
  [/Add Building Manually/gi, 'इमारत मैन्युअली जोड़ें'],
  [/Personal information/gi, 'व्यक्तिगत जानकारी'],
  [/Edit profile/gi, 'प्रोफ़ाइल संपादित करें'],
  [/Delete account/gi, 'खाता हटाएँ'],
  [/Privacy Policy/gi, 'गोपनीयता नीति'],
  [/App version/gi, 'ऐप संस्करण'],
  [/Profile completion/gi, 'प्रोफ़ाइल पूर्णता'],
  [/Mobile number/gi, 'मोबाइल नंबर'],
  [/Full name/gi, 'पूरा नाम'],
  [/Date of birth/gi, 'जन्म तिथि'],
  [/Permanent address/gi, 'स्थायी पता'],
  [/Profile status/gi, 'प्रोफ़ाइल स्थिति'],
  [/Change mobile number/gi, 'मोबाइल नंबर बदलें'],
  [/Switch space/gi, 'स्पेस बदलें'],
  [/Ground Floor/gi, 'भूतल'],
  [/Floor /gi, 'मंजिल '],
  [/buildings?/gi, 'इमारतें'],
  [/Buildings/g, 'इमारतें'],
  [/floors?/gi, 'मंजिलें'],
  [/Floors/g, 'मंजिलें'],
  [/rooms?/gi, 'कमरे'],
  [/Rooms/g, 'कमरे'],
  [/beds?/gi, 'बिस्तर'],
  [/Beds/g, 'बिस्तर'],
  [/units?/gi, 'यूनिट'],
  [/Units/g, 'यूनिट'],
  [/apartments?/gi, 'अपार्टमेंट'],
  [/Available/g, 'उपलब्ध'],
  [/Occupied/g, 'भरा हुआ'],
  [/Reserved/g, 'आरक्षित'],
  [/Maintenance/g, 'मेंटेनेंस'],
  [/Blocked/g, 'ब्लॉक'],
  [/Inactive/g, 'निष्क्रिय'],
  [/Pending/g, 'लंबित'],
  [/Expected/g, 'अपेक्षित'],
  [/Collected/g, 'जमा'],
  [/Capacity/g, 'क्षमता'],
  [/Status/g, 'स्थिति'],
  [/Search/g, 'खोजें'],
  [/Cancel/g, 'रद्द करें'],
  [/Continue/g, 'जारी रखें'],
  [/Confirm/g, 'पुष्टि करें'],
  [/Delete/g, 'हटाएँ'],
  [/Update/g, 'अपडेट'],
  [/Create/g, 'बनाएँ'],
  [/Remove/g, 'हटाएँ'],
  [/Add /g, 'जोड़ें '],
  [/Save /g, 'सेव '],
  [/Edit /g, 'संपादित करें '],
  [/Please /g, 'कृपया '],
  [/failed/gi, 'विफल'],
  [/success/gi, 'सफल'],
  [/required/gi, 'आवश्यक'],
  [/optional/gi, 'वैकल्पिक'],
  [/selected/gi, 'चयनित'],
  [/loading/gi, 'लोड हो रहा है'],
];

const WORD_MR = [
  [/Move-ins this month/gi, 'या महिन्यात आलेले नवीन सदस्य'],
  [/Occupied beds/gi, 'व्यापलेले बेड'],
  [/Vacant beds/gi, 'रिकामे बेड'],
  [/Property operations/gi, 'प्रॉपर्टी परिचालन'],
  [/Meal operations/gi, 'जेवण परिचालन'],
  [/Payment Summary/gi, 'पेमेंट सारांश'],
  [/Space Health/gi, 'स्पेस आरोग्य'],
  [/Good morning/gi, 'शुभ प्रभात'],
  [/Good afternoon/gi, 'नमस्कार'],
  [/Good evening/gi, 'शुभ संध्या'],
  [/Under Review/gi, 'पुनरावलोकनाधीन'],
  [/This month/gi, 'या महिन्यात'],
  [/Quick Setup/gi, 'जलद सेटअप'],
  [/Quick setup/gi, 'जलद सेटअप'],
  [/Quick actions/gi, 'जलद क्रिया'],
  [/Start Setup/gi, 'सेटअप सुरू करा'],
  [/Add Building Manually/gi, 'इमारत मॅन्युअली जोडा'],
  [/Personal information/gi, 'वैयक्तिक माहिती'],
  [/Edit profile/gi, 'प्रोफाइल संपादित करा'],
  [/Delete account/gi, 'खाते हटवा'],
  [/Privacy Policy/gi, 'गोपनीयता धोरण'],
  [/App version/gi, 'अॅप आवृत्ती'],
  [/Profile completion/gi, 'प्रोफाइल पूर्णता'],
  [/Mobile number/gi, 'मोबाइल नंबर'],
  [/Full name/gi, 'पूर्ण नाव'],
  [/Date of birth/gi, 'जन्मतारीख'],
  [/Permanent address/gi, 'कायमचा पत्ता'],
  [/Profile status/gi, 'प्रोफाइल स्थिती'],
  [/Change mobile number/gi, 'मोबाइल नंबर बदला'],
  [/Switch space/gi, 'स्पेस बदला'],
  [/Ground Floor/gi, 'तळमजला'],
  [/Floor /gi, 'मजला '],
  [/buildings?/gi, 'इमारती'],
  [/Buildings/g, 'इमारती'],
  [/floors?/gi, 'मजले'],
  [/Floors/g, 'मजले'],
  [/rooms?/gi, 'खोल्या'],
  [/Rooms/g, 'खोल्या'],
  [/beds?/gi, 'बेड'],
  [/Beds/g, 'बेड'],
  [/units?/gi, 'युनिट'],
  [/Units/g, 'युनिट'],
  [/apartments?/gi, 'अपार्टमेंट'],
  [/Available/g, 'उपलब्ध'],
  [/Occupied/g, 'व्यापलेले'],
  [/Reserved/g, 'राखीव'],
  [/Maintenance/g, 'देखभाल'],
  [/Blocked/g, 'ब्लॉक'],
  [/Inactive/g, 'निष्क्रिय'],
  [/Pending/g, 'प्रलंबित'],
  [/Expected/g, 'अपेक्षित'],
  [/Collected/g, 'गोळा'],
  [/Capacity/g, 'क्षमता'],
  [/Status/g, 'स्थिती'],
  [/Search/g, 'शोधा'],
  [/Cancel/g, 'रद्द करा'],
  [/Continue/g, 'सुरू ठेवा'],
  [/Confirm/g, 'पुष्टी करा'],
  [/Delete/g, 'हटवा'],
  [/Update/g, 'अपडेट'],
  [/Create/g, 'तयार करा'],
  [/Remove/g, 'काढा'],
  [/Add /g, 'जोडा '],
  [/Save /g, 'सेव्ह '],
  [/Edit /g, 'संपादित करा '],
  [/Please /g, 'कृपया '],
  [/failed/gi, 'अयशस्वी'],
  [/success/gi, 'यशस्वी'],
  [/required/gi, 'आवश्यक'],
  [/optional/gi, 'पर्यायी'],
  [/selected/gi, 'निवडलेले'],
  [/loading/gi, 'लोड होत आहे'],
];

function protectTokens(str) {
  const tokens = [];
  const protectedStr = str.replace(/\{\{[^}]+\}\}/g, m => {
    tokens.push(m);
    return `__T${tokens.length - 1}__`;
  });
  return { protectedStr, tokens };
}

function restoreTokens(str, tokens) {
  return str.replace(/__T(\d+)__/g, (_, i) => tokens[Number(i)] ?? '');
}

function translatePhrase(enVal, lang) {
  if (EXACT[enVal]) return EXACT[enVal][lang];
  // Try without ellipsis variants
  const alt = enVal.replace(/…/g, '...').replace(/\u2026/g, '...');
  if (EXACT[alt]) return EXACT[alt][lang];

  const { protectedStr, tokens } = protectTokens(enVal);
  const rules = lang === 'hi' ? WORD_HI : WORD_MR;
  let out = protectedStr;
  for (const [re, rep] of rules) {
    out = out.replace(re, rep);
  }
  out = restoreTokens(out, tokens);
  // Only accept if something changed and result contains Devanagari or known replacements
  if (out === enVal) return null;
  if (!/[\u0900-\u097F]/.test(out) && out === enVal) return null;
  // Reject if still mostly English letters with no Devanagari (word rules may have failed)
  if (!/[\u0900-\u097F]/.test(out)) return null;
  return out;
}

const PRIORITY_PREFIXES = [
  'accommodation.',
  'membership.',
  'members.',
  'occupancy.',
  'occupancyWizard.',
  'paymentCollection.',
  'payments.',
  'complaints.',
  'inventory.',
  'notifications.',
  'onboarding.',
  'auth.',
  'meals.',
  'home.',
  'profileCompletion.',
  'list.',
  'progressiveWorkflow.',
  'coachmarks.',
  'spaceLifecycle.',
  'permissions.',
  'spaces.',
  'dashboard.',
  'settings.',
];

let added = 0;
let skipped = 0;
for (const [key, value] of leaves(en)) {
  if (!PRIORITY_PREFIXES.some(p => key.startsWith(p))) {
    skipped++;
    continue;
  }
  if (overlay.byKey[key]) continue; // already have curated translation

  const hi = translatePhrase(value, 'hi');
  const mr = translatePhrase(value, 'mr');
  if (!hi && !mr) continue;

  // Prefer existing exact if only one lang
  overlay.byKey[key] = {
    hi: hi || value,
    mr: mr || value,
  };
  added++;
}

// Merge EXACT into byExactEnglish
for (const [enPhrase, tr] of Object.entries(EXACT)) {
  if (!overlay.byExactEnglish[enPhrase]) {
    overlay.byExactEnglish[enPhrase] = tr;
  }
}

fs.writeFileSync(overlayPath, JSON.stringify(overlay, null, 2) + '\n');
console.log(JSON.stringify({ addedByKey: added, skippedOutsidePriority: skipped, byKeyTotal: Object.keys(overlay.byKey).length, byExactTotal: Object.keys(overlay.byExactEnglish).length }, null, 2));
