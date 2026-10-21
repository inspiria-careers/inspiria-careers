export interface UniversityItem {
  id: string;
  rank: number;
  name: string;
  nameHi: string;
  country: string;
  countryHi: string;
  flag: string;
  badge: string;
  badgeHi: string;
  coreStrengths: string[];
  coreStrengthsHi: string[];
  courseDuration: string;
  courseDurationHi: string;
  internshipsAndIndustry: string;
  internshipsAndIndustryHi: string;
  tuitionFees: {
    tuition: string;
    livingAndHousing: string;
    totalCoa: string;
    currency: string;
  };
  scholarshipsAndAid: string;
  scholarshipsAndAidHi: string;
  aidType: "Need-Blind" | "Need-Met" | "Merit-Based" | "Subsidized Grant" | "Low Tuition";
  admissionDeadlines: {
    earlyDeadline?: string;
    regularDeadline: string;
    decisionRelease?: string;
    portal: string;
  };
  counselorTip: string;
  counselorTipHi: string;
}

export const INTERNATIONAL_UNIVERSITIES: UniversityItem[] = [
  {
    id: "mit",
    rank: 1,
    name: "Massachusetts Institute of Technology (MIT)",
    nameHi: "मैसाचुसेट्स इंस्टीट्यूट ऑफ टेक्नोलॉजी (MIT)",
    country: "USA",
    countryHi: "संयुक्त राज्य अमेरिका (USA)",
    flag: "🇺🇸",
    badge: "World #1 in STEM & Innovation",
    badgeHi: "विश्व #1 एसटीईएम और नवाचार",
    coreStrengths: [
      "Computer Science",
      "Engineering",
      "Physical Sciences",
      "Economics",
      "Architecture",
    ],
    coreStrengthsHi: [
      "कंप्यूटर साइंस",
      "इंजीनियरिंग",
      "भौतिक विज्ञान",
      "अर्थशास्त्र",
      "आर्किटेक्चर",
    ],
    courseDuration: "4 Years (B.S.)",
    courseDurationHi: "4 वर्ष (B.S.)",
    internshipsAndIndustry:
      "Flexible research and work via UROP (Undergraduate Research Opportunities Program) and MISTI (MIT International Science and Technology Initiatives).",
    internshipsAndIndustryHi:
      "UROP (अंडरग्रेजुएट रिसर्च ऑपर्च्युनिटीज प्रोग्राम) और MISTI (MIT इंटरनेशनल साइंस एंड टेक्नोलॉजी इनिशिएटिव्स) के माध्यम से व्यावहारिक अनुसंधान और वैश्विक इंटर्नशिप।",
    tuitionFees: {
      tuition: "~$64,310 / year",
      livingAndHousing: "~$25,000 / year",
      totalCoa: "~$89,310 / year",
      currency: "USD ($)",
    },
    scholarshipsAndAid:
      "Need-Blind & 100% Need-Met for all international undergraduates. Families with incomes under $100,000 generally attend tuition-free.",
    scholarshipsAndAidHi:
      "सभी अंतर्राष्ट्रीय छात्रों के लिए नीड-ब्लाइंड और 100% प्रमाणित आवश्यकता की पूर्ति। $100,000 से कम आय वाले परिवारों के लिए ट्यूशन शुल्क पूर्णतः निःशुल्क।",
    aidType: "Need-Blind",
    admissionDeadlines: {
      earlyDeadline: "Nov 1 (Early Action - Non-Binding)",
      regularDeadline: "Jan 4 (Regular Action)",
      decisionRelease: "Mid-Dec (EA) / Mid-March (RA)",
      portal: "MIT Application Portal",
    },
    counselorTip:
      "MIT looks for practical 'makers' and hands-on problem solvers. Emphasize independent STEM passion projects, Olympiad results, or software/hardware creations.",
    counselorTipHi:
      "MIT व्यावहारिक 'मेकर्स' और समस्याओं को हल करने वालों को प्राथमिकता देता है। अपने स्वतंत्र एसटीईएम प्रोजेक्ट्स, ओलंपियाड उपलब्धियों या सॉफ्टवेयर/हार्डवेयर नवाचारों को प्रमुखता से प्रदर्शित करें।",
  },
  {
    id: "oxford",
    rank: 2,
    name: "University of Oxford",
    nameHi: "ऑक्सफोर्ड विश्वविद्यालय (University of Oxford)",
    country: "UK",
    countryHi: "यूनाइटेड किंगडम (UK)",
    flag: "🇬🇧",
    badge: "Collegiate System & Academic Rigor",
    badgeHi: "कॉलेजिएट प्रणाली और शैक्षणिक उत्कृष्टता",
    coreStrengths: [
      "PPE (Philosophy, Politics, Economics)",
      "Law",
      "Medicine",
      "English Literature",
      "History",
    ],
    coreStrengthsHi: [
      "PPE (दर्शनशास्त्र, राजनीति, अर्थशास्त्र)",
      "विधि (Law)",
      "चिकित्सा (Medicine)",
      "अंग्रेजी साहित्य",
      "इतिहास",
    ],
    courseDuration: "3 Years (BA) or 4 Years (Integrated Master’s: MEng, MMath)",
    courseDurationHi: "3 वर्ष (BA) या 4 वर्ष (एकीकृत मास्टर्स: MEng, MMath)",
    internshipsAndIndustry:
      "Structured long-summer 8–12 week internships via the Oxford University Internship Programme. No term-time work permitted.",
    internshipsAndIndustryHi:
      "ऑक्सफोर्ड यूनिवर्सिटी इंटर्नशिप प्रोग्राम के माध्यम से गर्मियों की छुट्टियों में 8–12 सप्ताह की संरचित इंटर्नशिप। अध्ययन सत्र (term-time) के दौरान काम की अनुमति नहीं है।",
    tuitionFees: {
      tuition: "£30,000 – £48,000+ / year (varies by faculty)",
      livingAndHousing: "~£15,000 – £17,000 / year",
      totalCoa: "~£45,000 – £65,000 / year",
      currency: "GBP (£)",
    },
    scholarshipsAndAid:
      "Highly competitive undergraduate aid (e.g., Reach Oxford Scholarships, Simon and June Li Scholarships).",
    scholarshipsAndAidHi:
      "अत्यंत प्रतिस्पर्धी स्नातक छात्रवृत्तियां (जैसे रीच ऑक्सफोर्ड स्कॉलरशिप)।",
    aidType: "Merit-Based",
    admissionDeadlines: {
      regularDeadline: "Oct 15 (UCAS Application Deadline)",
      earlyDeadline: "Early Nov (Admissions Tests & Written Work)",
      decisionRelease: "Dec (Interviews) / Mid-Jan (Final Decisions)",
      portal: "UCAS Portal",
    },
    counselorTip:
      "Students apply to a specific constituent college or make an open application. Focus the Personal Statement 80%+ on super-curricular academic reading and analysis rather than extracurricular activities.",
    counselorTipHi:
      "छात्र किसी विशिष्ट कॉलेज में या ओपन आवेदन करते हैं। अपने पर्सनल स्टेटमेंट का 80%+ हिस्सा सामान्य गतिविधियों के बजाय विषय से संबंधित गंभीर अध्ययन, पुस्तकों और शोध विश्लेषण पर केंद्रित रखें।",
  },
  {
    id: "stanford",
    rank: 3,
    name: "Stanford University",
    nameHi: "स्टैनफोर्ड विश्वविद्यालय (Stanford University)",
    country: "USA",
    countryHi: "संयुक्त राज्य अमेरिका (USA)",
    flag: "🇺🇸",
    badge: "Silicon Valley Hub & Venture Culture",
    badgeHi: "सिलिकॉन वैली केंद्र और उद्यम संस्कृति",
    coreStrengths: [
      "Computer Science",
      "Entrepreneurship",
      "Bioengineering",
      "Business-adjacent fields",
      "Psychology",
    ],
    coreStrengthsHi: [
      "कंप्यूटर साइंस",
      "उद्यमिता (Entrepreneurship)",
      "बायोइंजीनियरिंग",
      "बिजनेस और अर्थशास्त्र",
      "मनोविज्ञान (Psychology)",
    ],
    courseDuration: "4 Years (B.A. / B.S.)",
    courseDurationHi: "4 वर्ष (B.A. / B.S.)",
    internshipsAndIndustry:
      "Direct proximity to Silicon Valley tech giants and VCs. Quarter system allows flexible summer internships and corporate co-ops.",
    internshipsAndIndustryHi:
      "सिलिकॉन वैली के तकनीकी दिग्गजों और उद्यम पूंजीपतियों से सीधा जुड़ाव। क्वार्टर प्रणाली गर्मियों में लचीली कॉर्पोरेट इंटर्नशिप और को-ऑप्स की सुविधा देती है।",
    tuitionFees: {
      tuition: "~$62,484 / year",
      livingAndHousing: "~$25,300+ / year",
      totalCoa: "~$87,800+ / year",
      currency: "USD ($)",
    },
    scholarshipsAndAid:
      "Need-Aware for international undergraduates, but guarantees to meet 100% of demonstrated financial need if admitted.",
    scholarshipsAndAidHi:
      "अंतर्राष्ट्रीय छात्रों के लिए नीड-अवेयर, लेकिन प्रवेश मिलने पर 100% वित्तीय आवश्यकता की पूर्ति की गारंटी।",
    aidType: "Need-Met",
    admissionDeadlines: {
      earlyDeadline: "Nov 1 (Restrictive Early Action - REA)",
      regularDeadline: "Jan 5 (Regular Decision - RD)",
      decisionRelease: "Mid-Dec (REA) / Early April (RD)",
      portal: "Common Application / Coalition Portal",
    },
    counselorTip:
      "Focus heavily on the 'Intellectual Vitality' essay prompt. Showcase curiosity pursued purely for the joy of learning, unprompted by school assignments.",
    counselorTipHi:
      "'इंटेलेक्चुअल वाइटैलिटी' (बौद्धिक जिज्ञासा) निबंध पर विशेष ध्यान दें। दर्शाएं कि आपने केवल स्कूल के अंकों के लिए नहीं, बल्कि ज्ञान की आंतरिक रुचि के लिए क्या गहराई से सीखा।",
  },
  {
    id: "cambridge",
    rank: 4,
    name: "University of Cambridge",
    nameHi: "कैम्ब्रिज विश्वविद्यालय (University of Cambridge)",
    country: "UK",
    countryHi: "यूनाइटेड किंगडम (UK)",
    flag: "🇬🇧",
    badge: "Mathematical Tripos & Scientific Discovery",
    badgeHi: "गणितीय ट्रिपोस और वैज्ञानिक खोज",
    coreStrengths: [
      "Natural Sciences",
      "Mathematics (Tripos)",
      "Engineering",
      "Computer Science",
      "Law",
    ],
    coreStrengthsHi: [
      "प्राकृतिक विज्ञान (Natural Sciences)",
      "गणित (Mathematics Tripos)",
      "इंजीनियरिंग",
      "कंप्यूटर साइंस",
      "विधि (Law)",
    ],
    courseDuration: "3 Years (BA) or 4 Years (Integrated Master’s: MEng, MSci)",
    courseDurationHi: "3 वर्ष (BA) या 4 वर्ष (एकीकृत मास्टर्स: MEng, MSci)",
    internshipsAndIndustry:
      "Intensive 8-week terms leave no room for part-time work during term. Internships take place during the long summer vacations with leading research labs and firms.",
    internshipsAndIndustryHi:
      "सघन 8-सप्ताह के सत्रों में पढ़ाई के दौरान काम की अनुमति नहीं होती। प्रमुख अनुसंधान प्रयोगशालाओं और कंपनियों में लंबी गर्मियों की छुट्टियों में इंटर्नशिप होती है।",
    tuitionFees: {
      tuition: "£25,000 – £39,000+ / year (up to £60,000+ for Medicine)",
      livingAndHousing: "~£15,000 – £17,000 / year",
      totalCoa: "~£40,000 – £56,000+ / year",
      currency: "GBP (£)",
    },
    scholarshipsAndAid:
      "Partial merit and need-based bursaries offered through the Cambridge Trust.",
    scholarshipsAndAidHi:
      "कैम्ब्रिज ट्रस्ट के माध्यम से आंशिक योग्यता और आवश्यकता-आधारित छात्रवृत्तियां उपलब्ध हैं।",
    aidType: "Merit-Based",
    admissionDeadlines: {
      regularDeadline: "Oct 15 (UCAS Application Deadline)",
      earlyDeadline: "Oct 22 (My Cambridge Supplementary Application)",
      decisionRelease: "Dec (Interviews) / Mid-Jan (Decisions)",
      portal: "UCAS & My Cambridge Portal",
    },
    counselorTip:
      "Students cannot apply to both Oxford and Cambridge in the same cycle. Prepare applicants for technical, academic problem-solving interviews with Cambridge dons.",
    counselorTipHi:
      "एक ही प्रवेश चक्र में छात्र ऑक्सफोर्ड और कैम्ब्रिज दोनों में एक साथ आवेदन नहीं कर सकते। कैम्ब्रिज प्रोफेसर्स के साथ तकनीकी व समस्या-समाधान साक्षात्कारों के लिए गहन तैयारी करें।",
  },
  {
    id: "nus",
    rank: 5,
    name: "National University of Singapore (NUS)",
    nameHi: "नेशनल यूनिवर्सिटी ऑफ सिंगापुर (NUS)",
    country: "Singapore",
    countryHi: "सिंगापुर",
    flag: "🇸🇬",
    badge: "Asia's Premier Tech & Business University",
    badgeHi: "एशिया का प्रमुख तकनीकी व व्यावसायिक विश्वविद्यालय",
    coreStrengths: [
      "Engineering",
      "Technology",
      "Business / Finance",
      "Data Science",
      "Asian Studies",
    ],
    coreStrengthsHi: [
      "इंजीनियरिंग",
      "प्रौद्योगिकी (Technology)",
      "बिजनेस और वित्त (Finance)",
      "डेटा साइंस",
      "एशियन स्टडीज",
    ],
    courseDuration: "3 to 4 Years (Direct Honours options)",
    courseDurationHi: "3 से 4 वर्ष (डायरेक्ट ऑनर्स विकल्प)",
    internshipsAndIndustry:
      "Flagship NUS Overseas Colleges (NOC) offers full-year paid internships in global tech hubs (Silicon Valley, New York, Beijing, Munich) alongside coursework.",
    internshipsAndIndustryHi:
      "प्रमुख 'NUS ओवरसीज कॉलेज' (NOC) कार्यक्रम के तहत सिलिकॉन वैली, न्यूयॉर्क, म्यूनिख जैसे वैश्विक तकनीकी केंद्रों में पढ़ाई के साथ 1-वर्षीय सशुल्क इंटर्नशिप।",
    tuitionFees: {
      tuition: "~S$20,000 – S$32,000 / year (with MOE Grant)",
      livingAndHousing: "~S$12,000 – S$15,000 / year",
      totalCoa: "~S$32,000 – S$47,000 / year (Subsidized rate)",
      currency: "SGD (S$)",
    },
    scholarshipsAndAid:
      "MOE Tuition Grant offsets tuition costs by 30–45% in exchange for a 3-year post-graduation work commitment in Singapore. Full merit awards like the ASEAN Undergraduate Scholarship are available.",
    scholarshipsAndAidHi:
      "सिंगापुर सरकार का MOE ट्यूशन ग्रांट 30–45% तक फीस कम करता है (3 वर्ष सिंगापुर में कार्य अनुबंध के साथ)। ASEAN और मेरिट स्कॉलरशिप भी उपलब्ध हैं।",
    aidType: "Subsidized Grant",
    admissionDeadlines: {
      regularDeadline: "Feb 21 – March 3 (Varies by High School Curriculum)",
      decisionRelease: "May – July",
      portal: "NUS Undergraduate Admissions Portal",
    },
    counselorTip:
      "NUS relies heavily on high academic cutoff scores (IB, AP, or national boards like CBSE/ISC). Verify prerequisite subject requirements early.",
    counselorTipHi:
      "NUS कक्षा 12वीं / बोर्ड अंकों (CBSE/ISC/IB) के कट-ऑफ पर अत्यधिक ध्यान देता है। अपने ऐच्छिक विषय की पूर्व-आवश्यकताओं (Prerequisites) की पहले से जांच करें।",
  },
  {
    id: "harvard",
    rank: 6,
    name: "Harvard University",
    nameHi: "हार्वर्ड विश्वविद्यालय (Harvard University)",
    country: "USA",
    countryHi: "संयुक्त राज्य अमेरिका (USA)",
    flag: "🇺🇸",
    badge: "Ivy League Flagship & Global Leadership",
    badgeHi: "आइवी लीग प्रमुख और वैश्विक नेतृत्व",
    coreStrengths: [
      "Government",
      "Economics",
      "Biological Sciences",
      "Liberal Arts",
      "Business",
    ],
    coreStrengthsHi: [
      "गवर्नमेंट और राजनीति",
      "अर्थशास्त्र (Economics)",
      "जैविक विज्ञान (Biological Sciences)",
      "लिबरल आर्ट्स",
      "बिजनेस मैनेजमेंट",
    ],
    courseDuration: "4 Years (A.B. / S.B.)",
    courseDurationHi: "4 वर्ष (A.B. / S.B.)",
    internshipsAndIndustry:
      "Extensive summer funding available for non-profit work, global research, and corporate internships through the Office of Career Services and Harvard alumni networks.",
    internshipsAndIndustryHi:
      "हार्वर्ड एलुमनाई नेटवर्क और करियर सर्विसेज के माध्यम से वैश्विक शोध, गैर-लाभकारी कार्यों और बहुराष्ट्रीय कंपनियों में सशुल्क ग्रीष्मकालीन इंटर्नशिप।",
    tuitionFees: {
      tuition: "~$58,000 – $60,000 / year",
      livingAndHousing: "~$22,000 – $25,000 / year",
      totalCoa: "~$82,000 – $85,000 / year",
      currency: "USD ($)",
    },
    scholarshipsAndAid:
      "Need-Blind & 100% Need-Met for all international students. Families earning under $85,000 pay zero cost (full ride including room and board).",
    scholarshipsAndAidHi:
      "अंतर्राष्ट्रीय छात्रों के लिए 100% नीड-ब्लाइंड और नीड-मेट। $85,000 से कम वार्षिक पारिवारिक आय वाले छात्रों के लिए संपूर्ण शिक्षा और रहना-खाना निःशुल्क।",
    aidType: "Need-Blind",
    admissionDeadlines: {
      earlyDeadline: "Nov 1 (Restrictive Early Action - REA)",
      regularDeadline: "Jan 1 (Regular Decision - RD)",
      decisionRelease: "Mid-Dec (REA) / Late March (Ivy Day)",
      portal: "Common Application / Coalition Portal",
    },
    counselorTip:
      "Harvard reviews candidates holistically, emphasizing community leadership, unique personal perspective, and character alongside top academics.",
    counselorTipHi:
      "हार्वर्ड केवल अंकों को नहीं बल्कि समग्र प्रोफाइल (होलिस्टिक रिव्यू) को देखता है—नेतृत्व क्षमता, सामुदायिक प्रभाव, और विशिष्ट दृष्टिकोण पर बल दें।",
  },
  {
    id: "toronto",
    rank: 7,
    name: "University of Toronto",
    nameHi: "टोरंटो विश्वविद्यालय (University of Toronto)",
    country: "Canada",
    countryHi: "कनाडा",
    flag: "🇨🇦",
    badge: "Canada #1 & Co-op Industry Excellence",
    badgeHi: "कनाडा #1 और को-ऑप उद्योग उत्कृष्टता",
    coreStrengths: [
      "Computer Science",
      "Engineering",
      "Rotman Commerce",
      "Life Sciences",
      "AI & Machine Learning",
    ],
    coreStrengthsHi: [
      "कंप्यूटर साइंस",
      "इंजीनियरिंग",
      "रोटमैन कॉमर्स",
      "लाइफ साइंसेज",
      "एआई और मशीन लर्निंग",
    ],
    courseDuration: "4 Years (Honours Degree)",
    courseDurationHi: "4 वर्ष (ऑनर्स डिग्री)",
    internshipsAndIndustry:
      "Exceptional Co-op / PEY (Professional Experience Year) programs providing paid 12-to-16-month industry placements with top tech and financial employers.",
    internshipsAndIndustryHi:
      "प्रसिद्ध PEY (प्रोफेशनल एक्सपीरियंस ईयर) को-ऑप कार्यक्रम के तहत शीर्ष टेक व वित्तीय कंपनियों में 12 से 16 महीने की सशुल्क इंडस्ट्री प्लेसमेंट।",
    tuitionFees: {
      tuition: "CAD $60,000 – $70,000 / year",
      livingAndHousing: "CAD $18,000 – $22,000 / year",
      totalCoa: "CAD $78,000 – $92,000 / year",
      currency: "CAD ($)",
    },
    scholarshipsAndAid:
      "Lester B. Pearson International Scholarship provides a full ride (tuition + housing) for exceptional global candidates. Automatic entrance scholarships based on grades.",
    scholarshipsAndAidHi:
      "लेस्टर बी. पियर्सन इंटरनेशनल स्कॉलरशिप (पूर्ण ट्यूशन और आवास)। इसके अतिरिक्त शीर्ष 12वीं अंकों के आधार पर स्वचालित प्रवेश छात्रवृत्तियां उपलब्ध हैं।",
    aidType: "Merit-Based",
    admissionDeadlines: {
      earlyDeadline: "Nov 7 (Early Consideration Deadline)",
      regularDeadline: "Jan 15 (Final Application Deadline)",
      decisionRelease: "Feb – April (Rolling Decisions)",
      portal: "OUAC (Ontario Universities' Application Centre) / UofT Portal",
    },
    counselorTip:
      "Advise candidates to submit applications early by November for early consideration, especially for competitive majors like CS and Rotman Commerce.",
    counselorTipHi:
      "कंप्यूटर साइंस और रोटमैन कॉमर्स जैसे लोकप्रिय पाठ्यक्रमों के लिए नवंबर के पहले सप्ताह तक आवेदन जमा करें ताकि 'अर्ली कंसीडरेशन' का लाभ मिल सके।",
  },
  {
    id: "eth-zurich",
    rank: 8,
    name: "ETH Zurich",
    nameHi: "ईटीएच ज्यूरिख (ETH Zurich)",
    country: "Switzerland",
    countryHi: "स्विट्जरलैंड",
    flag: "🇨🇭",
    badge: "Continental Europe's #1 STEM Powerhouse",
    badgeHi: "यूरोप का #1 तकनीकी व विज्ञान संस्थान",
    coreStrengths: [
      "Engineering",
      "Physics",
      "Architecture",
      "Computer Science",
      "Mathematics",
    ],
    coreStrengthsHi: [
      "इंजीनियरिंग",
      "भौतिकी (Physics)",
      "आर्किटेक्चर",
      "कंप्यूटर साइंस",
      "गणित (Mathematics)",
    ],
    courseDuration: "3 Years (BSc) + 1.5–2 Years (MSc)",
    courseDurationHi: "3 वर्ष (BSc) + 1.5–2 वर्ष (MSc)",
    internshipsAndIndustry:
      "Direct corporate partnerships and laboratory research modules integrated into upper-level studies and master's theses with CERN, Google Zurich, and IBM Research.",
    internshipsAndIndustryHi:
      "सर्न (CERN), गूगल ज्यूरिख और आईबीएम रिसर्च के साथ प्रयोगशाला अनुसंधान और प्रत्यक्ष कॉर्पोरेट इंटर्नशिप मास्टर थीसिस में एकीकृत।",
    tuitionFees: {
      tuition: "Very low (~CHF 1,460 / ~$1,600 USD per year)",
      livingAndHousing: "High (~CHF 22,000 – 26,000 / ~$25,000 USD per year)",
      totalCoa: "~$26,000 – $30,000 USD / year",
      currency: "CHF / USD",
    },
    scholarshipsAndAid:
      "Extremely low tuition acts as implicit financial aid; limited undergraduate scholarships exist for non-EU students. The prestigious ESOP fellowship is available at the Master's level.",
    scholarshipsAndAidHi:
      "अत्यंत कम ट्यूशन फीस (~$1,600/वर्ष) स्वयं में बड़ी सहायता है; मास्टर स्तर पर पूर्ण ESOP फेलोशिप उपलब्ध है।",
    aidType: "Low Tuition",
    admissionDeadlines: {
      regularDeadline: "Nov 1 – Dec 15 (Annual Window)",
      decisionRelease: "Feb – April",
      portal: "ETH e-Apply Portal",
    },
    counselorTip:
      "Most Bachelor’s programs require certified fluency in German (C1 level), though Master’s programs are widely taught in English. Non-Swiss diplomas may require passing an entrance exam.",
    counselorTipHi:
      "स्नातक (Bachelor's) स्तर पर जर्मन भाषा में C1 स्तर की दक्षता अनिवार्य होती है, जबकि मास्टर्स स्तर पर अंग्रेजी माध्यम उपलब्ध है। भारतीय बोर्ड के छात्रों को प्रवेश परीक्षा देनी पड़ सकती है।",
  },
  {
    id: "melbourne",
    rank: 9,
    name: "University of Melbourne",
    nameHi: "मेलबर्न विश्वविद्यालय (University of Melbourne)",
    country: "Australia",
    countryHi: "ऑस्ट्रेलिया",
    flag: "🇦🇺",
    badge: "Australia #1 & Flexible Melbourne Model",
    badgeHi: "ऑस्ट्रेलिया #1 और लचीला मेलबर्न मॉडल",
    coreStrengths: [
      "Medicine",
      "Law",
      "Business",
      "Education",
      "Environmental Science",
    ],
    coreStrengthsHi: [
      "चिकित्सा (Medicine)",
      "विधि (Law)",
      "बिजनेस और प्रबंधन",
      "शिक्षा (Education)",
      "पर्यावरण विज्ञान",
    ],
    courseDuration: "3 Years (Standard Bachelor's degree under the 'Melbourne Model')",
    courseDurationHi: "3 वर्ष (मेलबर्न मॉडल के तहत स्नातक डिग्री)",
    internshipsAndIndustry:
      "Work-Integrated Learning (WIL) subjects, industry projects, and clinical placements are built directly into the degree for academic credit.",
    internshipsAndIndustryHi:
      "वर्क-इंटीग्रेटेड लर्निंग (WIL), लाइव प्रोजेक्ट्स और क्लिनिकल इंटर्नशिप सीधे डिग्री के क्रेडिट में शामिल हैं।",
    tuitionFees: {
      tuition: "AUD $44,000 – $54,000 / year",
      livingAndHousing: "AUD $25,000 – $30,000 / year",
      totalCoa: "AUD $69,000 – $84,000 / year",
      currency: "AUD ($)",
    },
    scholarshipsAndAid:
      "Melbourne International Undergraduate Scholarship offers merit-based fee remissions (ranging from partial tuition reductions up to 100% full tuition waivers).",
    scholarshipsAndAidHi:
      "मेलबर्न इंटरनेशनल अंडरग्रेजुएट स्कॉलरशिप (योग्यता के आधार पर आंशिक छूट से लेकर 100% पूर्ण ट्यूशन वेवर)।",
    aidType: "Merit-Based",
    admissionDeadlines: {
      earlyDeadline: "Nov 30 (Semester 1 - February Intake)",
      regularDeadline: "May 31 (Semester 2 - July Intake)",
      decisionRelease: "Rolling basis (4–8 weeks post-submission)",
      portal: "University of Melbourne International Portal / VTAC",
    },
    counselorTip:
      "Selection is largely transactional based on high-school percentage cutoffs, ATAR equivalents, or IB scores without heavy emphasis on personal essays.",
    counselorTipHi:
      "ऑस्ट्रेलिया में प्रवेश मुख्यतः 12वीं कक्षा के प्रतिशत / कट-ऑफ पर आधारित होता है। निबंध या पाठ्येतर गतिविधियों की जगह बोर्ड अंकों को अधिकतम प्राथमिकता दें।",
  },
  {
    id: "lse",
    rank: 10,
    name: "London School of Economics and Political Science (LSE)",
    nameHi: "लंदन स्कूल ऑफ इकोनॉमिक्स (LSE)",
    country: "UK",
    countryHi: "यूनाइटेड किंगडम (UK)",
    flag: "🇬🇧",
    badge: "World Leader in Social Sciences & Finance",
    badgeHi: "सामाजिक विज्ञान और वित्त में विश्व विख्यात",
    coreStrengths: [
      "Economics",
      "Finance",
      "International Relations",
      "Sociology",
      "Politics",
    ],
    coreStrengthsHi: [
      "अर्थशास्त्र (Economics)",
      "वित्त (Finance)",
      "अंतर्राष्ट्रीय संबंध (International Relations)",
      "समाजशास्त्र (Sociology)",
      "राजनीति (Politics)",
    ],
    courseDuration: "3 Years (BSc)",
    courseDurationHi: "3 वर्ष (BSc)",
    internshipsAndIndustry:
      "Central London location grants direct networking access to global investment banks, consultancies, government bodies, and international think tanks.",
    internshipsAndIndustryHi:
      "लंदन के केंद्र में स्थित होने के कारण वैश्विक निवेश बैंकों, परामर्श फर्मों, नीति निर्माताओं और थिंक टैंकों तक सीधा संपर्क और इंटर्नशिप के अवसर।",
    tuitionFees: {
      tuition: "£26,000 – £36,000 / year",
      livingAndHousing: "~£16,000 – £20,000 / year",
      totalCoa: "~£42,000 – £56,000 / year",
      currency: "GBP (£)",
    },
    scholarshipsAndAid:
      "LSE Undergraduate Support Scheme (USS) offers partial need-based awards (typically £6,000 to £15,000/year) for international students.",
    scholarshipsAndAidHi:
      "LSE अंडरग्रेजुएट सपोर्ट स्कीम (USS) अंतर्राष्ट्रीय छात्रों को आवश्यकता-आधारित वित्तीय सहायता (£6,000 से £15,000 प्रति वर्ष) प्रदान करती है।",
    aidType: "Need-Met",
    admissionDeadlines: {
      regularDeadline: "Jan 29 (UCAS Equal Consideration Deadline)",
      decisionRelease: "Rolling through Mid-May",
      portal: "UCAS Application Portal",
    },
    counselorTip:
      "LSE is single-mindedly focused on the social sciences. The UCAS Personal Statement must be structured as an academic essay demonstrating rigorous engagement with the chosen subject.",
    counselorTipHi:
      "LSE पूरी तरह सामाजिक विज्ञानों पर केंद्रित है। UCAS पर्सनल स्टेटमेंट को एक गंभीर शैक्षणिक शोध निबंध के रूप में तैयार करें जो विषय में आपकी गहरी पढ़ाई को सिद्ध करे।",
  },
];
