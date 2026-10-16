import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ServiceDetail {
  id: string;
  icon: string;
  title: string;
  category: string;
  badge?: string;
  description: string;
  deadlines?: string;
  guidelines: string[];
  prerequisites: string[];
  actionLinkText?: string;
}

export const DEFAULT_SERVICE_DETAILS: Record<string, ServiceDetail> = {
  // ── SLIDE 1: EXAMINATION MANAGEMENT SERVICES ──
  "exam-provisioning": {
    id: "exam-provisioning",
    icon: "🪙",
    title: "Examination Provisioning, Registration & Fee Payment",
    category: "Examination Management Services",
    badge: "Step 01 · Candidate Onboarding",
    description:
      "End-to-end facilitation for high-stakes national examinations including JEE Main/Advanced, NEET-UG, CUET, and regional entrance tests. Ensuring accurate category declaration, quota claiming (EWS/OBC-NCL/SC/ST/PwD), and secure gateway fee reconciliation.",
    deadlines: "Official portals open strictly for 3–4 weeks. Late fee submission windows are typically non-extendable.",
    guidelines: [
      "Ensure candidate mobile number and email ID remain active throughout the admission cycle for SMS OTP alerts.",
      "Cross-verify candidate name against Class 10th Board Certificate spelling to prevent mismatch disqualification.",
      "Always generate and preserve the Application Confirmation Page and Transaction Challan with barcode."
    ],
    prerequisites: [
      "Recent passport-size photograph (10KB–200KB, white background, 80% face coverage without mask)",
      "Scanned candidate signature (4KB–30KB) and left/right thumb impressions",
      "Valid Category / EWS / PwD Certificate issued after the mandated national cut-off date",
      "Class 10th & 12th marksheet roll numbers and school board details"
    ],
    actionLinkText: "Book Guidance for Exam Registration"
  },
  "data-correction": {
    id: "data-correction",
    icon: "✅",
    title: "Data Correction and Verification",
    category: "Examination Management Services",
    badge: "Step 02 · Discrepancy Redressal",
    description:
      "Assistance during official correction windows to rectify inadvertent mistakes in state of eligibility, photo/signature mismatch, test city choices, medium of question paper, and subject codes.",
    deadlines: "Correction windows are open for a brief 48 to 72 hour period only. No offline representations are entertained thereafter.",
    guidelines: [
      "Check candidate portal status for image discrepancy flags raised by NTA or examination authorities.",
      "Upload updated self-attested affidavits if category or surname changes are being submitted.",
      "Verify that test center city preferences correspond to current residential or school address."
    ],
    prerequisites: [
      "Application ID and Portal Security Password",
      "Supporting government ID (Aadhaar Card, Passport, or Voter ID)",
      "Corrected image files adhering strictly to official NTA/CBSE pixel dimensions"
    ],
    actionLinkText: "Book Correction Assistance"
  },
  "admit-card": {
    id: "admit-card",
    icon: "📇",
    title: "E-Admit Card & Schedule",
    category: "Examination Management Services",
    badge: "Step 03 · Examination Hall Pass",
    description:
      "Real-time tracking and issuance advisories for city intimation slips and hall tickets. Scrutiny of reporting time, shift slotting, exam center location, and mandatory self-declaration undertakings.",
    deadlines: "City intimation released 7–10 days before exam; Admit cards released 2–4 days prior to exam date.",
    guidelines: [
      "Print admit card on A4 size paper in clear color printout with all instructions pages intact.",
      "Affix identical passport photo in the designated box prior to reaching the center.",
      "Read COVID/Health advisory and strict ban on prohibited electronic articles (watches, bluetooth, metallic items)."
    ],
    prerequisites: [
      "Printed Admit Card with signed parent undertaking",
      "Original valid Photo ID Proof (Aadhaar Card / School ID / Passport)",
      "Transparent ballpoint pen & 50ml transparent sanitizer bottle"
    ],
    actionLinkText: "Get Admit Card Guidance"
  },
  "results-pub": {
    id: "results-pub",
    icon: "📑",
    title: "Answer Key / Results Publication",
    category: "Examination Management Services",
    badge: "Step 04 · Score Analysis & Rank Prediction",
    description:
      "Expert analysis of provisional answer keys, recorded OMR response sheets, question challenge filing with evidence, and NTA percentile/normalized score interpretation.",
    deadlines: "Answer key challenge window is typically open for 48 hours with non-refundable processing fee per question.",
    guidelines: [
      "Calculate raw score using official marking schemes (+4, -1 or zero marks).",
      "Compare provisional answer keys with standard textbook citations before challenging.",
      "Analyze All India Rank (AIR) vs Category Rank for realistic seat matrix planning."
    ],
    prerequisites: [
      "Recorded Response Sheet PDF",
      "Official Master Question Paper",
      "Candidate login credentials"
    ],
    actionLinkText: "Analyze My Results & Rank"
  },

  // ── SLIDE 1: COUNSELLING & ADMISSION SERVICES ──
  "seat-matrix": {
    id: "seat-matrix",
    icon: "🏛️",
    title: "Seat Matrix Management",
    category: "Counselling & Admission Services",
    badge: "Step 05 · Institutional Availability",
    description:
      "In-depth analytics on category-wise seat distribution across 23 IITs, 32 NITs, 26 IIITs, GFTIs, and State Government / Medical Colleges. Understanding gender-neutral vs female-supernumerary quota.",
    deadlines: "Seat matrix is published by JoSAA/CSAB/MCC prior to Round 1 choice filling.",
    guidelines: [
      "Review newly introduced branches (e.g. AI, Data Science, VLSI Design, Cyber Security).",
      "Evaluate opening and closing ranks (OR-CR) trends over the last 3 preceding years.",
      "Factor in tuition fees, hostel facilities, and average placement statistics."
    ],
    prerequisites: [
      "Candidate All India Rank (AIR) & Category Rank",
      "Eligibility verification (e.g., Top 20 percentile or 75% aggregate in 12th Board for IIT/NIT)"
    ],
    actionLinkText: "Explore Available Seats & Colleges"
  },
  "institute-selection": {
    id: "institute-selection",
    icon: "💻",
    title: "Institute & Course Selection / Multiple Round Seat Allotment",
    category: "Counselling & Admission Services",
    badge: "Step 06 · Strategic Choice Filling",
    description:
      "Algorithmic and personalized choice filling preference list generation. Strategically ordering top choices to prevent accidental auto-locking of suboptimal institutes, and mastering Float, Freeze, and Slide rules across rounds.",
    deadlines: "Choice filling window is non-negotiable; un-locked choices are auto-locked at deadline.",
    guidelines: [
      "Never fill a branch or college you are completely unwilling to join.",
      "Utilize 'Slide' if you want a better branch in the same institute.",
      "Utilize 'Float' if you are open to any better choice across all participating colleges."
    ],
    prerequisites: [
      "Verified preference list customized to candidate rank and location preferences",
      "Counselling registration portal login"
    ],
    actionLinkText: "Get Personalized Choice Filling Order"
  },
  "allotment-letter": {
    id: "allotment-letter",
    icon: "✉️",
    title: "Admission & Allotment Letter",
    category: "Counselling & Admission Services",
    badge: "Step 07 · Seat Allocation",
    description:
      "Provisional seat allotment processing, Seat Acceptance Fee (SAF) payment facilitation, and formal allotment letter generation ensuring admission security.",
    deadlines: "SAF payment must be completed strictly within 2–3 days of round result declaration to prevent seat forfeiture.",
    guidelines: [
      "Download and print 3 color copies of Provisional Allotment Result.",
      "Pay SAF via Net Banking or UPI through the designated official portal gateway.",
      "Monitor portal for reporting query notifications from virtual verification officers."
    ],
    prerequisites: [
      "Net Banking or UPI account with adequate limit for Seat Acceptance Fee",
      "Class 10th, 12th, and Category Certificates ready for immediate upload"
    ],
    actionLinkText: "Allotment Verification Guidance"
  },
  "doc-verification": {
    id: "doc-verification",
    icon: "📂",
    title: "Online Document Verification & Institute Admission",
    category: "Counselling & Admission Services",
    badge: "Step 08 · Physical / Final Reporting",
    description:
      "Comprehensive document verification clearance, query resolution with verification authorities, Partial Admission Fee (PAF) payment, and final physical reporting at allotted colleges.",
    deadlines: "Physical reporting schedule is dictated by individual institutes immediately following final round.",
    guidelines: [
      "Respond to online verification queries within designated query response timeline.",
      "Obtain medical fitness certificate in official format signed by registered medical practitioner.",
      "Collect migration certificate, transfer certificate (TC), and character certificate from school."
    ],
    prerequisites: [
      "Class 10th & 12th Original Marksheets & Pass Certificates",
      "Medical Fitness Certificate in official format",
      "Category / PwD / EWS Certificate (Central format)",
      "Provisional Admission Slip & Fee Payment Receipts"
    ],
    actionLinkText: "Complete Verification & Admission"
  },

  // ── SLIDE 2: PERSONALIZED COUNSELING & PRINCIPAL MA'AM ──
  "psychometric-testing": {
    id: "psychometric-testing",
    icon: "🧠",
    title: "Scientific Psychometric & Stream Testing",
    category: "Personalized Counseling Verticals",
    badge: "Aptitude Assessment",
    description:
      "Standardized multi-dimensional psychometric evaluation measuring cognitive abilities, numerical reasoning, emotional intelligence, and intrinsic vocational interest to choose the ideal academic stream.",
    deadlines: "Conducted year-round. Ideal for students in Classes 8th to 12th and early college undergraduates.",
    guidelines: [
      "Answer questions instinctively without overthinking; there are no right or wrong answers.",
      "Evaluation covers RIASEC interest types and Myers-Briggs personality indicators.",
      "Includes a 45-minute one-on-one interpretation session with Principal Ma'am."
    ],
    prerequisites: [
      "Candidate academic report cards of the past two academic years",
      "Stable internet connection for 40-minute online psychometric diagnostic"
    ],
    actionLinkText: "Book Psychometric Assessment"
  },
  "anxiety-relief": {
    id: "anxiety-relief",
    icon: "🌿",
    title: "Adolescent Psychology & Exam Anxiety Relief",
    category: "Personalized Counseling Verticals",
    badge: "Holistic Wellness",
    description:
      "Compassionate, evidence-based psychological counseling to eliminate panic attacks, fear of failure, exam stress, insomnia, and peer pressure among teenagers preparing for competitive exams.",
    deadlines: "Recommended throughout the academic session, especially during pre-boards and peak exam months.",
    guidelines: [
      "Confidential, empathetic, non-judgmental safe space for students.",
      "Techniques include cognitive restructuring, mindfulness, and active study pacing.",
      "Personalized sleep-cycle and nutrition habit coaching."
    ],
    prerequisites: [
      "Parental consent for minors",
      "Overview of current exam schedule and distress symptoms"
    ],
    actionLinkText: "Schedule Stress Relief Session"
  },
  "parent-harmony": {
    id: "parent-harmony",
    icon: "👨‍👩‍👧",
    title: "Parent-Child Communication Harmony",
    category: "Personalized Counseling Verticals",
    badge: "Family Mediation",
    description:
      "Bridging the generational gap between parents' career expectations and the student's authentic passions, fostering a supportive domestic environment that empowers youth.",
    deadlines: "Available on appointment; weekend evening slots open for working parents.",
    guidelines: [
      "Joint session with structured mediation by Principal Ma'am.",
      "Constructive goal-setting to prevent familial friction and pressure.",
      "Clear, actionable consensus agreement on college streams and career pathways."
    ],
    prerequisites: [
      "Both parent(s) and student available for the consultation"
    ],
    actionLinkText: "Book Parent-Child Session"
  },
  "exam-blueprints": {
    id: "exam-blueprints",
    icon: "🎯",
    title: "Board & Competitive Exam Blueprints",
    category: "Personalized Counseling Verticals",
    badge: "Academic Strategy",
    description:
      "Strategic syllabus breakdown, chapter weightage matrices, time management schedules, revision calendars, and mock paper benchmarking for CBSE/ICSE Boards and JEE/NEET/CUET.",
    deadlines: "Crucial during July-December preparation cycles.",
    guidelines: [
      "Focus on high-yield chapters based on 10-year question frequency analysis.",
      "Implement the 3-phase revision cycle (Foundation, Speed, Accuracy).",
      "Weekly error-log reviews to convert weaknesses into scoring strengths."
    ],
    prerequisites: [
      "Current school/coaching test syllabus and mock test scorecards"
    ],
    actionLinkText: "Get Custom Study Blueprint"
  },

  // ── SLIDE 3: STUDY ABROAD & GLOBAL ADMISSIONS ──
  "ivy-league": {
    id: "ivy-league",
    icon: "🏛️",
    title: "Ivy League & Top 100 University Shortlisting",
    category: "Study Abroad & Global Admissions",
    badge: "Global Universities",
    description:
      "Data-driven university selection across USA, UK, Canada, Europe, Australia, and Singapore categorized into Dream, Target, and Safety tiers based on GPA, standardized test scores, and research profile.",
    deadlines: "Early Action / Early Decision: Nov 1; Regular Decision: Jan 1–15; UK UCAS: Jan 31.",
    guidelines: [
      "Balanced shortlisting prevents rejection risk while targeting tier-1 global institutions.",
      "Evaluate curriculum STEM designations for post-study work visa opportunities.",
      "Review campus safety, departmental faculty citations, and living costs."
    ],
    prerequisites: [
      "Transcripts of Class 9th, 10th, 11th, and 12th predicted scores",
      "Standardized test scores (SAT/ACT/IELTS/TOEFL) or tentative test dates",
      "List of extracurricular activities, Olympiads, and leadership roles"
    ],
    actionLinkText: "Get University Shortlist Advisory"
  },
  "sop-evaluation": {
    id: "sop-evaluation",
    icon: "✍️",
    title: "SOP, Essay & Resume Profile Evaluation",
    category: "Study Abroad & Global Admissions",
    badge: "Narrative Crafting",
    description:
      "Comprehensive review and refinement of Statement of Purpose (SOP), Common App essays, supplemental prompts, and academic CVs to showcase authentic passion, resilience, and intellectual curiosity.",
    deadlines: "Final drafts recommended 4–6 weeks prior to application deadlines.",
    guidelines: [
      "Strict zero-plagiarism and human-centric authentic narrative storytelling.",
      "Show, don't just tell: tie personal anecdotes to academic aspirations.",
      "Rigorous tone, grammar, syntax, and institutional alignment scrutiny."
    ],
    prerequisites: [
      "Initial rough draft or bullet-point outline of career motivations",
      "Target universities and specific program course catalogs"
    ],
    actionLinkText: "Submit Essay for Review"
  },
  "scholarship-apps": {
    id: "scholarship-apps",
    icon: "💰",
    title: "Merit & Need-Based Scholarship Applications",
    category: "Study Abroad & Global Admissions",
    badge: "Funding & Grants",
    description:
      "Identification and strategic application for institutional scholarships, global endowments, government grants, and CSS Profile / ISFAA financial aid submissions to reduce international education expenses.",
    deadlines: "Scholarship deadlines are frequently earlier than standard admission dates.",
    guidelines: [
      "Prepare separate scholarship essays emphasizing societal impact and community leadership.",
      "Calculate Expected Family Contribution (EFC) accurately.",
      "Explore tuition fee waivers, assistantships, and on-campus work permits."
    ],
    prerequisites: [
      "Family income tax returns and asset declarations for financial aid forms",
      "Academic honors, certificates, and published research papers"
    ],
    actionLinkText: "Apply for Scholarship Guidance"
  }
};

const STORAGE_KEY_SERVICES = "inspiria_service_details_cache";

/**
 * Fetch a service's details from Firestore or fallback to cache / local default data
 */
export async function getServiceDetail(serviceId: string): Promise<ServiceDetail> {
  const fallback = DEFAULT_SERVICE_DETAILS[serviceId] || {
    id: serviceId,
    icon: "🎯",
    title: serviceId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: "Counseling & Academic Advisory",
    badge: "Official Service Guide",
    description: "Comprehensive advisory program designed to guide students through competitive admissions and academic success.",
    deadlines: "Refer to official examination/admission bulletins for active cycle dates.",
    guidelines: [
      "Ensure all application criteria are verified against official notices.",
      "Maintain active communication with counseling mentors.",
      "Preserve all transaction receipts and verification slips."
    ],
    prerequisites: [
      "Academic marksheets and identity proofs",
      "Candidate portal login credentials"
    ],
    actionLinkText: "Book Guidance for this Service"
  };

  // 1. Check local cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY_SERVICES}_${serviceId}`);
      if (cached) {
        return { ...fallback, ...JSON.parse(cached) };
      }
    } catch {}
  }

  // 2. Fetch fresh from Firestore
  try {
    const snap = await getDoc(doc(db, "service_details", serviceId));
    if (snap.exists()) {
      const data = snap.data() as Partial<ServiceDetail>;
      const merged = { ...fallback, ...data };
      if (typeof window !== "undefined") {
        localStorage.setItem(`${STORAGE_KEY_SERVICES}_${serviceId}`, JSON.stringify(merged));
      }
      return merged;
    }
  } catch {}

  return fallback;
}

/**
 * Update service details in Firestore and cache locally
 */
export async function saveServiceDetail(service: ServiceDetail): Promise<void> {
  // Update localStorage immediately
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_KEY_SERVICES}_${service.id}`, JSON.stringify(service));
    } catch {}
  }

  // Persist to Firestore
  try {
    await setDoc(doc(db, "service_details", service.id), service, { merge: true });
  } catch (err) {
    console.warn("Could not save service detail to Firestore:", err);
  }
}
