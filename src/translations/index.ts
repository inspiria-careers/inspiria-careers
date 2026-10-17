// Translation strings – English & Hindi
// Usage: t("key", lang)

export type Lang = "en" | "hi";

const strings: Record<string, Record<Lang, string>> = {
  home: { en: "Home", hi: "होम" },
  about: { en: "About Us", hi: "हमारे बारे में" },
  services: { en: "Services", hi: "सेवाएं" },
  gallery: { en: "Gallery", hi: "गैलरी" },
  contact: { en: "Contact", hi: "संपर्क" },
  bookAppointment: { en: "Book Appointment", hi: "अपॉइंटमेंट बुक करें" },
  login: { en: "Login", hi: "लॉगिन" },
  signup: { en: "Sign Up", hi: "साइन अप" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  name: { en: "Name", hi: "नाम" },
  email: { en: "Email", hi: "ईमेल" },
  phone: { en: "Phone", hi: "फ़ोन" },
  message: { en: "Message", hi: "संदेश" },
  send: { en: "Send", hi: "भेजें" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  save: { en: "Save", hi: "सहेजें" },
  delete: { en: "Delete", hi: "हटाएं" },
  loading: { en: "Loading...", hi: "लोड हो रहा है..." },
  submit: { en: "Submit", hi: "जमा करें" },
  close: { en: "Close", hi: "बंद करें" },
  detailsComingSoon: { en: "Details will be updated soon.", hi: "जानकारी जल्द अपडेट की जाएगी।" },
  noDataYet: { en: "No content added yet.", hi: "अभी कोई सामग्री नहीं जोड़ी गई।" },
  bookingSuccess: { en: "Your appointment request has been submitted. We will contact you shortly.", hi: "आपकी अपॉइंटमेंट अनुरोध सफलतापूर्वक सबमिट हो गई। हम जल्द ही आपसे संपर्क करेंगे।" },
  privacyPolicy: { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  confidentiality: { en: "All sessions are strictly confidential.", hi: "सभी सत्र पूर्णतः गोपनीय हैं।" },
  emergencyDisclaimer: { en: "In a mental health emergency, please call iCall: 9152987821 or VANDREVALA FOUNDATION: 1860-2662-345 (24×7).", hi: "मानसिक स्वास्थ्य आपातकाल में कृपया iCall: 9152987821 या वंद्रेवाला फाउंडेशन: 1860-2662-345 (24×7) पर कॉल करें।" },
  appointmentPending: { en: "Pending", hi: "प्रतीक्षित" },
  appointmentConfirmed: { en: "Confirmed", hi: "पुष्टि हुई" },
  appointmentCancelled: { en: "Cancelled", hi: "रद्द" },
  appointmentCompleted: { en: "Completed", hi: "पूर्ण" },
  switchToHindi: { en: "हिन्दी", hi: "English" },
  roleAdmin: { en: "Admin", hi: "व्यवस्थापक" },
  roleCounsellor: { en: "Counsellor", hi: "परामर्शदाता" },
  roleClient: { en: "Client", hi: "क्लाइंट" },
  reviews: { en: "Reviews", hi: "समीक्षाएं" },
  articles: { en: "Articles", hi: "लेख" },
  shareExperience: { en: "Share Your Experience", hi: "अपना अनुभव साझा करें" },
  clientNotes: { en: "Private Notes", hi: "निजी नोट्स" },
  clientDocuments: { en: "Documents", hi: "दस्तावेज़" },
  sharedWithCounsellor: { en: "Shared with Counsellor", hi: "काउंसलर के साथ साझा" },
  exportData: { en: "Export My Data", hi: "डेटा डाउनलोड करें" },
  deleteAccount: { en: "Delete Account & Data", hi: "खाता व डेटा मिटाएं" },
};

export function t(key: string, lang: Lang = "en"): string {
  return strings[key]?.[lang] ?? key;
}

export default strings;
