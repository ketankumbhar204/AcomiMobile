/**
 * add-bulk-translations.cjs
 * Adds curated Hindi + Marathi translations for all remaining English keys.
 * Merges into scripts/natural-ui-translations.json (byKey section).
 * Run: node scripts/add-bulk-translations.cjs
 */

'use strict';
const fs = require('fs');
const path = require('path');

const overlayPath = path.join(__dirname, 'natural-ui-translations.json');
const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
if (!overlay.byKey) overlay.byKey = {};

// ---------------------------------------------------------------------------
// All curated translations
// Format: key → { hi, mr }
// ---------------------------------------------------------------------------
const TRANSLATIONS = {

  // ── ACCOMMODATION ────────────────────────────────────────────────────────
  'accommodation.setup.structure.bullet': {
    hi: '• {{label}}',
    mr: '• {{label}}',
  },
  'accommodation.bulk.beds.labelStyle_ALPHA': {
    hi: 'अ, ब, क…',
    mr: 'अ, ब, क…',
  },

  // ── MEMBERSHIP ───────────────────────────────────────────────────────────
  'membership.add.createNewHint': {
    hi: 'इस मेस के लिए नाम और मोबाइल नंबर दर्ज करें।',
    mr: 'या मेससाठी नाव आणि मोबाइल नंबर प्रविष्ट करा।',
  },
  'membership.roles.tenant.description': {
    hi: 'PG / हॉस्टल में रहते हैं',
    mr: 'PG / हॉस्टेलमध्ये राहतात',
  },
  'membership.roles.customer.description': {
    hi: 'मेस / को-लिविंग का उपयोग करते हैं',
    mr: 'मेस / को-लिव्हिंगचा वापर करतात',
  },
  'membership.roles.customer.descriptionMess': {
    hi: 'इस मेस में भोजन सदस्य',
    mr: 'या मेसमधील जेवण सदस्य',
  },
  'membership.roles.staff.description': {
    hi: 'इस स्पेस में काम करते हैं',
    mr: 'या स्पेसमध्ये काम करतात',
  },
  'membership.roles.manager.description': {
    hi: 'स्पेस प्रबंधन में सहायता करते हैं',
    mr: 'स्पेस व्यवस्थापनात मदत करतात',
  },
  'membership.invite.roleNotAllowed': {
    hi: 'यह भूमिका इस स्पेस प्रकार के लिए उपलब्ध नहीं है।',
    mr: 'ही भूमिका या स्पेस प्रकारासाठी उपलब्ध नाही।',
  },
  'membership.meals.emptyTitle': {
    hi: 'कोई भोजन सदस्यता नहीं मिली',
    mr: 'जेवण सदस्यत्व आढळले नाही',
  },
  'membership.meals.summaryTitle': {
    hi: 'भोजन योजना',
    mr: 'जेवण योजना',
  },
  'membership.deposit.paid': {
    hi: 'भुगतान की गई राशि',
    mr: 'भरलेली रक्कम',
  },
  'membership.deposit.refunded': {
    hi: 'वापस की गई राशि',
    mr: 'परत केलेली रक्कम',
  },
  'membership.deposit.balance': {
    hi: 'शेष राशि',
    mr: 'शिल्लक रक्कम',
  },
  'membership.deposit.errors.negative': {
    hi: 'राशि नकारात्मक नहीं हो सकती।',
    mr: 'रक्कम ऋण असू शकत नाही।',
  },
  'membership.deposit.errors.refundedExceedsPaid': {
    hi: 'वापसी राशि भुगतान राशि से अधिक नहीं हो सकती।',
    mr: 'परत केलेली रक्कम भरलेल्या रकमेपेक्षा जास्त असू शकत नाही।',
  },
  'membership.documents.typeLabel': {
    hi: 'दस्तावेज़ प्रकार',
    mr: 'दस्तऐवज प्रकार',
  },
  'membership.documents.numberLabel': {
    hi: 'दस्तावेज़ संख्या',
    mr: 'दस्तऐवज क्रमांक',
  },
  'membership.documents.numberPlaceholder': {
    hi: 'जैसे XXXX-XXXX-1234',
    mr: 'उदा. XXXX-XXXX-1234',
  },
  'membership.documents.number': {
    hi: 'क्रमांक: {{value}}',
    mr: 'क्रमांक: {{value}}',
  },
  'membership.documents.fileUrl': {
    hi: 'फ़ाइल: {{value}}',
    mr: 'फाइल: {{value}}',
  },
  'membership.documents.uploadedAt': {
    hi: 'अपलोड किया: {{date}}',
    mr: 'अपलोड केले: {{date}}',
  },
  'membership.documents.fileLabel': {
    hi: 'फ़ाइल',
    mr: 'फाइल',
  },
  'membership.documents.emptyTitle': {
    hi: 'कोई दस्तावेज़ नहीं',
    mr: 'दस्तऐवज नाही',
  },
  'membership.documents.successToast': {
    hi: 'दस्तावेज़ जोड़ा गया।',
    mr: 'दस्तऐवज जोडला गेला।',
  },
  'membership.documents.types.AADHAAR': {
    hi: 'आधार',
    mr: 'आधार',
  },
  'membership.documents.types.PAN': {
    hi: 'पैन',
    mr: 'पॅन',
  },
  'membership.documents.types.PASSPORT': {
    hi: 'पासपोर्ट',
    mr: 'पासपोर्ट',
  },
  'membership.documents.types.DRIVING_LICENSE': {
    hi: 'ड्राइविंग लाइसेंस',
    mr: 'ड्रायव्हिंग लायसन्स',
  },
  'membership.documents.types.STUDENT_ID': {
    hi: 'छात्र पहचान पत्र',
    mr: 'विद्यार्थी ओळखपत्र',
  },
  'membership.notes.addLabel': {
    hi: 'नोट',
    mr: 'नोट',
  },
  'membership.notes.emptyTitle': {
    hi: 'कोई नोट नहीं',
    mr: 'नोट नाही',
  },
  'membership.notes.successToast': {
    hi: 'नोट जोड़ा गया।',
    mr: 'नोट जोडला गेला।',
  },
  'membership.notes.authorLabel': {
    hi: 'द्वारा जोड़ा गया',
    mr: 'याने जोडले',
  },
  'membership.notes.dateLabel': {
    hi: 'तारीख',
    mr: 'तारीख',
  },
  'membership.profileCorrection.messageLabel': {
    hi: 'संदेश',
    mr: 'संदेश',
  },
  'membership.history.changeLabel': {
    hi: 'बदलाव',
    mr: 'बदल',
  },
  'membership.errors.forbidden': {
    hi: 'आपको यह कार्य करने की अनुमति नहीं है।',
    mr: 'तुम्हाला हे काम करण्याची परवानगी नाही।',
  },
  'membership.errors.notFound': {
    hi: 'अनुरोधित आइटम नहीं मिला। रीफ्रेश करने का प्रयास करें।',
    mr: 'विनंती केलेली माहिती सापडली नाही. रिफ्रेश करून पाहा.',
  },

  // ── OCCUPANCY ────────────────────────────────────────────────────────────
  'occupancy.section.space': {
    hi: 'कमरा',
    mr: 'खोली',
  },
  'occupancy.section.type': {
    hi: 'प्रकार',
    mr: 'प्रकार',
  },
  'occupancy.section.moveInDate': {
    hi: 'चेक-इन तारीख',
    mr: 'चेक-इन तारीख',
  },
  'occupancy.section.movedIn': {
    hi: 'चेक-इन हो गया',
    mr: 'चेक-इन झाले',
  },
  'occupancy.section.occupiedDays_one': {
    hi: '{{count}} दिन',
    mr: '{{count}} दिवस',
  },
  'occupancy.section.occupiedDays_other': {
    hi: '{{count}} दिन',
    mr: '{{count}} दिवस',
  },
  'occupancy.memberStatus.ALLOCATED': {
    hi: 'चेक-इन हो गया',
    mr: 'चेक-इन झाले',
  },
  'occupancy.memberCategory.STUDENT': {
    hi: 'छात्र',
    mr: 'विद्यार्थी',
  },
  'occupancy.memberCategory.WORKING_PROFESSIONAL': {
    hi: 'कामकाजी पेशेवर',
    mr: 'नोकरदार व्यावसायिक',
  },
  'occupancy.memberCategory.FAMILY': {
    hi: 'परिवार',
    mr: 'कुटुंब',
  },
  'occupancy.memberCategory.GUEST': {
    hi: 'मेहमान',
    mr: 'पाहुणे',
  },
  'occupancy.memberCategory.INTERN': {
    hi: 'इंटर्न',
    mr: 'इंटर्न',
  },
  'occupancy.hierarchy.noAvailable': {
    hi: 'इस स्तर पर कोई उपलब्ध आवास नहीं।',
    mr: 'या स्तरावर उपलब्ध निवास नाही।',
  },
  'occupancy.memberPicker.subtitle': {
    hi: 'चुनें कि इस आवास में कौन रहेगा',
    mr: 'या निवासात कोण राहणार ते निवडा',
  },
  'occupancy.moveIn.allowEarly': {
    hi: 'निर्धारित तारीख से पहले चेक-इन करें',
    mr: 'नियोजित तारखेआधी चेक-इन करा',
  },
  'occupancy.amenities.title': {
    hi: 'सुविधाएं',
    mr: 'सुविधा',
  },
  'occupancy.amenities.hint': {
    hi: 'इस आवास में शामिल सुविधाएं चुनें',
    mr: 'या निवासात समाविष्ट सुविधा निवडा',
  },
  'occupancy.amenities.noneConfigured': {
    hi: 'इस स्पेस के लिए कोई सुविधा कॉन्फ़िगर नहीं की गई',
    mr: 'या स्पेससाठी कोणतीही सुविधा कॉन्फिगर केलेली नाही',
  },
  'occupancy.contract.title': {
    hi: 'अनुबंध शर्तें',
    mr: 'करार अटी',
  },
  'occupancy.contract.stepTitle': {
    hi: 'अनुबंध शर्तें',
    mr: 'करार अटी',
  },
  'occupancy.contract.snapshotTitle': {
    hi: 'अनुबंध',
    mr: 'करार',
  },
  'occupancy.contract.lockedAt': {
    hi: '{{date}} को लॉक किया',
    mr: '{{date}} रोजी लॉक केले',
  },
  'occupancy.contract.catalogRentHint': {
    hi: 'कैटलॉग डिफ़ॉल्ट: ₹{{amount}}',
    mr: 'यादी डिफॉल्ट: ₹{{amount}}',
  },
  'occupancy.contract.catalogDepositHint': {
    hi: 'कैटलॉग डिफ़ॉल्ट: ₹{{amount}}',
    mr: 'यादी डिफॉल्ट: ₹{{amount}}',
  },
  'occupancy.contract.food': {
    hi: 'खाना',
    mr: 'जेवण',
  },
  'occupancy.contract.foodIncluded': {
    hi: 'खाना शामिल',
    mr: 'जेवण समाविष्ट',
  },
  'occupancy.contract.foodEnabled': {
    hi: 'खाने के शुल्क शामिल करें',
    mr: 'जेवणाचे शुल्क समाविष्ट करा',
  },
  'occupancy.contract.foodEnabledHint': {
    hi: 'बंद करें यदि भोजन इस रहाइश में शामिल नहीं है',
    mr: 'बंद करा जर जेवण या निवासात समाविष्ट नाही',
  },
  'occupancy.contract.foodCharge': {
    hi: 'खाने का शुल्क',
    mr: 'जेवणाचे शुल्क',
  },
  'occupancy.contract.foodChargeHint': {
    hi: 'खाली छोड़ें यदि आपके स्पेस में डिफ़ॉल्ट खाने का शुल्क है',
    mr: 'रिकामे ठेवा जर तुमच्या स्पेसला डिफॉल्ट जेवण शुल्क आहे',
  },
  'occupancy.contract.foodChargeDefaultHint': {
    hi: 'स्पेस डिफ़ॉल्ट: ₹{{amount}} (खाली छोड़ने पर लागू होगा)',
    mr: 'स्पेस डिफॉल्ट: ₹{{amount}} (रिकामे ठेवल्यास लागू होईल)',
  },
  'occupancy.contract.monthlyTotal': {
    hi: 'मासिक कुल',
    mr: 'मासिक एकूण',
  },
  'occupancy.contract.foodDisabled': {
    hi: 'शामिल नहीं',
    mr: 'समाविष्ट नाही',
  },
  'occupancy.contract.foodIncludedNoAmount': {
    hi: 'शामिल (राशि दर्ज नहीं)',
    mr: 'समाविष्ट (रक्कम नोंदवलेली नाही)',
  },
  'occupancy.contract.otherCharges': {
    hi: 'अतिरिक्त शुल्क',
    mr: 'अतिरिक्त शुल्क',
  },
  'occupancy.contract.chargeLine': {
    hi: 'शुल्क {{index}}',
    mr: 'शुल्क {{index}}',
  },
  'occupancy.contract.chargeLabel': {
    hi: 'लेबल',
    mr: 'लेबल',
  },
  'occupancy.contract.chargeLabelPlaceholder': {
    hi: 'जैसे पार्किंग',
    mr: 'उदा. पार्किंग',
  },
  'occupancy.contract.chargeAmount': {
    hi: 'राशि',
    mr: 'रक्कम',
  },
  'occupancy.contract.amountPlaceholder': {
    hi: 'राशि दर्ज करें',
    mr: 'रक्कम प्रविष्ट करा',
  },
  'occupancy.contract.notRecorded': {
    hi: 'दर्ज नहीं',
    mr: 'नोंदवलेले नाही',
  },
  'occupancy.contract.rentPolicyOption.APPLY_NEW': {
    hi: 'नए डिफ़ॉल्ट लागू करें',
    mr: 'नवे डिफॉल्ट लागू करा',
  },
  'occupancy.contract.errors.foodChargeInvalid': {
    hi: 'मान्य खाने का शुल्क दर्ज करें।',
    mr: 'वैध जेवण शुल्क प्रविष्ट करा।',
  },
  'occupancy.contract.errors.tooManyCharges': {
    hi: 'अधिकतम 10 अतिरिक्त शुल्क की अनुमति है।',
    mr: 'जास्तीत जास्त 10 अतिरिक्त शुल्क परवानगी आहे।',
  },
  'occupancy.contract.errors.chargeLabelRequired': {
    hi: 'प्रत्येक शुल्क के लिए लेबल आवश्यक है।',
    mr: 'प्रत्येक शुल्कासाठी लेबल आवश्यक आहे।',
  },
  'occupancy.contract.errors.chargeAmountInvalid': {
    hi: 'प्रत्येक शुल्क राशि 0 या अधिक होनी चाहिए।',
    mr: 'प्रत्येक शुल्क रक्कम 0 किंवा जास्त असणे आवश्यक आहे।',
  },
  'occupancy.contract.chargeCode.PARKING': {
    hi: 'पार्किंग',
    mr: 'पार्किंग',
  },
  'occupancy.contract.chargeCode.LAUNDRY': {
    hi: 'कपड़े धोना',
    mr: 'कपडे धुणे',
  },
  'occupancy.contract.chargeCode.ELECTRICITY': {
    hi: 'बिजली',
    mr: 'वीज',
  },
  'occupancy.contract.chargeCode.WIFI': {
    hi: 'वाई-फाई',
    mr: 'वाय-फाय',
  },
  'occupancy.fields.agreementSigned': {
    hi: 'समझौते पर हस्ताक्षर किए',
    mr: 'करारावर स्वाक्षरी केली',
  },
  'occupancy.fields.remarks': {
    hi: 'टिप्पणी',
    mr: 'शेरा',
  },
  'occupancy.picker.targetType': {
    hi: 'आवंटन प्रकार चुनें',
    mr: 'वाटप प्रकार निवडा',
  },
  'occupancy.picker.chooseAccommodation': {
    hi: 'आवास चुनें',
    mr: 'निवास निवडा',
  },
  'occupancy.picker.reservationDetails': {
    hi: 'बुकिंग विवरण',
    mr: 'बुकिंग तपशील',
  },
  'occupancy.picker.allocationDetails': {
    hi: 'आवंटन विवरण',
    mr: 'वाटप तपशील',
  },
  'occupancy.picker.searchEmpty': {
    hi: 'कोई मेल खाने वाला आवास नहीं मिला।',
    mr: 'जुळणारे निवास आढळले नाही।',
  },
  'occupancy.picker.orBrowse': {
    hi: 'या मैन्युअल ब्राउज़ करें',
    mr: 'किंवा मॅन्युअली शोधा',
  },
  'occupancy.picker.browseManually': {
    hi: 'कोई परिणाम नहीं — मैन्युअल ब्राउज़ करें',
    mr: 'परिणाम नाही — मॅन्युअली शोधा',
  },
  'occupancy.picker.browseAvailable': {
    hi: 'उपलब्ध ब्राउज़ करें',
    mr: 'उपलब्ध पाहा',
  },
  'occupancy.picker.noAvailable': {
    hi: 'कोई उपलब्ध लक्ष्य नहीं मिला।',
    mr: 'उपलब्ध पर्याय आढळले नाही।',
  },
  'occupancy.picker.today': {
    hi: 'आज',
    mr: 'आज',
  },
  'occupancy.picker.financialTerms': {
    hi: 'वित्तीय शर्तें',
    mr: 'आर्थिक अटी',
  },
  'occupancy.picker.foodCharges': {
    hi: 'खाने के शुल्क',
    mr: 'जेवणाचे शुल्क',
  },
  'occupancy.picker.amenities': {
    hi: 'सुविधाएं',
    mr: 'सुविधा',
  },
  'occupancy.picker.policies': {
    hi: 'नीतियां और नियम',
    mr: 'धोरणे आणि नियम',
  },
  'occupancy.picker.comingSoonHint': {
    hi: 'सुविधाएं और नीतियां भविष्य के अपडेट में उपलब्ध होंगी।',
    mr: 'सुविधा आणि धोरणे भविष्यातील अपडेटमध्ये उपलब्ध होतील।',
  },
  'occupancy.history.past': {
    hi: 'पिछले आवंटन',
    mr: 'मागील वाटप',
  },
  'occupancy.history.events': {
    hi: 'गतिविधि लॉग',
    mr: 'क्रियाकलाप नोंद',
  },
  'occupancy.history.empty': {
    hi: 'कोई पिछली रहाइश नहीं।',
    mr: 'कोणताही मागील निवास नाही।',
  },
  'occupancy.history.emptyEvents': {
    hi: 'अभी तक कोई इतिहास नहीं।',
    mr: 'अद्याप इतिहास नाही।',
  },
  'occupancy.history.MOVE_IN': {
    hi: 'चेक-इन',
    mr: 'चेक-इन',
  },
  'occupancy.history.RESERVATION_CANCELLED': {
    hi: 'बुकिंग रद्द',
    mr: 'बुकिंग रद्द',
  },
  'occupancy.errors.loadTargets': {
    hi: 'आवास विकल्प लोड नहीं हो सके। पुनः प्रयास करें।',
    mr: 'निवास पर्याय लोड होऊ शकले नाही. पुन्हा प्रयत्न करा.',
  },
  'occupancy.errors.moveInDateRequired': {
    hi: 'चेक-इन तारीख दर्ज करें।',
    mr: 'चेक-इन तारीख प्रविष्ट करा।',
  },
  'occupancy.errors.moveInDateNotReached': {
    hi: 'चेक-इन तारीख अभी नहीं आई। जारी रखने के लिए अर्ली मूव-इन सक्षम करें।',
    mr: 'चेक-इन तारीख अद्याप आलेली नाही. सुरू ठेवण्यासाठी लवकर चेक-इन सक्षम करा.',
  },
  'occupancy.errors.targetUnavailable': {
    hi: 'यह लक्ष्य उपलब्ध नहीं है।',
    mr: 'हा पर्याय उपलब्ध नाही।',
  },
  'occupancy.errors.invalidTargetType': {
    hi: 'यह आवंटन प्रकार इस स्पेस के लिए अनुमत नहीं है।',
    mr: 'हा वाटप प्रकार या स्पेससाठी परवानगी नाही।',
  },

  // ── PAYMENT COLLECTION ───────────────────────────────────────────────────
  'paymentCollection.payNow': {
    hi: 'अभी भुगतान करें',
    mr: 'आत्ता पैसे द्या',
  },
  'paymentCollection.dueDate': {
    hi: 'देय: {{date}}',
    mr: 'देय: {{date}}',
  },
  'paymentCollection.dayMeals.totalAmount': {
    hi: 'कुल राशि',
    mr: 'एकूण रक्कम',
  },
  'paymentCollection.dayMeals.batchId': {
    hi: 'बैच {{id}}',
    mr: 'बॅच {{id}}',
  },
  'paymentCollection.dayMeals.paymentReference': {
    hi: 'संदर्भ {{id}}',
    mr: 'संदर्भ {{id}}',
  },
  'paymentCollection.dayMeals.status.overdue': {
    hi: 'अतिदेय',
    mr: 'थकबाकी',
  },
  'paymentCollection.dayMeals.summary.total': {
    hi: 'कुल',
    mr: 'एकूण',
  },
  'paymentCollection.dayMeals.summary.hint': {
    hi: 'केवल सारांश — भुगतान के लिए नीचे दिन चुनें।',
    mr: 'फक्त सारांश — पैसे देण्यासाठी खाली दिवस निवडा।',
  },
  'paymentCollection.dayMeals.bulk.proofTitleSingle': {
    hi: 'भोजन — {{date}}',
    mr: 'जेवण — {{date}}',
  },
  'paymentCollection.dayMeals.bulk.proofTitleMulti': {
    hi: 'भोजन — {{count}} दिन',
    mr: 'जेवण — {{count}} दिवस',
  },
  'paymentCollection.dayMeals.bulk.eyebrow': {
    hi: 'भुगतान',
    mr: 'पैसे द्या',
  },
  'paymentCollection.dayMeals.detailEyebrow': {
    hi: 'दिन का भोजन',
    mr: 'दिवसाचे जेवण',
  },
  'paymentCollection.ownerRequest': {
    hi: 'मालिक का अनुरोध',
    mr: 'मालकाची विनंती',
  },
  'paymentCollection.needsUpdate.reason': {
    hi: 'कारण',
    mr: 'कारण',
  },
  'paymentCollection.rejectedReason': {
    hi: 'कारण: {{reason}}',
    mr: 'कारण: {{reason}}',
  },
  'paymentCollection.status.PROOF_UPLOADED': {
    hi: 'प्रमाण अपलोड किया',
    mr: 'पुरावा अपलोड केला',
  },
  'paymentCollection.status.UPDATE_REQUESTED': {
    hi: 'बदलाव अनुरोधित',
    mr: 'बदल मागितला',
  },
  'paymentCollection.type.MEAL': {
    hi: 'भोजन',
    mr: 'जेवण',
  },
  'paymentCollection.category.MONTHLY': {
    hi: 'मासिक',
    mr: 'मासिक',
  },
  'paymentCollection.category.DAILY': {
    hi: 'दैनिक',
    mr: 'दैनिक',
  },
  'paymentCollection.category.EXTRA': {
    hi: 'अतिरिक्त',
    mr: 'अतिरिक्त',
  },
  'paymentCollection.category.ADVANCE': {
    hi: 'अग्रिम',
    mr: 'आगाऊ',
  },
  'paymentCollection.category.SECURITY': {
    hi: 'सुरक्षा जमा',
    mr: 'सुरक्षा ठेव',
  },
  'paymentCollection.category.REFUND': {
    hi: 'वापसी',
    mr: 'परतावा',
  },
  'paymentCollection.category.ELECTRICITY': {
    hi: 'बिजली',
    mr: 'वीज',
  },
  'paymentCollection.category.WATER': {
    hi: 'पानी',
    mr: 'पाणी',
  },
  'paymentCollection.category.INTERNET': {
    hi: 'इंटरनेट',
    mr: 'इंटरनेट',
  },
  'paymentCollection.method.CASH': {
    hi: 'नकद',
    mr: 'रोख',
  },
  'paymentCollection.method.CHEQUE': {
    hi: 'चेक',
    mr: 'चेक',
  },
  'paymentCollection.tenantFilters.paid': {
    hi: 'भुगतान ({{count}})',
    mr: 'भरले ({{count}})',
  },
  'paymentCollection.tenantFilters.rejected': {
    hi: 'अस्वीकृत ({{count}})',
    mr: 'नाकारले ({{count}})',
  },
  'paymentCollection.tenantSections.actionNeeded': {
    hi: 'कार्रवाई आवश्यक ({{count}})',
    mr: 'कृती आवश्यक ({{count}})',
  },
  'paymentCollection.tenantSections.history': {
    hi: 'इतिहास ({{count}})',
    mr: 'इतिहास ({{count}})',
  },
  'paymentCollection.tenantSections.empty.actionNeeded': {
    hi: 'अभी किसी कार्रवाई की आवश्यकता नहीं।',
    mr: 'सध्या कोणत्याही कृतीची आवश्यकता नाही।',
  },
  'paymentCollection.detail.tenantMessage': {
    hi: 'किरायेदार संदेश',
    mr: 'भाडेकरूचा संदेश',
  },
  'paymentCollection.detail.ownerNotes': {
    hi: 'मालिक के नोट',
    mr: 'मालकाच्या नोटी',
  },
  'paymentCollection.detail.fields.mealDays': {
    hi: 'शामिल भोजन दिन',
    mr: 'समाविष्ट जेवण दिवस',
  },
  'paymentCollection.detail.fields.dueDate': {
    hi: 'देय तारीख',
    mr: 'देय तारीख',
  },
  'paymentCollection.detail.fields.submitted': {
    hi: 'जमा किया',
    mr: 'जमा केले',
  },
  'paymentCollection.detail.fields.reference': {
    hi: 'संदर्भ / UTR',
    mr: 'संदर्भ / UTR',
  },
  'paymentCollection.detail.mealDaysCount_one': {
    hi: '{{count}} दिन',
    mr: '{{count}} दिवस',
  },
  'paymentCollection.detail.mealDaysCount_other': {
    hi: '{{count}} दिन',
    mr: '{{count}} दिवस',
  },
  'paymentCollection.proof.uploadScreenshot': {
    hi: 'स्क्रीनशॉट अपलोड करें',
    mr: 'स्क्रीनशॉट अपलोड करा',
  },
  'paymentCollection.proof.changeScreenshot': {
    hi: 'स्क्रीनशॉट बदलें',
    mr: 'स्क्रीनशॉट बदला',
  },
  'paymentCollection.proof.remarksLabel': {
    hi: 'मालिक/विक्रेता के लिए टिप्पणी',
    mr: 'मालक/पुरवठादारासाठी शेरा',
  },
  'paymentCollection.proof.noProofAvailable': {
    hi: 'अभी तक कोई स्क्रीनशॉट अपलोड नहीं किया।',
    mr: 'अद्याप कोणताही स्क्रीनशॉट अपलोड केला नाही।',
  },
  'paymentCollection.review.tabHistory': {
    hi: 'इतिहास ({{count}})',
    mr: 'इतिहास ({{count}})',
  },
  'paymentCollection.review.chips.submitted': {
    hi: 'जमा ({{count}})',
    mr: 'जमा ({{count}})',
  },
  'paymentCollection.review.chips.paid': {
    hi: 'भुगतान ({{count}})',
    mr: 'भरले ({{count}})',
  },
  'paymentCollection.review.chips.rejected': {
    hi: 'अस्वीकृत ({{count}})',
    mr: 'नाकारले ({{count}})',
  },
  'paymentCollection.review.chips.submittedLabel': {
    hi: 'जमा किया',
    mr: 'जमा केले',
  },
  'paymentCollection.review.tabSubmitted': {
    hi: 'जमा ({{count}})',
    mr: 'जमा ({{count}})',
  },
  'paymentCollection.review.tabChangesRequested': {
    hi: 'बदलाव अनुरोधित ({{count}})',
    mr: 'बदल मागितला ({{count}})',
  },
  'paymentCollection.review.tabPAID': {
    hi: 'भुगतान ({{count}})',
    mr: 'भरले ({{count}})',
  },
  'paymentCollection.review.tabREJECTED': {
    hi: 'अस्वीकृत ({{count}})',
    mr: 'नाकारले ({{count}})',
  },
  'paymentCollection.approval.approve': {
    hi: 'स्वीकृत करें',
    mr: 'मंजूर करा',
  },
  'paymentCollection.approval.reject': {
    hi: 'अस्वीकृत करें',
    mr: 'नाकारा',
  },
  'paymentCollection.approval.hideDetails': {
    hi: 'विवरण छुपाएं',
    mr: 'तपशील लपवा',
  },
  'paymentCollection.approval.showMore': {
    hi: 'अधिक दिखाएं',
    mr: 'अधिक दाखवा',
  },
  'paymentCollection.approval.showLess': {
    hi: 'कम दिखाएं',
    mr: 'कमी दाखवा',
  },
  'paymentCollection.approval.location': {
    hi: 'स्थान',
    mr: 'स्थान',
  },
  'paymentCollection.approval.method': {
    hi: 'तरीका',
    mr: 'पद्धत',
  },
  'paymentCollection.approval.submitted': {
    hi: 'जमा किया',
    mr: 'जमा केले',
  },
  'paymentCollection.approval.paymentReference': {
    hi: 'संदर्भ {{id}}',
    mr: 'संदर्भ {{id}}',
  },
  'paymentCollection.approval.proofUploaded': {
    hi: 'प्रमाण अपलोड किया',
    mr: 'पुरावा अपलोड केला',
  },
  'paymentCollection.approval.screenshotUploaded': {
    hi: 'स्क्रीनशॉट अपलोड किया',
    mr: 'स्क्रीनशॉट अपलोड केला',
  },
  'paymentCollection.approval.tenantMessage': {
    hi: 'किरायेदार संदेश',
    mr: 'भाडेकरूचा संदेश',
  },
  'paymentCollection.requestUpdate.title': {
    hi: 'अपडेट का अनुरोध',
    mr: 'अपडेटची विनंती',
  },
  'paymentCollection.rejection.title': {
    hi: 'अस्वीकृति का कारण',
    mr: 'नाकारण्याचे कारण',
  },
  'paymentCollection.rejection.WRONG_SCREENSHOT': {
    hi: 'गलत स्क्रीनशॉट',
    mr: 'चुकीचा स्क्रीनशॉट',
  },
  'paymentCollection.rejection.INVALID_UTR': {
    hi: 'अमान्य UTR',
    mr: 'अवैध UTR',
  },
  'paymentCollection.timeline.recent': {
    hi: 'हालिया गतिविधि',
    mr: 'अलीकडील क्रियाकलाप',
  },
  'paymentCollection.timeline.empty': {
    hi: 'अभी तक कोई गतिविधि नहीं।',
    mr: 'अद्याप कोणतीही क्रियाकलाप नाही।',
  },
  'paymentCollection.timeline.PROOF_UPLOADED': {
    hi: 'प्रमाण अपलोड किया',
    mr: 'पुरावा अपलोड केला',
  },
  'paymentCollection.timeline.APPROVED': {
    hi: 'स्वीकृत',
    mr: 'मंजूर',
  },
  'paymentCollection.timeline.RESUBMITTED': {
    hi: 'पुनः जमा किया',
    mr: 'पुन्हा जमा केले',
  },
  'paymentCollection.timeline.REFUNDED': {
    hi: 'वापस किया',
    mr: 'परत केले',
  },
  'paymentCollection.timeline.UPDATE_REQUESTED': {
    hi: 'बदलाव अनुरोधित',
    mr: 'बदल मागितला',
  },

  // ── INVENTORY ────────────────────────────────────────────────────────────
  'inventory.hero.summaryLine': {
    hi: '{{items}} आइटम · {{attention}} ध्यान चाहिए',
    mr: '{{items}} वस्तू · {{attention}} लक्ष द्या',
  },
  'inventory.kpi.value': {
    hi: 'मूल्य',
    mr: 'मूल्य',
  },
  'inventory.kpi.items': {
    hi: 'आइटम',
    mr: 'वस्तू',
  },
  'inventory.kpi.low': {
    hi: 'कम',
    mr: 'कमी',
  },
  'inventory.kpi.out': {
    hi: 'खत्म',
    mr: 'संपले',
  },
  'inventory.sections.attention': {
    hi: 'ध्यान चाहिए',
    mr: 'लक्ष द्या',
  },
  'inventory.sections.recent': {
    hi: 'हालिया गतिविधि',
    mr: 'अलीकडील क्रियाकलाप',
  },
  'inventory.actions.catalog': {
    hi: 'कैटलॉग देखें',
    mr: 'यादी पाहा',
  },
  'inventory.actions.purchase': {
    hi: 'खरीद दर्ज करें',
    mr: 'खरेदी नोंदवा',
  },
  'inventory.actions.purchaseHint': {
    hi: 'विक्रेता खरीद लॉग करें',
    mr: 'पुरवठादार खरेदी नोंदवा',
  },
  'inventory.actions.categories': {
    hi: 'श्रेणियां',
    mr: 'वर्ग',
  },
  'inventory.actions.categoriesHint': {
    hi: 'अपना कैटलॉग व्यवस्थित करें',
    mr: 'तुमची यादी व्यवस्थित करा',
  },
  'inventory.status.LOW': {
    hi: 'कम',
    mr: 'कमी',
  },
  'inventory.status.DISCONTINUED': {
    hi: 'बंद',
    mr: 'बंद',
  },
  'inventory.txn.ADJUSTMENT': {
    hi: 'समायोजन',
    mr: 'समायोजन',
  },
  'inventory.txn.PURCHASE': {
    hi: 'खरीद',
    mr: 'खरेदी',
  },
  'inventory.txn.CONSUMPTION': {
    hi: 'उपयोग',
    mr: 'वापर',
  },
  'inventory.empty.activity': {
    hi: 'अभी तक कोई हालिया गतिविधि नहीं।',
    mr: 'अद्याप कोणतीही अलीकडील हालचाल नाही।',
  },
  'inventory.empty.itemsTitle': {
    hi: 'अभी तक कोई आइटम नहीं',
    mr: 'अद्याप कोणतीही वस्तू नाही',
  },
  'inventory.errors.loadItems': {
    hi: 'आइटम लोड नहीं हो सके',
    mr: 'वस्तू लोड होऊ शकल्या नाही',
  },
  'inventory.errors.loadActivity': {
    hi: 'गतिविधि लोड नहीं हो सकी',
    mr: 'क्रियाकलाप लोड होऊ शकला नाही',
  },
  'inventory.items.title': {
    hi: 'कैटलॉग',
    mr: 'यादी',
  },
  'inventory.items.heading': {
    hi: 'कैटलॉग',
    mr: 'यादी',
  },
  'inventory.items.subheading': {
    hi: 'कैटलॉग में {{count}} आइटम',
    mr: 'यादीत {{count}} वस्तू',
  },
  'inventory.details.title': {
    hi: 'आइटम विवरण',
    mr: 'वस्तूचा तपशील',
  },
  'inventory.details.notFound': {
    hi: 'आइटम नहीं मिला',
    mr: 'वस्तू आढळली नाही',
  },
  'inventory.details.uncategorized': {
    hi: 'अवर्गीकृत',
    mr: 'अवर्गीकृत',
  },
  'inventory.details.minimum': {
    hi: 'न्यूनतम',
    mr: 'किमान',
  },
  'inventory.details.avgPrice': {
    hi: 'औसत मूल्य',
    mr: 'सरासरी किंमत',
  },
  'inventory.details.activity': {
    hi: 'गतिविधि',
    mr: 'क्रियाकलाप',
  },
  'inventory.form.sectionBasics': {
    hi: 'बुनियादी जानकारी',
    mr: 'मूलभूत माहिती',
  },
  'inventory.form.sectionPurchase': {
    hi: 'खरीद',
    mr: 'खरेदी',
  },
  'inventory.form.namePlaceholder': {
    hi: 'आइटम का नाम',
    mr: 'वस्तूचे नाव',
  },
  'inventory.form.location': {
    hi: 'स्थान',
    mr: 'स्थान',
  },
  'inventory.form.locationPlaceholder': {
    hi: 'भंडारण स्थान',
    mr: 'साठवण जागा',
  },
  'inventory.form.purchasePrice': {
    hi: 'खरीद मूल्य (₹)',
    mr: 'खरेदी किंमत (₹)',
  },
  'inventory.form.quantity': {
    hi: 'मात्रा',
    mr: 'प्रमाण',
  },
  'inventory.form.amount': {
    hi: 'कुल राशि (₹)',
    mr: 'एकूण रक्कम (₹)',
  },
  'inventory.form.reason': {
    hi: 'कारण',
    mr: 'कारण',
  },
  'inventory.form.qtyRequired': {
    hi: 'मान्य मात्रा दर्ज करें',
    mr: 'वैध प्रमाण प्रविष्ट करा',
  },
  'inventory.form.createSuccess': {
    hi: 'आइटम बनाया गया',
    mr: 'वस्तू तयार केली',
  },
  'inventory.form.updateSuccess': {
    hi: 'आइटम अपडेट किया गया',
    mr: 'वस्तू अपडेट केली',
  },
  'inventory.categories.title': {
    hi: 'श्रेणियां',
    mr: 'वर्ग',
  },
  'inventory.categories.heading': {
    hi: 'श्रेणियां',
    mr: 'वर्ग',
  },
  'inventory.categories.subheading': {
    hi: '{{count}} श्रेणियां',
    mr: '{{count}} वर्ग',
  },
  'inventory.categories.system': {
    hi: 'सिस्टम',
    mr: 'सिस्टम',
  },
  'inventory.categories.emptyTitle': {
    hi: 'कोई श्रेणी नहीं',
    mr: 'कोणताही वर्ग नाही',
  },
  'inventory.transactions.subheading': {
    hi: '{{count}} लेनदेन',
    mr: '{{count}} व्यवहार',
  },
  'inventory.transactions.emptyTitle': {
    hi: 'अभी तक कोई गतिविधि नहीं',
    mr: 'अद्याप कोणतीही क्रियाकलाप नाही',
  },
  'inventory.suppliers.subheading': {
    hi: '{{count}} विक्रेता',
    mr: '{{count}} पुरवठादार',
  },
  'inventory.suppliers.namePlaceholder': {
    hi: 'विक्रेता का नाम',
    mr: 'पुरवठादाराचे नाव',
  },
  'inventory.suppliers.phone': {
    hi: 'फोन',
    mr: 'फोन',
  },
  'inventory.suppliers.itemCount': {
    hi: '{{count}} आइटम आपूर्ति',
    mr: '{{count}} वस्तू पुरवठा',
  },
  'inventory.profiles.furniture.title': {
    hi: 'फर्नीचर और उपकरण',
    mr: 'फर्निचर आणि उपकरणे',
  },
  'inventory.banner.attention': {
    hi: '{{count}} आइटम पर ध्यान चाहिए',
    mr: '{{count}} वस्तूंवर लक्ष द्या',
  },
  'inventory.banner.showingAttention': {
    hi: '{{count}} आइटम दिखाए जा रहे हैं जिन्हें ध्यान चाहिए · साफ करें',
    mr: '{{count}} वस्तू दाखवल्या जात आहेत ज्यांना लक्ष हवे · साफ करा',
  },

  // ── SPACES ───────────────────────────────────────────────────────────────
  'spaces.mySpaces.spacesSection': {
    hi: 'आपके स्पेस',
    mr: 'तुमचे स्पेस',
  },
  'spaces.mySpaces.searchEmptyTitle': {
    hi: 'कोई स्पेस नहीं मिला',
    mr: 'कोणताही स्पेस आढळला नाही',
  },
  'spaces.mySpaces.defaultBadge': {
    hi: 'डिफ़ॉल्ट',
    mr: 'डिफॉल्ट',
  },
  'spaces.mySpaces.attentionUpToDate': {
    hi: '✔ अप-टू-डेट',
    mr: '✔ अद्ययावत',
  },
  'spaces.mySpaces.attentionMoreUpdates_one': {
    hi: '+{{count}} और अपडेट',
    mr: '+{{count}} अधिक अपडेट',
  },
  'spaces.mySpaces.attentionMoreUpdates_other': {
    hi: '+{{count}} और अपडेट',
    mr: '+{{count}} अधिक अपडेट',
  },
  'spaces.globalDashboard.attentionEmptyBody': {
    hi: 'आपके सभी स्पेस में सब कुछ अप-टू-डेट है।',
    mr: 'तुमच्या सर्व स्पेसमध्ये सर्व काही अद्ययावत आहे।',
  },
  'spaces.globalDashboard.attentionListTitle': {
    hi: 'ध्यान चाहिए',
    mr: 'लक्ष द्या',
  },
  'spaces.globalDashboard.needsAttention': {
    hi: 'ध्यान चाहिए',
    mr: 'लक्ष द्या',
  },
  'spaces.globalDashboard.attentionOk': {
    hi: 'सब कुछ अप-टू-डेट है।',
    mr: 'सर्व काही अद्ययावत आहे।',
  },
  'spaces.globalDashboard.spacesLabel_one': {
    hi: 'स्पेस',
    mr: 'स्पेस',
  },
  'spaces.globalDashboard.spacesLabel_other': {
    hi: 'स्पेस',
    mr: 'स्पेस',
  },
  'spaces.globalDashboard.activityTitle': {
    hi: 'हालिया गतिविधि',
    mr: 'अलीकडील क्रियाकलाप',
  },
  'spaces.globalDashboard.activityEmptyTitle': {
    hi: 'कोई हालिया गतिविधि नहीं।',
    mr: 'कोणतीही अलीकडील क्रियाकलाप नाही।',
  },
  'spaces.globalDashboard.activityListTitle': {
    hi: 'हालिया गतिविधि',
    mr: 'अलीकडील क्रियाकलाप',
  },
  'spaces.globalDashboard.activityCount': {
    hi: '{{count}} हालिया अपडेट',
    mr: '{{count}} अलीकडील अपडेट',
  },
  'spaces.globalDashboard.activityEyebrow': {
    hi: 'मेरे स्पेस',
    mr: 'माझे स्पेस',
  },
  'spaces.globalDashboard.groups.earlier': {
    hi: 'पहले',
    mr: 'आधी',
  },
  'spaces.globalDashboard.groups.week': {
    hi: 'इस सप्ताह',
    mr: 'या आठवड्यात',
  },
  'spaces.switcher.dismiss': {
    hi: 'स्पेस स्विचर बंद करें',
    mr: 'स्पेस स्विचर बंद करा',
  },
  'spaces.createSpace.namePlaceholderByType.MESS': {
    hi: 'जैसे बानेर मेस',
    mr: 'उदा. बाणेर मेस',
  },
  'spaces.createSpace.namePlaceholderByType.PG': {
    hi: 'जैसे सनराइज PG',
    mr: 'उदा. सनराइज PG',
  },
  'spaces.createSpace.namePlaceholderByType.HOSTEL': {
    hi: 'जैसे सिटी हॉस्टल',
    mr: 'उदा. सिटी हॉस्टेल',
  },
  'spaces.createSpace.namePlaceholderByType.CO_LIVING': {
    hi: 'जैसे अर्बन नेस्ट',
    mr: 'उदा. अर्बन नेस्ट',
  },
  'spaces.createSpace.namePlaceholderByType.RENTAL': {
    hi: 'जैसे ग्रीन एवेन्यू फ्लैट्स',
    mr: 'उदा. ग्रीन एव्हेन्यू फ्लॅट्स',
  },
  'spaces.types.mess.label': {
    hi: 'मेस',
    mr: 'मेस',
  },
  'spaces.propertyCategory.pg.gents': {
    hi: 'पुरुष PG',
    mr: 'पुरुष PG',
  },
  'spaces.propertyCategory.pg.ladies': {
    hi: 'महिला PG',
    mr: 'महिला PG',
  },
  'spaces.propertyCategory.pg.mixed': {
    hi: 'मिश्रित PG',
    mr: 'मिश्र PG',
  },
  'spaces.propertyCategory.hostel.gents': {
    hi: 'बॉयज़ हॉस्टल',
    mr: 'मुलांचे हॉस्टेल',
  },
  'spaces.propertyCategory.hostel.ladies': {
    hi: 'गर्ल्स हॉस्टल',
    mr: 'मुलींचे हॉस्टेल',
  },
  'spaces.propertyCategory.hostel.mixed': {
    hi: 'मिश्रित हॉस्टल',
    mr: 'मिश्र हॉस्टेल',
  },
  'spaces.propertyCategory.coLiving.gents': {
    hi: 'पुरुष को-लिविंग',
    mr: 'पुरुष को-लिव्हिंग',
  },
  'spaces.propertyCategory.coLiving.ladies': {
    hi: 'महिला को-लिविंग',
    mr: 'महिला को-लिव्हिंग',
  },
  'spaces.propertyCategory.coLiving.mixed': {
    hi: 'मिश्रित को-लिविंग',
    mr: 'मिश्र को-लिव्हिंग',
  },
  'spaces.amenities.title': {
    hi: 'सुविधाएं',
    mr: 'सुविधा',
  },
  'spaces.amenities.hint': {
    hi: 'इस संपत्ति पर उपलब्ध सुविधाएं चुनें।',
    mr: 'या मालमत्तेवर उपलब्ध सुविधा निवडा.',
  },
  'spaces.amenities.selectAll': {
    hi: 'सब चुनें',
    mr: 'सर्व निवडा',
  },
  'spaces.amenities.customPlaceholder': {
    hi: 'जैसे जिम एक्सेस',
    mr: 'उदा. जिम प्रवेश',
  },
  'spaces.amenities.customRequired': {
    hi: 'कस्टम सुविधा के लिए नाम दर्ज करें।',
    mr: 'कस्टम सुविधेसाठी नाव प्रविष्ट करा.',
  },
  'spaces.amenities.customTooLong': {
    hi: 'कस्टम सुविधा का नाम बहुत लंबा है।',
    mr: 'कस्टम सुविधेचे नाव खूप लांब आहे.',
  },
  'spaces.amenities.maxReached': {
    hi: 'अधिकतम सुविधाओं की संख्या पहुंच गई।',
    mr: 'जास्तीत जास्त सुविधांची संख्या गाठली.',
  },
  'spaces.amenities.codes.WIFI': {
    hi: 'वाई-फाई',
    mr: 'वाय-फाय',
  },
  'spaces.amenities.codes.FOOD_INCLUDED': {
    hi: 'खाना',
    mr: 'जेवण',
  },
  'spaces.amenities.codes.WASHING_MACHINE': {
    hi: 'वाशिंग मशीन',
    mr: 'वॉशिंग मशीन',
  },
  'spaces.amenities.codes.HOT_WATER': {
    hi: 'गर्म पानी',
    mr: 'गरम पाणी',
  },
  'spaces.amenities.codes.PARKING': {
    hi: 'पार्किंग',
    mr: 'पार्किंग',
  },
  'spaces.amenities.codes.REFRIGERATOR': {
    hi: 'फ्रिज',
    mr: 'फ्रिज',
  },
  'spaces.amenities.codes.HOUSEKEEPING': {
    hi: 'हाउसकीपिंग',
    mr: 'हाउसकीपिंग',
  },
  'spaces.amenities.codes.POWER_BACKUP': {
    hi: 'पावर बैकअप',
    mr: 'पॉवर बॅकअप',
  },
  'spaces.amenities.codes.RO_WATER': {
    hi: 'RO पानी',
    mr: 'RO पाणी',
  },
  'spaces.amenities.codes.WARDROBE': {
    hi: 'अलमारी',
    mr: 'कपाट',
  },
  'spaces.details.eyebrow': {
    hi: 'स्पेस',
    mr: 'स्पेस',
  },
  'spaces.details.heading': {
    hi: 'स्पेस विवरण',
    mr: 'स्पेस तपशील',
  },
  'spaces.details.type': {
    hi: 'प्रकार',
    mr: 'प्रकार',
  },
  'spaces.details.deactivate': {
    hi: 'स्पेस निष्क्रिय करें',
    mr: 'स्पेस निष्क्रिय करा',
  },
  'spaces.details.openDashboard': {
    hi: 'डैशबोर्ड खोलें',
    mr: 'डॅशबोर्ड उघडा',
  },
  'spaces.details.deactivateTitle': {
    hi: 'स्पेस निष्क्रिय करें?',
    mr: 'स्पेस निष्क्रिय करायचे?',
  },
  'spaces.details.deactivateMessage': {
    hi: 'यह "{{name}}" को निष्क्रिय कर देगा। यह आपकी स्पेस सूची में नहीं दिखेगा।',
    mr: 'हे "{{name}}" निष्क्रिय करेल. ते तुमच्या स्पेस यादीत दिसणार नाही.',
  },
  'spaces.details.deactivateConfirm': {
    hi: 'निष्क्रिय करें',
    mr: 'निष्क्रिय करा',
  },
  'spaces.details.activity.created': {
    hi: 'स्पेस बनाया गया',
    mr: 'स्पेस तयार केला',
  },
  'spaces.details.activity.title': {
    hi: 'गतिविधि',
    mr: 'क्रियाकलाप',
  },
  'spaces.details.activity.updated': {
    hi: 'विवरण अपडेट किया',
    mr: 'तपशील अपडेट केला',
  },
  'spaces.details.generalInfo': {
    hi: 'सामान्य जानकारी',
    mr: 'सामान्य माहिती',
  },
  'spaces.details.kpi.openPolls': {
    hi: 'खुले सर्वेक्षण',
    mr: 'उघडे सर्वेक्षण',
  },
  'spaces.details.share': {
    hi: 'साझा करें',
    mr: 'शेअर करा',
  },
  'spaces.editSpace.typeLabel': {
    hi: 'स्पेस प्रकार',
    mr: 'स्पेस प्रकार',
  },
  'spaces.editSpace.successTitle': {
    hi: 'स्पेस अपडेट किया',
    mr: 'स्पेस अपडेट केला',
  },
  'spaces.editSpace.generalHelper': {
    hi: 'स्पेस में दिखाई जाने वाली बुनियादी जानकारी।',
    mr: 'स्पेसमध्ये दाखवली जाणारी मूलभूत माहिती.',
  },
  'spaces.editSpace.rulesTitle': {
    hi: 'नियम और नीति',
    mr: 'नियम आणि धोरण',
  },
  'spaces.mealBilling.fallbackLabel': {
    hi: 'बैलेंस खत्म होने पर प्रति भोजन भुगतान',
    mr: 'बॅलन्स संपल्यावर प्रति जेवण पैसे द्या',
  },
  'spaces.mealBilling.types.PAY_PER_MEAL.label': {
    hi: 'प्रति भोजन भुगतान',
    mr: 'प्रति जेवण पैसे',
  },
  'spaces.mealBilling.types.PREPAID_BALANCE.label': {
    hi: 'सब्सक्रिप्शन',
    mr: 'सदस्यत्व',
  },
  'spaces.mealBilling.types.PREPAID_BALANCE.description': {
    hi: 'प्रीपेड मील पैक या रिचार्ज राशि बेचें। बेचे, खपत और शेष बैलेंस ट्रैक करें।',
    mr: 'प्रीपेड जेवण पॅक किंवा रिचार्ज रक्कम विका. विकले, वापरले आणि शिल्लक ट्रॅक करा.',
  },
  'spaces.mealBilling.units.CURRENCY': {
    hi: 'राशि (₹)',
    mr: 'रक्कम (₹)',
  },
  'spaces.menu.open': {
    hi: 'स्पेस मेनू खोलें',
    mr: 'स्पेस मेनू उघडा',
  },
  'spaces.errors.forbidden': {
    hi: 'आपको यह कार्य करने की अनुमति नहीं है।',
    mr: 'तुम्हाला हे काम करण्याची परवानगी नाही.',
  },
  'spaces.errors.notFound': {
    hi: 'स्पेस नहीं मिला या उपलब्ध नहीं है।',
    mr: 'स्पेस आढळला नाही किंवा उपलब्ध नाही.',
  },

  // ── COMPLAINTS ───────────────────────────────────────────────────────────
  'complaints.commentAdded': {
    hi: 'टिप्पणी जोड़ी गई',
    mr: 'टिप्पणी जोडली',
  },
  'complaints.timeline': {
    hi: 'टाइमलाइन',
    mr: 'टाइमलाइन',
  },
  'complaints.comments': {
    hi: 'टिप्पणियां',
    mr: 'टिप्पण्या',
  },
  'complaints.operator': {
    hi: 'संचालक',
    mr: 'संचालक',
  },
  'complaints.internal': {
    hi: 'आंतरिक',
    mr: 'अंतर्गत',
  },
  'complaints.operatorActions': {
    hi: 'संचालक कार्रवाई',
    mr: 'संचालक कृती',
  },
  'complaints.fields.title': {
    hi: 'विषय',
    mr: 'विषय',
  },
  'complaints.fields.description': {
    hi: 'विवरण',
    mr: 'तपशील',
  },
  'complaints.fields.photos': {
    hi: 'फोटो',
    mr: 'फोटो',
  },
  'complaints.fields.mealDate': {
    hi: 'भोजन तारीख',
    mr: 'जेवण तारीख',
  },
  'complaints.fields.mealType': {
    hi: 'भोजन प्रकार',
    mr: 'जेवण प्रकार',
  },
  'complaints.fields.meal': {
    hi: 'संबंधित भोजन',
    mr: 'संबंधित जेवण',
  },
  'complaints.fields.resolution': {
    hi: 'समाधान',
    mr: 'निराकरण',
  },
  'complaints.fields.internalNote': {
    hi: 'आंतरिक नोट',
    mr: 'अंतर्गत नोट',
  },
  'complaints.fields.categoryHelper': {
    hi: 'समस्या प्रकार चुनें',
    mr: 'समस्या प्रकार निवडा',
  },
  'complaints.fields.priorityHelper': {
    hi: 'यह समस्या कितनी जरूरी है?',
    mr: 'ही समस्या किती तातडीची आहे?',
  },
  'complaints.fields.reporter': {
    hi: 'रिपोर्टर',
    mr: 'तक्रारकर्ता',
  },
  'complaints.hints.internalNoteOn': {
    hi: 'केवल मालिक और प्रबंधक यह नोट देख सकते हैं।',
    mr: 'फक्त मालक आणि व्यवस्थापक हा नोट पाहू शकतात.',
  },
  'complaints.placeholders.subject.FOOD': {
    hi: 'जैसे दोपहर का खाना कच्चा था',
    mr: 'उदा. दुपारचे जेवण कच्चे होते',
  },
  'complaints.placeholders.subject.FOOD_QUALITY': {
    hi: 'जैसे रात के खाने में बासी चपाती',
    mr: 'उदा. रात्रीच्या जेवणात शिळी चपाती',
  },
  'complaints.placeholders.subject.FOOD_SERVICE': {
    hi: 'जैसे खाना बहुत देर से परोसा',
    mr: 'उदा. जेवण खूप उशिरा दिले',
  },
  'complaints.placeholders.subject.SERVICE': {
    hi: 'जैसे कर्मचारी अनुरोधों पर ध्यान नहीं दे रहे',
    mr: 'उदा. कर्मचारी विनंत्यांकडे लक्ष देत नाही',
  },
  'complaints.placeholders.subject.OTHER': {
    hi: 'समस्या का संक्षिप्त विवरण',
    mr: 'समस्येचा थोडक्यात तपशील',
  },
  'complaints.placeholders.description.HOUSEKEEPING': {
    hi: 'बताएं क्या छूटा, कौन सा क्षेत्र और कब देखा।',
    mr: 'सांगा काय राहिले, कोणता भाग आणि कधी दिसले.',
  },
  'complaints.placeholders.description.FOOD': {
    hi: 'भोजन, क्या गलत था और कब परोसा गया बताएं।',
    mr: 'जेवण, काय चुकले आणि कधी दिले ते सांगा.',
  },
  'complaints.placeholders.description.FOOD_QUALITY': {
    hi: 'खाद्य पदार्थ, स्वाद/गंध/ताजगी की समस्या और भोजन का समय बताएं।',
    mr: 'खाद्यपदार्थ, चव/वास/ताजेपणाची समस्या आणि जेवणाची वेळ सांगा.',
  },
  'complaints.placeholders.description.FOOD_SERVICE': {
    hi: 'समय, मात्रा, सेवा समस्या और कौन सा भोजन था बताएं।',
    mr: 'वेळ, प्रमाण, सेवा समस्या आणि कोणते जेवण होते सांगा.',
  },
  'complaints.placeholders.description.BILLING': {
    hi: 'शुल्क, अपेक्षित और वास्तविक राशि और महीना बताएं।',
    mr: 'शुल्क, अपेक्षित आणि वास्तविक रक्कम आणि महिना सांगा.',
  },
  'complaints.placeholders.description.SAFETY': {
    hi: 'खतरे, सटीक स्थान और किसी के जोखिम में होने का विवरण दें।',
    mr: 'धोका, नक्की जागा आणि कोणाला धोका असेल तर ते सांगा.',
  },
  'complaints.placeholders.description.SERVICE': {
    hi: 'क्या हुआ, कौन शामिल था और कब हुआ बताएं।',
    mr: 'काय झाले, कोण होते आणि कधी झाले ते सांगा.',
  },
  'complaints.actions.addComment': {
    hi: 'टिप्पणी पोस्ट करें',
    mr: 'टिप्पणी पोस्ट करा',
  },
  'complaints.actions.internalNote': {
    hi: 'आंतरिक नोट पर स्विच करें',
    mr: 'अंतर्गत नोटवर स्विच करा',
  },
  'complaints.actions.publicComment': {
    hi: 'सार्वजनिक टिप्पणी पर स्विच करें',
    mr: 'सार्वजनिक टिप्पणीवर स्विच करा',
  },
  'complaints.actions.start': {
    hi: 'जारी के रूप में चिह्नित करें',
    mr: 'सुरू म्हणून चिन्हांकित करा',
  },
  'complaints.actions.resolve': {
    hi: 'समाधान करें',
    mr: 'निराकरण करा',
  },
  'complaints.actions.close': {
    hi: 'बंद करें',
    mr: 'बंद करा',
  },
  'complaints.actions.reopen': {
    hi: 'फिर खोलें',
    mr: 'पुन्हा उघडा',
  },
  'complaints.status.IN_PROGRESS': {
    hi: 'जारी है',
    mr: 'सुरू आहे',
  },
  'complaints.status.RESOLVED': {
    hi: 'समाधान हो गया',
    mr: 'निराकरण झाले',
  },
  'complaints.priority.LOW': {
    hi: 'कम',
    mr: 'कमी',
  },
  'complaints.priority.MEDIUM': {
    hi: 'मध्यम',
    mr: 'मध्यम',
  },
  'complaints.priority.HIGH': {
    hi: 'उच्च',
    mr: 'उच्च',
  },
  'complaints.priority.URGENT': {
    hi: 'तत्काल',
    mr: 'तातडीचे',
  },
  'complaints.category.HOUSEKEEPING': {
    hi: 'हाउसकीपिंग',
    mr: 'हाउसकीपिंग',
  },
  'complaints.category.FOOD': {
    hi: 'खाना',
    mr: 'जेवण',
  },
  'complaints.category.FOOD_QUALITY': {
    hi: 'खाने की गुणवत्ता',
    mr: 'जेवणाची गुणवत्ता',
  },
  'complaints.category.FOOD_SERVICE': {
    hi: 'खाने की सेवा',
    mr: 'जेवण सेवा',
  },
  'complaints.category.SAFETY': {
    hi: 'सुरक्षा',
    mr: 'सुरक्षितता',
  },
  'complaints.category.SERVICE': {
    hi: 'सेवा',
    mr: 'सेवा',
  },
  'complaints.timelineEvent.COMMENTED': {
    hi: 'टिप्पणी की',
    mr: 'टिप्पणी केली',
  },
  'complaints.timelineEvent.INTERNAL_NOTE': {
    hi: 'आंतरिक नोट',
    mr: 'अंतर्गत नोट',
  },
  'complaints.timelineEvent.ATTACHMENT_ADDED': {
    hi: 'फोटो जोड़ा',
    mr: 'फोटो जोडला',
  },
  'complaints.timelineEvent.REOPENED': {
    hi: 'फिर खोला',
    mr: 'पुन्हा उघडले',
  },
  'complaints.timelineEvent.RESOLVED': {
    hi: 'समाधान हो गया',
    mr: 'निराकरण झाले',
  },
  'complaints.errors.maxPhotos': {
    hi: 'आप अधिकतम 5 फोटो जोड़ सकते हैं।',
    mr: 'तुम्ही जास्तीत जास्त 5 फोटो जोडू शकता.',
  },
  'complaints.hero.eyebrow': {
    hi: 'समस्या ट्रैकिंग',
    mr: 'तक्रार ट्रॅकिंग',
  },
  'complaints.hero.subManage': {
    hi: 'खुली समस्याएं, तात्कालिकता और समाधान की प्रगति ट्रैक करें।',
    mr: 'उघड्या तक्रारी, तातडी आणि निराकरणाची प्रगती ट्रॅक करा.',
  },
  'complaints.hero.subMine': {
    hi: 'अपनी रिपोर्ट की गई समस्याओं और अपडेट का अनुसरण करें।',
    mr: 'तुमच्या नोंदवलेल्या तक्रारी आणि अपडेट फॉलो करा.',
  },
  'complaints.photos.empty': {
    hi: 'अभी तक कोई फोटो नहीं।',
    mr: 'अद्याप कोणताही फोटो नाही.',
  },
  'complaints.raiseHero.eyebrow': {
    hi: 'नई समस्या',
    mr: 'नवी तक्रार',
  },
  'complaints.stats.title': {
    hi: 'एक नज़र में',
    mr: 'एका दृष्टिक्षेपात',
  },
  'complaints.timelineEmpty': {
    hi: 'समस्या बढ़ने के साथ यहाँ गतिविधि दिखेगी।',
    mr: 'तक्रार वाढल्यावर येथे क्रियाकलाप दिसेल.',
  },

  // ── AUTH ─────────────────────────────────────────────────────────────────
  'auth.login.eyebrow': {
    hi: 'साइन इन',
    mr: 'साइन इन',
  },
  'auth.login.modePassword': {
    hi: 'पासवर्ड से लॉगिन',
    mr: 'संकेतशब्दाने लॉगिन',
  },
  'auth.login.modeOtp': {
    hi: 'OTP से लॉगिन',
    mr: 'OTP ने लॉगिन',
  },
  'auth.login.otpInstead': {
    hi: 'OTP से साइन इन करें',
    mr: 'OTP ने साइन इन करा',
  },
  'auth.login.forgotPassword': {
    hi: 'पासवर्ड भूल गए?',
    mr: 'संकेतशब्द विसरलात?',
  },
  'auth.login.submit': {
    hi: 'साइन इन करें',
    mr: 'साइन इन करा',
  },
  'auth.login.passwordLabel': {
    hi: 'पासवर्ड',
    mr: 'संकेतशब्द',
  },
  'auth.login.passwordPlaceholder': {
    hi: 'अपना पासवर्ड दर्ज करें',
    mr: 'तुमचा संकेतशब्द प्रविष्ट करा',
  },
  'auth.login.passwordTooShort': {
    hi: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।',
    mr: 'संकेतशब्द किमान 8 अक्षरांचा असणे आवश्यक आहे.',
  },
  'auth.login.passwordTooLong': {
    hi: 'पासवर्ड अधिकतम 72 अक्षर का होना चाहिए।',
    mr: 'संकेतशब्द जास्तीत जास्त 72 अक्षरांचा असणे आवश्यक आहे.',
  },
  'auth.login.registerPrompt': {
    hi: 'ACOMI में नए हैं?',
    mr: 'ACOMI मध्ये नवीन आहात?',
  },
  'auth.register.heading': {
    hi: 'ACOMI से जुड़ें',
    mr: 'ACOMI मध्ये सामील व्हा',
  },
  'auth.register.sendOtp': {
    hi: 'OTP भेजें',
    mr: 'OTP पाठवा',
  },
  'auth.register.otpSent': {
    hi: 'OTP भेजा गया',
    mr: 'OTP पाठवला',
  },
  'auth.register.namePlaceholder': {
    hi: 'आपका नाम',
    mr: 'तुमचे नाव',
  },
  'auth.register.verifiedEyebrow': {
    hi: 'मोबाइल सत्यापित',
    mr: 'मोबाइल सत्यापित',
  },
  'auth.register.passwordSubheading': {
    hi: 'अपना खाता बनाने के लिए पासवर्ड चुनें।',
    mr: 'तुमचे खाते तयार करण्यासाठी संकेतशब्द निवडा.',
  },
  'auth.register.mobileVerified': {
    hi: 'मोबाइल सत्यापित',
    mr: 'मोबाइल सत्यापित',
  },
  'auth.register.passwordLabel': {
    hi: 'पासवर्ड',
    mr: 'संकेतशब्द',
  },
  'auth.register.passwordTooShort': {
    hi: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए।',
    mr: 'संकेतशब्द किमान 8 अक्षरांचा असणे आवश्यक आहे.',
  },
  'auth.register.passwordTooLong': {
    hi: 'पासवर्ड अधिकतम 72 अक्षर का होना चाहिए।',
    mr: 'संकेतशब्द जास्तीत जास्त 72 अक्षरांचा असणे आवश्यक आहे.',
  },
  'auth.register.confirmPasswordPlaceholder': {
    hi: 'पासवर्ड दोबारा दर्ज करें',
    mr: 'संकेतशब्द पुन्हा प्रविष्ट करा',
  },
  'auth.register.passwordMismatch': {
    hi: 'पासवर्ड मेल नहीं खाते।',
    mr: 'संकेतशब्द जुळत नाही.',
  },
  'auth.register.loginPrompt': {
    hi: 'पहले से खाता है?',
    mr: 'आधीच खाते आहे?',
  },
  'auth.register.loginLink': {
    hi: 'साइन इन',
    mr: 'साइन इन',
  },
  'auth.changeMobile.eyebrow': {
    hi: 'खाता',
    mr: 'खाते',
  },
  'auth.changeMobile.currentLabel': {
    hi: 'वर्तमान नंबर:',
    mr: 'सध्याचा नंबर:',
  },
  'auth.changeMobile.sendOtp': {
    hi: 'OTP भेजें',
    mr: 'OTP पाठवा',
  },
  'auth.changeMobile.backToProfile': {
    hi: 'प्रोफाइल पर वापस',
    mr: 'प्रोफाइलवर परत',
  },
  'auth.otp.codeLabel': {
    hi: 'एकबारगी पासवर्ड',
    mr: 'एकवेळी संकेतशब्द',
  },
  'auth.otp.resend': {
    hi: 'कोड पुनः भेजें',
    mr: 'कोड पुन्हा पाठवा',
  },
  'auth.otp.resent': {
    hi: 'सत्यापन कोड भेजा गया।',
    mr: 'सत्यापन कोड पाठवला गेला.',
  },
  'auth.otp.resendIn': {
    hi: '{{time}} में पुनः भेजें',
    mr: '{{time}} मध्ये पुन्हा पाठवा',
  },
  'auth.otp.sendOtpIn': {
    hi: '{{time}} में OTP भेजें',
    mr: '{{time}} मध्ये OTP पाठवा',
  },
  'auth.otp.expiresIn': {
    hi: 'OTP {{time}} में समाप्त होगा',
    mr: 'OTP {{time}} मध्ये संपेल',
  },
  'auth.otp.expiredHint': {
    hi: 'यह OTP समाप्त हो गया। नया OTP मांगें।',
    mr: 'हा OTP संपला आहे. नवीन OTP मागवा.',
  },
  'auth.forgotPassword.eyebrow': {
    hi: 'पासवर्ड रीसेट',
    mr: 'संकेतशब्द रीसेट',
  },
  'auth.forgotPassword.heading': {
    hi: 'पासवर्ड भूल गए?',
    mr: 'संकेतशब्द विसरलात?',
  },
  'auth.forgotPassword.submit': {
    hi: 'OTP भेजें',
    mr: 'OTP पाठवा',
  },
  'auth.forgotPassword.newPasswordSubheading': {
    hi: 'अपने ACOMI खाते के लिए नया पासवर्ड चुनें।',
    mr: 'तुमच्या ACOMI खात्यासाठी नवीन संकेतशब्द निवडा.',
  },
  'auth.forgotPassword.success': {
    hi: 'आपका पासवर्ड अपडेट हो गया। नए पासवर्ड से साइन इन करें।',
    mr: 'तुमचा संकेतशब्द अपडेट झाला. नवीन संकेतशब्दाने साइन इन करा.',
  },
  'auth.forgotPassword.backToSignIn': {
    hi: 'साइन इन पर वापस',
    mr: 'साइन इनवर परत',
  },

  // ── OCCUPANCY WIZARD ─────────────────────────────────────────────────────
  'occupancyWizard.title.allocate': {
    hi: 'आज चेक-इन करें',
    mr: 'आज चेक-इन करा',
  },
  'occupancyWizard.title.moveIn': {
    hi: 'चेक-इन पूरा करें',
    mr: 'चेक-इन पूर्ण करा',
  },
  'occupancyWizard.stepProgress': {
    hi: 'चरण {{current}} / {{total}}',
    mr: 'पायरी {{current}} / {{total}}',
  },
  'occupancyWizard.noTargets': {
    hi: 'कोई आवास लक्ष्य नहीं मिला।',
    mr: 'कोणताही निवास पर्याय आढळला नाही.',
  },
  'occupancyWizard.noTargetsWithStatus': {
    hi: 'कोई {{status}} लक्ष्य नहीं मिला।',
    mr: 'कोणताही {{status}} पर्याय आढळला नाही.',
  },
  'occupancyWizard.noTargetsWithStatusInBuilding': {
    hi: '{{building}} में कोई {{status}} लक्ष्य नहीं।',
    mr: '{{building}} मध्ये कोणताही {{status}} पर्याय नाही.',
  },
  'occupancyWizard.addMemberHint': {
    hi: 'आगे बढ़ने पर किरायेदार रिकॉर्ड बनाया जाएगा। अलग सेटअप की जरूरत नहीं।',
    mr: 'पुढे गेल्यावर भाडेकरूची नोंद तयार होईल. वेगळ्या सेटअपची गरज नाही.',
  },
  'occupancyWizard.residentCard.mobile': {
    hi: 'मोबाइल {{mobile}}',
    mr: 'मोबाइल {{mobile}}',
  },
  'occupancyWizard.residentCard.previouslyIn': {
    hi: 'पहले {{space}} में रहे',
    mr: 'आधी {{space}} मध्ये राहिले',
  },
  'occupancyWizard.residentCard.inThisSpace': {
    hi: 'पहले से इस स्पेस में हैं',
    mr: 'आधीच या स्पेसमध्ये आहेत',
  },
  'occupancyWizard.context.accommodation': {
    hi: 'आवास',
    mr: 'निवास',
  },
  'occupancyWizard.steps.target': {
    hi: 'आवास चुनें',
    mr: 'निवास निवडा',
  },
  'occupancyWizard.steps.contract': {
    hi: 'अनुबंध शर्तें',
    mr: 'करार अटी',
  },
  'occupancyWizard.steps.reserveDates': {
    hi: 'बुकिंग विवरण',
    mr: 'बुकिंग तपशील',
  },
  'occupancyWizard.steps.reserveDatesHint': {
    hi: 'बुकिंग करते समय कोई शुल्क नहीं लिया जाता।',
    mr: 'बुकिंग करताना कोणतेही शुल्क आकारले जात नाही.',
  },
  'occupancyWizard.review.accommodation': {
    hi: 'आवास',
    mr: 'निवास',
  },

  // ── ONBOARDING ───────────────────────────────────────────────────────────
  'onboarding.choice.eyebrow': {
    hi: 'ACOMI में स्वागत है',
    mr: 'ACOMI मध्ये स्वागत आहे',
  },
  'onboarding.choice.heading': {
    hi: 'आप ACOMI का उपयोग कैसे करेंगे?',
    mr: 'तुम्ही ACOMI कसे वापरणार?',
  },
  'onboarding.choice.headingLead': {
    hi: 'आप उपयोग करेंगे ',
    mr: 'तुम्ही वापरणार ',
  },
  'onboarding.choice.headingHighlight': {
    hi: 'ACOMI का?',
    mr: 'ACOMI चा?',
  },
  'onboarding.choice.manageTitle': {
    hi: 'मैं मालिक हूं',
    mr: 'मी मालक आहे',
  },
  'onboarding.choice.manageBenefit1': {
    hi: 'अपना मेस, PG या हॉस्टल सेटअप करें',
    mr: 'तुमचा मेस, PG किंवा हॉस्टेल सेटअप करा',
  },
  'onboarding.choice.trustTitle': {
    hi: 'आपका डेटा हमारे पास सुरक्षित है',
    mr: 'तुमचा डेटा आमच्याकडे सुरक्षित आहे',
  },
  'onboarding.choice.trustBody': {
    hi: 'ACOMI आपकी जानकारी सुरक्षित रखने के लिए बैंक-स्तरीय सुरक्षा का उपयोग करता है।',
    mr: 'ACOMI तुमची माहिती सुरक्षित ठेवण्यासाठी बँक-दर्जाची सुरक्षा वापरतो.',
  },
  'onboarding.join.title': {
    hi: 'स्पेस से जुड़ें',
    mr: 'स्पेसमध्ये सामील व्हा',
  },
  'onboarding.join.refresh': {
    hi: 'रीफ्रेश',
    mr: 'रिफ्रेश',
  },
  'onboarding.join.refreshing': {
    hi: 'जाँच हो रही है…',
    mr: 'तपासत आहे…',
  },
  'onboarding.join.manageInstead': {
    hi: 'मैं मालिक हूं',
    mr: 'मी मालक आहे',
  },
  'onboarding.join.notNow': {
    hi: 'अभी नहीं',
    mr: 'आत्ता नाही',
  },
  'onboarding.join.accept': {
    hi: 'स्वीकार करें',
    mr: 'स्वीकार करा',
  },

  // ── PROFILE COMPLETION ───────────────────────────────────────────────────
  'profileCompletion.gate.title': {
    hi: 'प्रोफाइल पूरी करें',
    mr: 'प्रोफाइल पूर्ण करा',
  },
  'profileCompletion.gate.heading': {
    hi: 'अपनी प्रोफाइल पूरी करें',
    mr: 'तुमची प्रोफाइल पूर्ण करा',
  },
  'profileCompletion.gate.completeProfile': {
    hi: 'प्रोफाइल पूरी करें',
    mr: 'प्रोफाइल पूर्ण करा',
  },
  'profileCompletion.gate.progress': {
    hi: '{{percent}}% पूर्ण',
    mr: '{{percent}}% पूर्ण',
  },
  'profileCompletion.gate.benefit1': {
    hi: 'PG सेवाएं, भोजन और भुगतान अनलॉक करें',
    mr: 'PG सेवा, जेवण आणि पैसे अनलॉक करा',
  },
  'profileCompletion.wizard.title': {
    hi: 'प्रोफाइल पूरी करें',
    mr: 'प्रोफाइल पूर्ण करा',
  },
  'profileCompletion.wizard.stepProgress': {
    hi: 'चरण {{current}} / {{total}}',
    mr: 'पायरी {{current}} / {{total}}',
  },
  'profileCompletion.wizard.submit': {
    hi: 'प्रोफाइल जमा करें',
    mr: 'प्रोफाइल जमा करा',
  },
  'profileCompletion.wizard.uploadPhoto': {
    hi: 'फोटो अपलोड करें',
    mr: 'फोटो अपलोड करा',
  },
  'profileCompletion.wizard.replacePhoto': {
    hi: 'फोटो बदलें',
    mr: 'फोटो बदला',
  },
  'profileCompletion.wizard.sections.address': {
    hi: 'पता जानकारी',
    mr: 'पत्त्याची माहिती',
  },
  'profileCompletion.wizard.sections.emergency': {
    hi: 'आपातकालीन संपर्क',
    mr: 'आणीबाणी संपर्क',
  },
  'profileCompletion.wizard.sections.documents': {
    hi: 'पहचान और दस्तावेज़',
    mr: 'ओळख आणि दस्तऐवज',
  },
  'profileCompletion.wizard.helper': {
    hi: 'कुछ जानकारी से हम ACOMI को आपके लिए व्यक्तिगत बना सकते हैं।',
    mr: 'काही माहितीमुळे आम्ही ACOMI तुमच्यासाठी वैयक्तिक बनवू शकतो.',
  },
  'profileCompletion.fields.profilePhoto': {
    hi: 'प्रोफाइल फोटो',
    mr: 'प्रोफाइल फोटो',
  },
  'profileCompletion.fields.guardianName': {
    hi: 'अभिभावक / माता-पिता का नाम',
    mr: 'पालक / आई-वडिलांचे नाव',
  },
  'profileCompletion.fields.relationship': {
    hi: 'संबंध',
    mr: 'नाते',
  },
  'profileCompletion.fields.documentNumber': {
    hi: 'दस्तावेज़ संख्या',
    mr: 'दस्तऐवज क्रमांक',
  },
  'profileCompletion.fields.addressProof': {
    hi: 'पते का प्रमाण',
    mr: 'पत्त्याचा पुरावा',
  },
  'profileCompletion.fields.identityProof': {
    hi: 'पहचान प्रमाण',
    mr: 'ओळखीचा पुरावा',
  },
  'profileCompletion.errors.identityTypeRequired': {
    hi: 'पहचान दस्तावेज़ प्रकार चुनें।',
    mr: 'ओळख दस्तऐवज प्रकार निवडा.',
  },
  'profileCompletion.errors.identityNumberRequired': {
    hi: 'दस्तावेज़ संख्या दर्ज करें।',
    mr: 'दस्तऐवज क्रमांक प्रविष्ट करा.',
  },
  'profileCompletion.errors.identityProofRequired': {
    hi: 'पहचान प्रमाण अपलोड करें।',
    mr: 'ओळखीचा पुरावा अपलोड करा.',
  },
  'profileCompletion.errors.addressProofRequired': {
    hi: 'पते का प्रमाण अपलोड करें।',
    mr: 'पत्त्याचा पुरावा अपलोड करा.',
  },
  'profileCompletion.errors.pickFailed': {
    hi: 'फोटो लाइब्रेरी नहीं खुल सकी। ऐप की अनुमतियां जांचें और पुनः प्रयास करें।',
    mr: 'फोटो लायब्ररी उघडू शकली नाही. ॲपची परवानगी तपासा आणि पुन्हा प्रयत्न करा.',
  },

  // ── PROGRESSIVE WORKFLOW ─────────────────────────────────────────────────
  'progressiveWorkflow.nextStep': {
    hi: 'अगला चरण',
    mr: 'पुढील पायरी',
  },
  'progressiveWorkflow.stepOf': {
    hi: 'चरण {{current}} / {{total}}',
    mr: 'पायरी {{current}} / {{total}}',
  },
  'progressiveWorkflow.occupancy.reviewAddonsTitle': {
    hi: 'जमा और सुविधाएं देखें',
    mr: 'ठेव आणि सुविधा तपासा',
  },
  'progressiveWorkflow.occupancy.progressRentNext': {
    hi: '✔ किराया तय  ·  अगला: जमा और सुविधाएं',
    mr: '✔ भाडे ठरले  ·  पुढे: ठेव आणि सुविधा',
  },
  'progressiveWorkflow.member.reviewMealsTitle': {
    hi: 'भोजन सेटिंग देखें',
    mr: 'जेवण सेटिंग तपासा',
  },
  'progressiveWorkflow.member.progressIdentityNext': {
    hi: '✔ ग्राहक विवरण  ·  अगला: भोजन सेटिंग',
    mr: '✔ ग्राहक तपशील  ·  पुढे: जेवण सेटिंग',
  },
  'progressiveWorkflow.member.progressReady': {
    hi: '✔ विवरण देखा  ·  सहेजने के लिए तैयार',
    mr: '✔ तपशील पाहिला  ·  जतन करण्यास तयार',
  },
  'progressiveWorkflow.sharePreview.reviewMessageTitle': {
    hi: 'संदेश और प्राप्तकर्ता देखें',
    mr: 'संदेश आणि प्राप्तकर्ता तपासा',
  },
  'progressiveWorkflow.sharePreview.progressReady': {
    hi: '✔ साझा करने के लिए तैयार',
    mr: '✔ शेअर करण्यास तयार',
  },
  'progressiveWorkflow.editSpace.tabGeneral': {
    hi: 'सामान्य',
    mr: 'सामान्य',
  },
  'progressiveWorkflow.editSpace.tabMeals': {
    hi: 'भोजन और बिलिंग',
    mr: 'जेवण आणि बिलिंग',
  },
  'progressiveWorkflow.editSpace.tabPolls': {
    hi: 'पोल डिफ़ॉल्ट',
    mr: 'पोल डिफॉल्ट',
  },
  'progressiveWorkflow.quickSetup.reviewPreviewHint': {
    hi: 'नीचे की संरचना देखें, फिर उत्पन्न करें।',
    mr: 'खालील रचना तपासा, मग तयार करा.',
  },
  'progressiveWorkflow.createSpace.essentialsTitle': {
    hi: 'आवश्यक जानकारी',
    mr: 'आवश्यक माहिती',
  },
  'progressiveWorkflow.createSpace.reviewAmenitiesTitle': {
    hi: 'सुविधाएं देखें',
    mr: 'सुविधा तपासा',
  },
  'progressiveWorkflow.createSpace.progressEssentialsNext': {
    hi: '✔ आवश्यक  ·  अगला: सुविधाएं',
    mr: '✔ आवश्यक  ·  पुढे: सुविधा',
  },
  'progressiveWorkflow.createSpace.progressReady': {
    hi: '✔ बनाने के लिए तैयार',
    mr: '✔ तयार करण्यास तयार',
  },
  'progressiveWorkflow.raiseComplaint.contextTitle': {
    hi: 'संदर्भ',
    mr: 'संदर्भ',
  },
  'progressiveWorkflow.raiseComplaint.reviewPhotosHint': {
    hi: 'फोटो से संचालक समस्याएं जल्दी हल कर सकते हैं।',
    mr: 'फोटोमुळे संचालक तक्रारी लवकर सोडवू शकतात.',
  },
  'progressiveWorkflow.raiseComplaint.progressDetailsNext': {
    hi: '✔ विवरण  ·  अगला: फोटो',
    mr: '✔ तपशील  ·  पुढे: फोटो',
  },
  'progressiveWorkflow.raiseComplaint.progressReady': {
    hi: '✔ जमा करने के लिए तैयार',
    mr: '✔ जमा करण्यास तयार',
  },
  'progressiveWorkflow.subscription.choosePlanTitle': {
    hi: 'योजना चुनें',
    mr: 'योजना निवडा',
  },
  'progressiveWorkflow.subscription.paymentDetailsTitle': {
    hi: 'भुगतान विवरण',
    mr: 'पैसे तपशील',
  },
  'progressiveWorkflow.subscription.reviewPaymentTitle': {
    hi: 'भुगतान विवरण देखें',
    mr: 'पैसे तपशील तपासा',
  },
  'progressiveWorkflow.subscription.progressReady': {
    hi: '✔ अनुरोध जमा करने के लिए तैयार',
    mr: '✔ विनंती जमा करण्यास तयार',
  },

  // ── SPACE LIFECYCLE ──────────────────────────────────────────────────────
  'spaceLifecycle.milestones.spaceCreated.title': {
    hi: 'स्पेस बनाया गया',
    mr: 'स्पेस तयार झाला',
  },
  'spaceLifecycle.milestones.spaceCreated.reason': {
    hi: 'आपका स्पेस तैयार है — अगले सेटअप चरण के साथ जारी रखें।',
    mr: 'तुमचा स्पेस तयार आहे — पुढील सेटअप पायरीसह सुरू ठेवा.',
  },
  'spaceLifecycle.milestones.propertyReady.title': {
    hi: 'अपनी संपत्ति तैयार करें',
    mr: 'तुमची मालमत्ता तयार करा',
  },
  'spaceLifecycle.milestones.mealsReady.title': {
    hi: 'मेनू लाइब्रेरी कॉन्फ़िगर करें',
    mr: 'मेनू लायब्ररी कॉन्फिगर करा',
  },
  'spaceLifecycle.milestones.mealsReady.reason': {
    hi: 'ग्राहक और निवासी ऑर्डर करने से पहले मेनू आइटम की जरूरत है।',
    mr: 'ग्राहक आणि रहिवाशांना ऑर्डर करण्यापूर्वी मेनू आइटम आवश्यक आहे.',
  },
  'spaceLifecycle.milestones.mealsReady.cta': {
    hi: 'मेनू लाइब्रेरी खोलें',
    mr: 'मेनू लायब्ररी उघडा',
  },
  'spaceLifecycle.milestones.todaysMenuReady.title': {
    hi: 'आज का मेनू बनाएं',
    mr: 'आजचा मेनू तयार करा',
  },
  'spaceLifecycle.milestones.todaysMenuReady.reason': {
    hi: 'तय करें क्या परोसेंगे ताकि ग्राहक ऑर्डर कर सकें।',
    mr: 'काय वाढणार ते ठरवा जेणेकरून ग्राहक ऑर्डर देऊ शकतात.',
  },
  'spaceLifecycle.milestones.todaysMenuReady.cta': {
    hi: 'मेनू बनाएं',
    mr: 'मेनू तयार करा',
  },
  'spaceLifecycle.milestones.menuShared.reason': {
    hi: 'मेनू साझा करें ताकि ग्राहक विकल्प देख सकें और ऑर्डर दे सकें।',
    mr: 'मेनू शेअर करा जेणेकरून ग्राहक पर्याय पाहू शकतात आणि ऑर्डर देऊ शकतात.',
  },
  'spaceLifecycle.milestones.menuShared.cta': {
    hi: 'मेनू साझा करें',
    mr: 'मेनू शेअर करा',
  },
  'spaceLifecycle.milestones.deliveryReady.reason': {
    hi: 'डिलीवरी स्थान ग्राहकों को भरोसेमंद तरीके से भोजन पहुंचाने में मदद करते हैं।',
    mr: 'डिलिव्हरी ठिकाणे ग्राहकांना विश्वासाने जेवण मिळण्यास मदत करतात.',
  },
  'spaceLifecycle.milestones.opsReady.title': {
    hi: 'दैनिक संचालन के लिए तैयार',
    mr: 'दैनिक कामकाजासाठी तयार',
  },
  'spaceLifecycle.milestones.opsReady.cta': {
    hi: 'डैशबोर्ड पर जाएं',
    mr: 'डॅशबोर्डवर जा',
  },
  'spaceLifecycle.milestones.mess.spaceCreated.title': {
    hi: 'मेस बनाया गया',
    mr: 'मेस तयार झाला',
  },
  'spaceLifecycle.milestones.mess.spaceCreated.reason': {
    hi: 'आपका मेस स्पेस तैयार है — अब व्यंजन, ग्राहक और आज का मेनू सेट करें।',
    mr: 'तुमचा मेस स्पेस तयार आहे — आता पदार्थ, ग्राहक आणि आजचा मेनू सेट करा.',
  },
  'spaceLifecycle.milestones.mess.mealsReady.cta': {
    hi: 'मेनू लाइब्रेरी खोलें',
    mr: 'मेनू लायब्ररी उघडा',
  },
  'spaceLifecycle.milestones.mess.todaysMenuReady.title': {
    hi: 'आज का मेनू बनाएं',
    mr: 'आजचा मेनू तयार करा',
  },
  'spaceLifecycle.milestones.mess.todaysMenuReady.reason': {
    hi: 'आज क्या परोसा जाएगा चुनें ताकि ग्राहकों को भोजन की पुष्टि मिलनी शुरू हो।',
    mr: 'आज काय वाढणार ते निवडा जेणेकरून ग्राहकांना जेवणाची पुष्टी मिळू लागेल.',
  },
  'spaceLifecycle.milestones.mess.todaysMenuReady.cta': {
    hi: 'मेनू बनाएं',
    mr: 'मेनू तयार करा',
  },
  'spaceLifecycle.milestones.mess.menuShared.reason': {
    hi: 'साझा करने तक ग्राहकों को आज का मेनू नहीं मिलेगा। साझा करने से ऐप में भोजन की पुष्टि खुलती है।',
    mr: 'शेअर करेपर्यंत ग्राहकांना आजचा मेनू दिसणार नाही. शेअर केल्यावर ॲपमध्ये जेवणाची पुष्टी सुरू होते.',
  },
  'spaceLifecycle.milestones.mess.menuShared.cta': {
    hi: 'मेनू साझा करें',
    mr: 'मेनू शेअर करा',
  },
  'spaceLifecycle.milestones.mess.opsReady.title': {
    hi: 'संचालन के लिए तैयार',
    mr: 'कामकाजासाठी तयार',
  },
  'spaceLifecycle.milestones.mess.opsReady.reason': {
    hi: 'आपका मेस दैनिक संचालन के लिए तैयार है — भोजन, पुष्टि और भुगतान प्रबंधित करें।',
    mr: 'तुमचा मेस दैनिक कामकाजासाठी तयार आहे — जेवण, पुष्टी आणि पैसे व्यवस्थापित करा.',
  },
  'spaceLifecycle.milestones.mess.opsReady.cta': {
    hi: 'डैशबोर्ड पर जाएं',
    mr: 'डॅशबोर्डवर जा',
  },

  // ── MEMBERS ──────────────────────────────────────────────────────────────
  'members.mealBilling.typeWithDefault': {
    hi: '{{type}} (डिफ़ॉल्ट विकल्प)',
    mr: '{{type}} (डिफॉल्ट निवड)',
  },
  'members.mealBilling.useSpaceDefault': {
    hi: 'स्पेस डिफ़ॉल्ट ({{type}})',
    mr: 'स्पेस डिफॉल्ट ({{type}})',
  },
  'members.mealBilling.profileValueDefault': {
    hi: '{{type}} · मेस डिफ़ॉल्ट',
    mr: '{{type}} · मेस डिफॉल्ट',
  },
  'members.mealBilling.changeAction': {
    hi: 'बदलें',
    mr: 'बदला',
  },
  'members.mealBilling.switchToPayPerMealTitle': {
    hi: 'प्रति भोजन भुगतान पर स्विच करें?',
    mr: 'प्रति जेवण पैसे यावर स्विच करायचे?',
  },
  'members.subscriptionSetup.title': {
    hi: 'सब्सक्रिप्शन विवरण',
    mr: 'सदस्यत्व तपशील',
  },
  'members.subscriptionSetup.mealQtyLabel': {
    hi: 'भोजन की संख्या',
    mr: 'जेवणाची संख्या',
  },
  'members.subscriptionSetup.mealQtyPlaceholder': {
    hi: 'जैसे 30',
    mr: 'उदा. 30',
  },
  'members.subscriptionSetup.priceLabel': {
    hi: 'सब्सक्रिप्शन मूल्य (₹)',
    mr: 'सदस्यत्व किंमत (₹)',
  },
  'members.subscriptionSetup.pricePlaceholder': {
    hi: 'जैसे 3000',
    mr: 'उदा. 3000',
  },
  'members.subscriptionSetup.amountLabel': {
    hi: 'सब्सक्रिप्शन राशि (₹)',
    mr: 'सदस्यत्व रक्कम (₹)',
  },
  'members.subscriptionSetup.amountPlaceholder': {
    hi: 'जैसे 3000',
    mr: 'उदा. 3000',
  },
  'members.subscriptionSetup.mealQtyRequired': {
    hi: 'इस सब्सक्रिप्शन पैक में कितने भोजन हैं दर्ज करें।',
    mr: 'या सदस्यत्व पॅकमध्ये किती जेवण आहे ते प्रविष्ट करा.',
  },
  'members.subscriptionSetup.priceRequired': {
    hi: 'एकत्रित सब्सक्रिप्शन राशि दर्ज करें।',
    mr: 'गोळा केलेली सदस्यत्व रक्कम प्रविष्ट करा.',
  },

  // ── PAYMENTS ─────────────────────────────────────────────────────────────
  'payments.tabs.submitted': {
    hi: 'जमा ({{count}})',
    mr: 'जमा ({{count}})',
  },
  'payments.empty.title': {
    hi: 'कोई बिल योग्य गतिविधि नहीं',
    mr: 'कोणतीही बिलयोग्य क्रियाकलाप नाही',
  },
  'payments.errors.network': {
    hi: 'ACOMI से कनेक्ट नहीं हो सका। अपना कनेक्शन जांचें और पुनः प्रयास करें।',
    mr: 'ACOMI शी संपर्क होऊ शकला नाही. तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
  },
  'payments.status.submitted': {
    hi: 'जमा किया',
    mr: 'जमा केले',
  },
  'payments.status.needsUpdate': {
    hi: 'अपडेट आवश्यक',
    mr: 'अपडेट आवश्यक',
  },
  'payments.status.none': {
    hi: 'कोई शुल्क नहीं',
    mr: 'कोणतेही शुल्क नाही',
  },
  'payments.row.collectedOfExpected': {
    hi: '{{expected}} में से {{collected}}',
    mr: '{{expected}} पैकी {{collected}}',
  },
  'payments.row.balanceLine': {
    hi: '{{remaining}} बचा · {{used}} उपयोग',
    mr: '{{remaining}} शिल्लक · {{used}} वापरले',
  },

  // ── PERMISSIONS ──────────────────────────────────────────────────────────
  'permissions.noAccess.title': {
    hi: 'कोई एक्सेस नहीं',
    mr: 'प्रवेश नाही',
  },
  'permissions.noAccess.accommodationTitle': {
    hi: 'आवास उपलब्ध नहीं',
    mr: 'निवास उपलब्ध नाही',
  },
  'permissions.noAccess.backToDashboard': {
    hi: 'डैशबोर्ड पर वापस',
    mr: 'डॅशबोर्डवर परत',
  },
  'permissions.myStay.title': {
    hi: 'मेरी रहाइश',
    mr: 'माझा निवास',
  },
  'permissions.errors.forbidden': {
    hi: 'आपको यह कार्य करने की अनुमति नहीं है।',
    mr: 'तुम्हाला हे काम करण्याची परवानगी नाही.',
  },
  'permissions.errors.ownerOrManagerOnly': {
    hi: 'केवल मालिक या प्रबंधक यह कार्य कर सकते हैं।',
    mr: 'फक्त मालक किंवा व्यवस्थापक हे काम करू शकतात.',
  },
  'permissions.errors.ownerOnly': {
    hi: 'केवल स्पेस मालिक यह कार्य कर सकते हैं।',
    mr: 'फक्त स्पेस मालक हे काम करू शकतात.',
  },
  'permissions.errors.messNoAccommodation': {
    hi: 'मेस स्पेस के लिए आवास उपलब्ध नहीं है।',
    mr: 'मेस स्पेससाठी निवास उपलब्ध नाही.',
  },

  // ── HOME ─────────────────────────────────────────────────────────────────
  'home.aboutTitle': {
    hi: 'भारतीय PG और हॉस्टल के लिए बनाया गया',
    mr: 'भारतीय PG आणि हॉस्टेलसाठी बनवले',
  },
  'home.collectionLabel': {
    hi: 'संग्रह',
    mr: 'संकलन',
  },
  'home.heading': {
    hi: 'स्मार्ट PG और हॉस्टल संचालन',
    mr: 'स्मार्ट PG आणि हॉस्टेल कामकाज',
  },
  'home.insightTitle': {
    hi: 'भोजन विवरण',
    mr: 'जेवण तपशील',
  },
  'home.mealsLabel': {
    hi: 'आज के भोजन',
    mr: 'आजचे जेवण',
  },
  'home.shortcutComplaintsBody': {
    hi: 'टिकट और समाधान',
    mr: 'तक्रारी आणि निराकरण',
  },
  'home.shortcutMealsBody': {
    hi: 'मेनू, सर्वेक्षण और हेडकाउंट',
    mr: 'मेनू, सर्वेक्षण आणि हेडकाउंट',
  },
  'home.shortcutPaymentsBody': {
    hi: 'संग्रह और समीक्षा',
    mr: 'संकलन आणि आढावा',
  },
  'home.shortcutsTitle': {
    hi: 'उत्पाद क्षेत्र',
    mr: 'उत्पाद विभाग',
  },
  'home.wasteHint': {
    hi: '↓ पिछले सप्ताह की तुलना में 18% कम बर्बादी',
    mr: '↓ मागील आठवड्यापेक्षा 18% कमी बर्बाद',
  },

  // ── LIST ─────────────────────────────────────────────────────────────────
  'list.filterDrawer.reset': {
    hi: 'रीसेट',
    mr: 'रीसेट',
  },
  'list.filters.sort': {
    hi: 'क्रमबद्ध करें',
    mr: 'क्रमवारी लावा',
  },
  'list.sort.nameAsc': {
    hi: 'नाम अ–ज़',
    mr: 'नाव अ–ज्ञ',
  },
  'list.sort.nameDesc': {
    hi: 'नाम ज़–अ',
    mr: 'नाव ज्ञ–अ',
  },
  'list.sort.recent': {
    hi: 'हाल में जोड़ा',
    mr: 'अलीकडे जोडले',
  },
  'list.sort.dueAmount': {
    hi: 'देय राशि',
    mr: 'देय रक्कम',
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  'notifications.emptyTitle': {
    hi: 'कोई सूचना नहीं',
    mr: 'कोणतीही सूचना नाही',
  },
  'notifications.allCaughtUp': {
    hi: 'सब पढ़ लिया',
    mr: 'सर्व वाचले',
  },
  'notifications.eyebrow': {
    hi: 'स्पेस',
    mr: 'स्पेस',
  },
  'notifications.filters.action': {
    hi: 'कार्रवाई आवश्यक',
    mr: 'कृती आवश्यक',
  },
  'notifications.filters.general': {
    hi: 'सामान्य',
    mr: 'सामान्य',
  },
  'notifications.filters.unread': {
    hi: 'अपठित',
    mr: 'न वाचलेले',
  },
  'notifications.groups.earlier': {
    hi: 'पहले',
    mr: 'आधी',
  },
  'notifications.noMatchTitle': {
    hi: 'कोई मेल खाती सूचना नहीं',
    mr: 'जुळणारी सूचना नाही',
  },
  'notifications.unreadSummary': {
    hi: '{{count}} अपठित अपडेट',
    mr: '{{count}} न वाचलेले अपडेट',
  },

  // ── COACHMARKS ───────────────────────────────────────────────────────────
  'coachmarks.actions.skip': {
    hi: 'छोड़ें',
    mr: 'वगळा',
  },
  'coachmarks.a11y.stepOf': {
    hi: 'चरण {{current}} / {{total}}',
    mr: 'पायरी {{current}} / {{total}}',
  },
  'coachmarks.a11y.dismissOverlay': {
    hi: 'टिप्स बंद करें',
    mr: 'टिप्स बंद करा',
  },
  'coachmarks.accommodation.step1': {
    hi: 'यह कार्ड हमेशा अगला व्यवसाय कार्य बताता है।',
    mr: 'हे कार्ड नेहमी पुढील व्यावसायिक काम सांगते.',
  },
  'coachmarks.accommodation.step3': {
    hi: 'यहां अपनी संपत्ति लेआउट बनाना शुरू करें।',
    mr: 'येथून तुमचे मालमत्ता लेआउट तयार करणे सुरू करा.',
  },
  'coachmarks.mess.step1': {
    hi: 'यह बताता है कि आपके मेस को आगे क्या चाहिए।',
    mr: 'हे सांगते की तुमच्या मेसला पुढे काय हवे.',
  },
  'coachmarks.mess.step2': {
    hi: 'अपना सेटअप पूरा करने के लिए इस सुझाव का पालन करें।',
    mr: 'तुमचे सेटअप पूर्ण करण्यासाठी या सूचनेचे पालन करा.',
  },
  'coachmarks.mess.step3': {
    hi: 'आपकी सेटअप प्रगति स्वचालित रूप से अपडेट होती है।',
    mr: 'तुमची सेटअप प्रगती आपोआप अपडेट होते.',
  },

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  'settings.language.select': {
    hi: 'भाषा चुनें',
    mr: 'भाषा निवडा',
  },
  'settings.language.names.en': {
    hi: 'अंग्रेज़ी',
    mr: 'इंग्रजी',
  },
};

// ---------------------------------------------------------------------------
// Merge: only add if the key doesn't already have a non-English value
// ---------------------------------------------------------------------------
function isEnglish(s) {
  if (!s || typeof s !== 'string') return true; // treat missing as needing fill
  return /[a-zA-Z]/.test(s) && !/[\u0900-\u097F]/.test(s);
}

let added = 0;
let skipped = 0;

for (const [key, vals] of Object.entries(TRANSLATIONS)) {
  const existing = overlay.byKey[key] || {};
  const newEntry = { ...existing };
  let changed = false;

  for (const lang of ['hi', 'mr']) {
    if (vals[lang] && (isEnglish(existing[lang]) || !existing[lang])) {
      newEntry[lang] = vals[lang];
      changed = true;
    }
  }

  if (changed) {
    overlay.byKey[key] = newEntry;
    added++;
  } else {
    skipped++;
  }
}

fs.writeFileSync(overlayPath, JSON.stringify(overlay, null, 2) + '\n');
console.log(`Done. Added/updated: ${added}, Skipped (already natural): ${skipped}`);
console.log(`Total byKey entries: ${Object.keys(overlay.byKey).length}`);
