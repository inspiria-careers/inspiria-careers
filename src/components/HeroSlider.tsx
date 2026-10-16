"use client";
import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import ServiceDetailModal from "@/components/ServiceDetailModal";
import { ServiceDetail, getServiceDetail } from "@/services/serviceDetailService";

export default function HeroSlider() {
  const { settings } = useSite();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Service Detail Modal States
  const [activeService, setActiveService] = useState<ServiceDetail | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // Quick Information / Booking Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState("e-Counselling Admissions (IIT / NEET / CUET)");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    classStream: "12th Standard (Medical / Non-Medical / Commerce / Arts)",
    targetExam: "IIT-JEE / NEET / CUET Admissions",
    mode: "Online Video Consultation",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const totalSlides = 3;

  useEffect(() => {
    if (!isPlaying || modalOpen || isServiceModalOpen) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying, modalOpen, isServiceModalOpen]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  // Open Service Detail Modal
  const handleOpenServiceModal = async (serviceId: string) => {
    setIsPlaying(false);
    const detail = await getServiceDetail(serviceId);
    setActiveService(detail);
    setIsServiceModalOpen(true);
  };

  // Open Consultation Booking Modal
  const handleOpenModal = (trackTitle: string) => {
    setIsPlaying(false);
    setSelectedTrack(trackTitle);
    setSubmitted(false);
    setFormError("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSubmitted(false);
    setIsPlaying(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.phone) {
      setFormError("Please enter your name and phone number.");
      return;
    }

    try {
      setSubmitting(true);
      const newMsg = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || "Not Provided",
        category: `${selectedTrack} (${formData.targetExam})`,
        message: `[Inquiry via Portal Slide / Service Modal]\nClass/Stream: ${formData.classStream}\nTarget Exam: ${formData.targetExam}\nPreferred Mode: ${formData.mode}\nNotes: ${formData.message || "None"}`,
        createdAt: new Date().toISOString(),
        read: false,
      };

      try {
        await addDoc(collection(db, "contact_requests"), newMsg);
      } catch {}

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("insersia_contact_messages") || "[]");
        localStorage.setItem("insersia_contact_messages", JSON.stringify([newMsg, ...existing]));
      }

      setSubmitted(true);
    } catch {
      setFormError("Failed to submit request. Please reach out directly on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hello Inspiria Careers, I submitted details for: ${selectedTrack}. My Name: ${formData.name || ""}`
      )}`
    : `https://wa.me/919876543210?text=${encodeURIComponent(
        `Hello Inspiria Careers, I submitted details for counseling.`
      )}`;

  return (
    <div className="gov-slider-wrapper">
      <div className="gov-slider-container">
        {/* SLIDE 1: EXACT e-COUNSELLING PORTAL INFOGRAPHIC */}
        <div className={`gov-slide ${currentSlide === 0 ? "active" : ""}`}>
          <div
            className="gov-slide-content"
            onClick={() => handleOpenModal("e-Counselling Admissions (IIT / NEET / CUET)")}
            style={{ cursor: "pointer" }}
            title="Click slide to fill details & get counseling"
          >
            {/* Left Column: Examination Management Services */}
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide1LeftTitle || "Examination Management Services"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("exam-provisioning");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">
                    Examination Provisioning, Registration &amp; Fee Payment
                  </div>
                  <div className="flow-icon flow-pink">🪙</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("data-correction");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Data Correction and Verification</div>
                  <div className="flow-icon flow-blue">✅</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("admit-card");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">E-Admit Card &amp; Schedule</div>
                  <div className="flow-icon flow-orange">📇</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("results-pub");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Answer Key / Results Publication</div>
                  <div className="flow-icon flow-brown">📑</div>
                </div>
              </div>
            </div>

            {/* Center Column: e-Counselling Emblem & Value Pillars */}
            <div className="gov-slide-center">
              <div className="center-brand">
                <div className="brand-logo-badge">
                  <span className="logo-script-e">e</span>
                </div>
                <div className="brand-title-wrap">
                  <h2 className="brand-name">
                    {settings.siteName.split(" ")[0]} e-Counselling Services
                  </h2>
                  <div className="brand-tagline">{settings.slide1CenterTagline || "SIMPLIFYING THE ADMISSION PROCESS"}</div>
                </div>
              </div>

              {/* Student Avatar Illustration */}
              <div className="student-center-avatar">
                <div className="avatar-circle">
                  <span style={{ fontSize: "3.5rem" }}>👨‍🎓</span>
                </div>
              </div>

              {/* Value Badges */}
              <div className="value-pills-row">
                <div className="value-pill">
                  <span className="pill-arrow up">↑</span>
                  <div className="pill-text">
                    <strong>Maximized transparency,</strong> efficiency &amp; credibility.
                  </div>
                </div>
                <div className="value-pill">
                  <span className="pill-arrow down">↓</span>
                  <div className="pill-text">
                    <strong>Minimized cost,</strong> time, human involvements &amp; anxiety.
                  </div>
                </div>
              </div>

              <p className="catering-text">
                {settings.slide1CateringText || "Catering to Examinations and Admissions in IIT's, NIT's, IIIT's, Medical (NEET), CUET, Board Streams and many others"}
              </p>

              {/* Interactive CTA to Fill Information */}
              <div style={{ marginTop: "0.85rem", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("e-Counselling Admissions (IIT / NEET / CUET)");
                  }}
                  className="btn btn-gold btn-sm"
                  style={{
                    padding: "0.6rem 1.35rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    borderRadius: 30,
                    boxShadow: "0 4px 15px rgba(255,204,0,0.35)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  📝 Click to Fill Details &amp; Get Guidance →
                </button>
              </div>
            </div>

            {/* Right Column: Counselling & Admission Services */}
            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide1RightTitle || "Counselling & Admission Services"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("seat-matrix");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-icon flow-teal">🏛️</div>
                  <div className="flow-text">Seat Matrix Management</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("institute-selection");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-icon flow-orange">💻</div>
                  <div className="flow-text">
                    Institute &amp; Course Selection / Multiple Round Seat Allotment
                  </div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("allotment-letter");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-icon flow-purple">✉️</div>
                  <div className="flow-text">Admission &amp; Allotment Letter</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("doc-verification");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-icon flow-green">📂</div>
                  <div className="flow-text">
                    Online Document Verification &amp; Institute Admission
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: 1-ON-1 GUIDANCE WITH PRINCIPAL MA'AM */}
        <div className={`gov-slide ${currentSlide === 1 ? "active" : ""}`}>
          <div
            className="gov-slide-content"
            onClick={() => handleOpenModal("1-on-1 Guidance with Principal Ma'am")}
            style={{ cursor: "pointer" }}
            title="Click slide to fill details & book 1-on-1 guidance"
          >
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide2LeftTitle || "Personalized Counseling Verticals"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("psychometric-testing");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Scientific Psychometric &amp; Stream Testing</div>
                  <div className="flow-icon flow-blue">🧠</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("anxiety-relief");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Adolescent Psychology &amp; Exam Anxiety Relief</div>
                  <div className="flow-icon flow-pink">🌿</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("parent-harmony");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Parent-Child Communication Harmony</div>
                  <div className="flow-icon flow-orange">👨‍👩‍👧</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("exam-blueprints");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Board &amp; Competitive Exam Blueprints</div>
                  <div className="flow-icon flow-green">🎯</div>
                </div>
              </div>
            </div>

            <div className="gov-slide-center">
              <div className="center-brand">
                <div className="brand-logo-badge" style={{ background: "#009ea9" }}>
                  <span style={{ fontSize: "1.75rem" }}>👩‍🏫</span>
                </div>
                <div className="brand-title-wrap">
                  <h2 className="brand-name">{settings.principalName}</h2>
                  <div className="brand-tagline">
                    {settings.slide2CenterTagline || settings.principalDesignation?.toUpperCase() || "SENIOR EDUCATIONAL & CAREER COUNSELOR"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: 110,
                  height: 140,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "3px solid #ffcc00",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
                  margin: "0.75rem auto",
                  background: "#0c1b3a",
                }}
              >
                <img
                  src={settings.principalPhoto || "/logo.jpg"}
                  alt={settings.principalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div className="value-pills-row">
                <div className="value-pill">
                  <span className="pill-arrow up">★</span>
                  <div className="pill-text">
                    <strong>{settings.yearsExperience} Experience</strong> in holistic student counseling.
                  </div>
                </div>
                <div className="value-pill">
                  <span className="pill-arrow up">★</span>
                  <div className="pill-text">
                    <strong>{settings.studentsGuided} Students</strong> guided towards life clarity.
                  </div>
                </div>
              </div>

              <p className="catering-text">
                {settings.slide2CateringText || "Personalized 1-on-1 offline & online video consultation designed to convert stress into triumph."}
              </p>

              {/* Interactive CTA */}
              <div style={{ marginTop: "0.85rem", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("1-on-1 Guidance with Principal Ma'am");
                  }}
                  className="btn btn-gold btn-sm"
                  style={{
                    padding: "0.6rem 1.35rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    borderRadius: 30,
                    boxShadow: "0 4px 15px rgba(255,204,0,0.35)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  👩‍🏫 Book 1-on-1 Session with Principal Ma&apos;am →
                </button>
              </div>
            </div>

            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide2RightTitle || "Direct Student Solutions"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Real-time Slot Booking & Calendar Schedule");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-teal">📅</div>
                  <div className="flow-text">Real-time Slot Booking &amp; Calendar Schedule</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Personalized Aptitude & Career Roadmap Report");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-purple">📑</div>
                  <div className="flow-text">Personalized Aptitude &amp; Career Roadmap Report</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Direct UPI / QR Gateway & Instant Confirmation");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-orange">💳</div>
                  <div className="flow-text">Direct UPI / QR Gateway &amp; Instant Confirmation</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Direct Post-Session WhatsApp Followup Support");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-green">💬</div>
                  <div className="flow-text">Direct Post-Session WhatsApp Followup Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 3: GLOBAL ADMISSIONS & STUDY ABROAD */}
        <div className={`gov-slide ${currentSlide === 2 ? "active" : ""}`}>
          <div
            className="gov-slide-content"
            onClick={() => handleOpenModal("Study Abroad & Global Admissions")}
            style={{ cursor: "pointer" }}
            title="Click slide to fill details & apply for study abroad"
          >
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide3LeftTitle || "Study Abroad & Global Admissions"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("ivy-league");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Ivy League &amp; Top 100 University Shortlisting</div>
                  <div className="flow-icon flow-blue">🏛️</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("sop-evaluation");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">SOP, Essay &amp; Resume Profile Evaluation</div>
                  <div className="flow-icon flow-pink">✍️</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("exam-blueprints");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">SAT, GRE, GMAT &amp; IELTS Strategy</div>
                  <div className="flow-icon flow-orange">📚</div>
                </div>
                <div
                  className="flow-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenServiceModal("scholarship-apps");
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view details, guidelines & prerequisites"
                >
                  <div className="flow-text">Merit &amp; Need-Based Scholarship Applications</div>
                  <div className="flow-icon flow-green">💰</div>
                </div>
              </div>
            </div>

            <div className="gov-slide-center">
              <div className="center-brand">
                <div className="brand-logo-badge" style={{ background: "#2ecc71" }}>
                  <span style={{ fontSize: "1.75rem" }}>🌏</span>
                </div>
                <div className="brand-title-wrap">
                  <h2 className="brand-name">Global Admissions Advisory</h2>
                  <div className="brand-tagline">{settings.slide3CenterTagline || "YOUR PASSPORT TO WORLD-CLASS EDUCATION"}</div>
                </div>
              </div>

              <div className="student-center-avatar">
                <div className="avatar-circle" style={{ background: "rgba(0,162,185,0.2)" }}>
                  <span style={{ fontSize: "3.5rem" }}>✈️</span>
                </div>
              </div>

              <div className="value-pills-row">
                <div className="value-pill">
                  <span className="pill-arrow up">↑</span>
                  <div className="pill-text">
                    <strong>98.4% Visa &amp; Admission Success</strong> across 12+ countries.
                  </div>
                </div>
                <div className="value-pill">
                  <span className="pill-arrow up">↑</span>
                  <div className="pill-text">
                    <strong>₹4.5+ Cr Scholarships</strong> secured for aspiring scholars.
                  </div>
                </div>
              </div>

              <p className="catering-text">
                {settings.slide3CateringText || "USA · UK · Canada · Australia · Germany · Singapore · Ireland · Central European Universities"}
              </p>

              {/* Interactive CTA */}
              <div style={{ marginTop: "0.85rem", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Study Abroad & Global Admissions");
                  }}
                  className="btn btn-gold btn-sm"
                  style={{
                    padding: "0.6rem 1.35rem",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    borderRadius: 30,
                    boxShadow: "0 4px 15px rgba(255,204,0,0.35)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  🌏 Fill Global Admission Details &amp; Apply →
                </button>
              </div>
            </div>

            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide3RightTitle || "End-To-End Global Support"}</h3>
              <div className="flow-items">
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Letter of Recommendation (LOR) Structuring");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-teal">📄</div>
                  <div className="flow-text">Letter of Recommendation (LOR) Structuring</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Embassy & Visa Mock Interview Training");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-purple">🎙️</div>
                  <div className="flow-text">Embassy &amp; Visa Mock Interview Training</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Pre-Departure Briefing & Campus Settlement");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-orange">🏫</div>
                  <div className="flow-text">Pre-Departure Briefing &amp; Campus Settlement</div>
                </div>
                <div
                  className="flow-item right-aligned"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal("Global Alumni Network Mentorship Access");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flow-icon flow-green">🤝</div>
                  <div className="flow-text">Global Alumni Network Mentorship Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS: PREV, NEXT, PLAY/PAUSE, DOTS */}
        <button
          className="gov-slider-btn prev"
          onClick={handlePrev}
          aria-label="Previous Slide"
        >
          ‹
        </button>

        <button
          className="gov-slider-btn next"
          onClick={handleNext}
          aria-label="Next Slide"
        >
          ›
        </button>

        {/* Play/Pause Button on Bottom Left */}
        <button
          className="gov-slider-playpause"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause Slider" : "Play Slider"}
          title={isPlaying ? "Pause Automatic Slides" : "Resume Automatic Slides"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        {/* Indicator Dots */}
        <div className="gov-slider-dots">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              className={`gov-dot ${currentSlide === idx ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── MODAL 1: INTERACTIVE SERVICE DETAIL MODAL (WITH IN-MODAL ADMIN/PRINCIPAL MAM EDITING) ── */}
      <ServiceDetailModal
        isOpen={isServiceModalOpen}
        service={activeService}
        onClose={() => {
          setIsServiceModalOpen(false);
          setIsPlaying(true);
        }}
        onBookGuidance={(service) => {
          setIsServiceModalOpen(false);
          handleOpenModal(service.title);
        }}
        onServiceUpdated={(updated) => {
          setActiveService(updated);
        }}
      />

      {/* ── MODAL 2: REGISTRATION & CONSULTATION INQUIRY MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,14,35,0.75)",
            backdropFilter: "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            overflowY: "auto",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: 16,
              maxWidth: "520px",
              width: "100%",
              padding: "1.75rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Icon */}
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                right: "1rem",
                top: "1rem",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: "1rem",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {submitted ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "0.75rem" }}>🎉</span>
                <h3 style={{ fontSize: "1.4rem", color: "#002147", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
                  Application &amp; Details Received!
                </h3>
                <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                  Thank you, <strong>{formData.name}</strong>. Our counseling advisory cell has registered your details for <strong>{selectedTrack}</strong>. A senior counselor will connect with you shortly.
                </p>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#22c55e",
                      color: "#ffffff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    💬 Connect on WhatsApp Now
                  </a>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      padding: "0.75rem 1.25rem",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>📝</span>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#002147", fontWeight: 700 }}>
                    Counseling &amp; Admission Inquiry
                  </h3>
                </div>
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 1rem 0" }}>
                  Selected Track: <strong style={{ color: "#009ea9" }}>{selectedTrack}</strong>
                </p>

                {formError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: 8, padding: "0.6rem 0.8rem", color: "#b91c1c", fontSize: "0.85rem", marginBottom: "0.85rem" }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                    Candidate / Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: 6,
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#0f172a",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.75rem",
                        borderRadius: 6,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.75rem",
                        borderRadius: 6,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      Current Class / Stream
                    </label>
                    <select
                      value={formData.classStream}
                      onChange={(e) => setFormData({ ...formData, classStream: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.5rem",
                        borderRadius: 6,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.82rem",
                        color: "#0f172a",
                        background: "#ffffff",
                      }}
                    >
                      <option>Class 9th - 10th Foundation</option>
                      <option>11th Standard (PCM / PCB / Commerce / Arts)</option>
                      <option>12th Standard (Medical / Non-Medical / Commerce / Arts)</option>
                      <option>12th Pass / Dropper Year</option>
                      <option>Undergraduate College Student</option>
                      <option>Graduate / Working Professional</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      Target Goal / Exam
                    </label>
                    <select
                      value={formData.targetExam}
                      onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.5rem",
                        borderRadius: 6,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.82rem",
                        color: "#0f172a",
                        background: "#ffffff",
                      }}
                    >
                      <option>IIT-JEE / Engineering Admissions</option>
                      <option>NEET / Medical &amp; Dental Admissions</option>
                      <option>CUET / Top Central Universities</option>
                      <option>Study Abroad &amp; Global Scholarships</option>
                      <option>Stream Selection &amp; Aptitude Testing</option>
                      <option>Adolescent Anxiety &amp; Motivation Guidance</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                    Preferred Consultation Mode
                  </label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={formData.mode === "Online Video Consultation"}
                        onChange={() => setFormData({ ...formData, mode: "Online Video Consultation" })}
                      />
                      💻 Online Video Call
                    </label>
                    <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={formData.mode === "Offline Center Session"}
                        onChange={() => setFormData({ ...formData, mode: "Offline Center Session" })}
                      />
                      🏛️ Offline Center Session
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                    Any Specific Questions / Requirement
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Need assistance with choice filling for NEET / JEE, or scholarship applications..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 6,
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.85rem",
                      color: "#0f172a",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: 8,
                    border: "none",
                    background: "#002147",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,33,71,0.25)",
                  }}
                >
                  {submitting ? "Submitting Application..." : "Submit Details & Book Guidance →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
