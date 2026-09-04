/**
 * Reset Hinglish (mixed Devanagari + English grammar) leaves back to English,
 * then apply a curated full-sentence overlay for high-visibility screens.
 *
 * Usage: node scripts/repair-hinglish-locales.cjs
 *        node scripts/repair-hinglish-locales.cjs --web
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const includeWeb = process.argv.includes('--web');

const ALLOW_LATIN = new Set([
  'ACOMI',
  'OTP',
  'PG',
  'UPI',
  'UTR',
  'CCTV',
  'OK',
  'AM',
  'PM',
  'ID',
  'KYC',
  'FAB',
  'QR',
  'SMS',
  'PDF',
  'URL',
  'API',
  'WIFI',
  'WiFi',
  'Mess',
  'Hostel',
  'Rental',
]);

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function hasDevanagari(s) {
  return /[\u0900-\u097F]/.test(s);
}

function latinTokens(s) {
  return s.match(/[A-Za-z]{2,}/g) || [];
}

/** True when string mixes Devanagari with residual English words (broken MT). */
function isHinglish(value) {
  if (typeof value !== 'string') return false;
  if (!hasDevanagari(value)) return false;
  const tokens = latinTokens(value);
  if (tokens.length === 0) return false;
  const residual = tokens.filter(t => !ALLOW_LATIN.has(t) && !ALLOW_LATIN.has(t.toUpperCase()));
  return residual.length > 0;
}

function isHinglishTranslation(hi, en) {
  if (typeof hi !== 'string' || typeof en !== 'string') return false;
  if (hi === en) return false;
  return isHinglish(hi);
}

const TARGETS = [
  { label: 'Mobile', dir: path.join(ROOT, 'src', 'i18n', 'locales') },
];
if (includeWeb) {
  const webDir = path.join(ROOT, '..', 'AcomiWeb', 'src', 'i18n', 'locales');
  if (fs.existsSync(webDir)) TARGETS.push({ label: 'Web', dir: webDir });
}

/** Full-sentence HI/MR for Members / Meals / Payments (and shared list/search). */
const OVERLAY = {
  'list.search.members': {
    hi: 'नाम या मोबाइल से खोजें',
    mr: 'नाव किंवा मोबाइलने शोधा',
  },
  'list.search.pendingInvitations': {
    hi: 'मोबाइल या आमंत्रक से खोजें',
    mr: 'मोबाइल किंवा आमंत्रकाने शोधा',
  },
  'membership.tabs.pending': {
    hi: 'लंबित आमंत्रण',
    mr: 'प्रलंबित आमंत्रणे',
  },
  'membership.invitations.pendingTitle': {
    hi: 'लंबित आमंत्रण',
    mr: 'प्रलंबित आमंत्रणे',
  },
  'membership.searchPlaceholder': {
    hi: 'नाम या मोबाइल से खोजें',
    mr: 'नाव किंवा मोबाइलने शोधा',
  },
  'occupancyWizard.searchMemberPlaceholder': {
    hi: 'नाम या मोबाइल से खोजें',
    mr: 'नाव किंवा मोबाइलने शोधा',
  },
  'occupancy.searchPlaceholder': {
    hi: 'नाम या मोबाइल से खोजें',
    mr: 'नाव किंवा मोबाइलने शोधा',
  },
  'meals.planning.noEligibleMembersHint': {
    hi: 'अभी कोई सक्रिय भोजन सदस्य नहीं है। मेस ग्राहकों के लिए भोजन एक्सेस चालू करें। पीजी किरायेदारों के लिए भोजन सहित मूव-इन पूरा करें।',
    mr: 'सध्या कोणताही सक्रिय जेवण सदस्य नाही. मेस ग्राहकांसाठी जेवण ऍक्सेस सुरू करा. पीजी भाडेकरूंसाठी जेवणासह मूव्ह-इन पूर्ण करा.',
  },
  'meals.planning.enrollParticipantsHint': {
    hi: 'अभी कोई सक्रिय भोजन सदस्य नहीं है। ग्राहकों के लिए भोजन एक्सेस चालू करें या किरायेदारों को भोजन सहित मूव-इन करें।',
    mr: 'सध्या कोणताही सक्रिय जेवण सदस्य नाही. ग्राहकांसाठी जेवण ऍक्सेस सुरू करा किंवा भाडेकरूंना जेवणासह मूव्ह-इन करा.',
  },
  'meals.menu.emptyTitle': {
    hi: '{{meal}} के लिए कोई मेनू प्लान नहीं किया गया।',
    mr: '{{meal}} साठी कोणताही मेनू प्लान केला नाही.',
  },
  'meals.menu.emptyHint': {
    hi: 'आज का मेनू तैयार करने के लिए अपनी मेनू लाइब्रेरी से आइटम चुनें।',
    mr: 'आजचा मेनू तयार करण्यासाठी तुमच्या मेनू लायब्ररीतून आयटम निवडा.',
  },
  'meals.menu.nothingToday': {
    hi: 'आज के लिए कोई मेनू प्लान नहीं किया गया।',
    mr: 'आजसाठी कोणताही मेनू प्लान केला नाही.',
  },
  'meals.menu.nothingForDate': {
    hi: 'इस तारीख के लिए कोई मेनू प्लान नहीं किया गया।',
    mr: 'या तारखेसाठी कोणताही मेनू प्लान केला नाही.',
  },
  'meals.planning.shareEmpty': {
    hi: 'इस तारीख के लिए अभी कोई मेनू प्लान नहीं किया गया।',
    mr: 'या तारखेसाठी अजून कोणताही मेनू प्लान केला नाही.',
  },
  'payments.subtitle': {
    hi: 'इस महीने की अपेक्षित राशि, वसूली और बकाया।',
    mr: 'या महिन्यातील अपेक्षित रक्कम, वसुली आणि थकबाकी.',
  },
  'paymentCollection.tabs.needsUpdate': {
    hi: 'अपडेट चाहिए ({{count}})',
    mr: 'अपडेट आवश्यक ({{count}})',
  },
  'paymentCollection.filters.needsUpdate': {
    hi: 'अपडेट चाहिए ({{count}})',
    mr: 'अपडेट आवश्यक ({{count}})',
  },
  'paymentCollection.filters.needsUpdateLabel': {
    hi: 'अपडेट चाहिए',
    mr: 'अपडेट आवश्यक',
  },
  'paymentCollection.needsUpdateAction': {
    hi: 'अपडेट चाहिए',
    mr: 'अपडेट आवश्यक',
  },
  'paymentCollection.empty.owner.SUBMITTED': {
    hi: 'समीक्षा के लिए कोई जमा भुगतान नहीं है।',
    mr: 'पुनरावलोकनासाठी कोणतेही सबमिट केलेले पेमेंट नाही.',
  },
  'paymentCollection.empty.tenant.SUBMITTED': {
    hi: 'समीक्षा के लिए कोई भुगतान नहीं है।',
    mr: 'पुनरावलोकनासाठी कोणतेही पेमेंट नाही.',
  },
  'dashboard.pendingActions.types.PAYMENT_NEEDS_UPDATE': {
    hi: 'अपडेट चाहिए',
    mr: 'अपडेट आवश्यक',
  },
  'dashboard.pendingActions.types.PENDING_INVITATION': {
    hi: 'लंबित आमंत्रण',
    mr: 'प्रलंबित आमंत्रणे',
  },
  'spaces.globalDashboard.pendingActionsShort_one': {
    hi: 'लंबित कार्रवाई',
    mr: 'प्रलंबित कारवाई',
  },
  'spaces.globalDashboard.pendingActionsShort_other': {
    hi: 'लंबित कार्रवाइयाँ',
    mr: 'प्रलंबित कारवाया',
  },
  'spaces.globalDashboard.pendingActions_one': {
    hi: '{{count}} लंबित कार्रवाई',
    mr: '{{count}} प्रलंबित कारवाई',
  },
  'spaces.globalDashboard.pendingActions_other': {
    hi: '{{count}} लंबित कार्रवाइयाँ',
    mr: '{{count}} प्रलंबित कारवाया',
  },
};

// Discover actual key paths for membership pending tab / payments review tab
function discoverAndPatchOverlay(enFlat) {
  const extras = {};
  for (const [k, v] of Object.entries(enFlat)) {
    if (typeof v !== 'string') continue;
    if (v === 'Pending Invitations' || v === 'Pending invitations') {
      extras[k] = { hi: 'लंबित आमंत्रण', mr: 'प्रलंबित आमंत्रणे' };
    }
    if (v === 'Search by name or mobile' || v === 'Search by name or mobile…') {
      extras[k] = { hi: 'नाम या मोबाइल से खोजें', mr: 'नाव किंवा मोबाइलने शोधा' };
    }
    if (v === 'Pending Review' || v === 'Pending review') {
      extras[k] = { hi: 'लंबित समीक्षा', mr: 'प्रलंबित पुनरावलोकन' };
    }
    if (v === 'Needs update' || v === 'Needs Update') {
      extras[k] = { hi: 'अपडेट चाहिए', mr: 'अपडेट आवश्यक' };
    }
    if (/^Needs update \(\{\{count\}\}\)$/i.test(v)) {
      extras[k] = { hi: 'अपडेट चाहिए ({{count}})', mr: 'अपडेट आवश्यक ({{count}})' };
    }
    if (v.includes('Expected charges, collections')) {
      extras[k] = {
        hi: 'इस महीने की अपेक्षित राशि, वसूली और बकाया।',
        mr: 'या महिन्यातील अपेक्षित रक्कम, वसुली आणि थकबाकी.',
      };
    }
    if (v.includes('No submitted') && v.includes('awaiting review')) {
      extras[k] = {
        hi: 'समीक्षा के लिए कोई जमा भुगतान नहीं है।',
        mr: 'पुनरावलोकनासाठी कोणतेही सबमिट केलेले पेमेंट नाही.',
      };
    }
    if (v.includes('No active meal members')) {
      extras[k] = OVERLAY['meals.planning.noEligibleMembersHint'];
    }
    if (v.includes('Choose items from your menu library')) {
      extras[k] = OVERLAY['meals.menu.emptyHint'];
    }
    if (/^No menu planned for \{\{meal\}\}/i.test(v) || v.includes('No menu planned for {{meal}}')) {
      extras[k] = OVERLAY['meals.menu.emptyTitle'];
    }
  }
  return extras;
}

for (const target of TARGETS) {
  const en = JSON.parse(fs.readFileSync(path.join(target.dir, 'en.json'), 'utf8'));
  const enFlat = flatten(en);
  const discovered = discoverAndPatchOverlay(enFlat);
  const overlay = { ...OVERLAY, ...discovered };

  for (const locale of ['hi', 'mr']) {
    const file = path.join(target.dir, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const flat = flatten(data);
    let reset = 0;
    let applied = 0;

    for (const [key, value] of Object.entries(flat)) {
      const enValue = enFlat[key];
      if (typeof enValue !== 'string') continue;
      if (isHinglishTranslation(value, enValue)) {
        setByPath(data, key, enValue);
        reset++;
      }
    }

    for (const [key, tr] of Object.entries(overlay)) {
      if (!tr[locale] || enFlat[key] === undefined) continue;
      setByPath(data, key, tr[locale]);
      applied++;
    }

    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`[${target.label}/${locale}] resetHinglish=${reset} overlayApplied=${applied}`);
  }
}

// Scrub corrupted entries from natural-ui-translations.json so future applies don't re-break.
const overlayPath = path.join(__dirname, 'natural-ui-translations.json');
if (fs.existsSync(overlayPath)) {
  const pack = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
  let removed = 0;
  for (const [key, tr] of Object.entries(pack.byKey || {})) {
    if ((tr.hi && isHinglish(tr.hi)) || (tr.mr && isHinglish(tr.mr))) {
      delete pack.byKey[key];
      removed++;
    }
  }
  // Drop byExactEnglish short words that caused partial feel when used as full-leaf replacements of short labels — keep only phrases without mixing risk; leave file but clear ultra-short ones that are single words already in byKey
  fs.writeFileSync(overlayPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  console.log(`scrubbed ${removed} hinglish byKey entries from natural-ui-translations.json`);
}

console.log('Done.');
