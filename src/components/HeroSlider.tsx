"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

export default function HeroSlider() {
  const { settings } = useSite();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const totalSlides = 3;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="gov-slider-wrapper">
      <div className="gov-slider-container">
        {/* SLIDE 1: EXACT e-COUNSELLING PORTAL INFOGRAPHIC */}
        <div className={`gov-slide ${currentSlide === 0 ? "active" : ""}`}>
          <div className="gov-slide-content">
            {/* Left Column: Examination Management Services */}
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide1LeftTitle || "Examination Management Services"}</h3>
              <div className="flow-items">
                <div className="flow-item">
                  <div className="flow-text">
                    Examination Provisioning, Registration &amp; Fee Payment
                  </div>
                  <div className="flow-icon flow-pink">🪙</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">Data Correction and Verification</div>
                  <div className="flow-icon flow-blue">✅</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">E-Admit Card &amp; Schedule</div>
                  <div className="flow-icon flow-orange">📇</div>
                </div>
                <div className="flow-item">
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
            </div>

            {/* Right Column: Counselling & Admission Services */}
            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide1RightTitle || "Counselling & Admission Services"}</h3>
              <div className="flow-items">
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-teal">🏛️</div>
                  <div className="flow-text">Seat Matrix Management</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-orange">💻</div>
                  <div className="flow-text">
                    Institute &amp; Course Selection / Multiple Round Seat Allotment
                  </div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-purple">✉️</div>
                  <div className="flow-text">Admission &amp; Allotment Letter</div>
                </div>
                <div className="flow-item right-aligned">
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
          <div className="gov-slide-content">
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide2LeftTitle || "Personalized Counseling Verticals"}</h3>
              <div className="flow-items">
                <div className="flow-item">
                  <div className="flow-text">Scientific Psychometric &amp; Stream Testing</div>
                  <div className="flow-icon flow-blue">🧠</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">Adolescent Psychology &amp; Exam Anxiety Relief</div>
                  <div className="flow-icon flow-pink">🌿</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">Parent-Child Communication Harmony</div>
                  <div className="flow-icon flow-orange">👨‍👩‍👧</div>
                </div>
                <div className="flow-item">
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
            </div>

            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide2RightTitle || "Direct Student Solutions"}</h3>
              <div className="flow-items">
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-teal">📅</div>
                  <div className="flow-text">Real-time Slot Booking &amp; Calendar Schedule</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-purple">📑</div>
                  <div className="flow-text">Personalized Aptitude &amp; Career Roadmap Report</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-orange">💳</div>
                  <div className="flow-text">Direct UPI / QR Gateway &amp; Instant Confirmation</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-green">💬</div>
                  <div className="flow-text">Direct Post-Session WhatsApp Followup Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 3: GLOBAL ADMISSIONS & STUDY ABROAD */}
        <div className={`gov-slide ${currentSlide === 2 ? "active" : ""}`}>
          <div className="gov-slide-content">
            <div className="gov-slide-branch left">
              <h3 className="branch-title">{settings.slide3LeftTitle || "Study Abroad & Global Admissions"}</h3>
              <div className="flow-items">
                <div className="flow-item">
                  <div className="flow-text">Ivy League &amp; Top 100 University Shortlisting</div>
                  <div className="flow-icon flow-blue">🏛️</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">SOP, Essay &amp; Resume Profile Evaluation</div>
                  <div className="flow-icon flow-pink">✍️</div>
                </div>
                <div className="flow-item">
                  <div className="flow-text">SAT, GRE, GMAT &amp; IELTS Strategy</div>
                  <div className="flow-icon flow-orange">📚</div>
                </div>
                <div className="flow-item">
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
            </div>

            <div className="gov-slide-branch right">
              <h3 className="branch-title">{settings.slide3RightTitle || "End-To-End Global Support"}</h3>
              <div className="flow-items">
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-teal">📄</div>
                  <div className="flow-text">Letter of Recommendation (LOR) Structuring</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-purple">🎙️</div>
                  <div className="flow-text">Embassy &amp; Visa Mock Interview Training</div>
                </div>
                <div className="flow-item right-aligned">
                  <div className="flow-icon flow-orange">🏫</div>
                  <div className="flow-text">Pre-Departure Briefing &amp; Campus Settlement</div>
                </div>
                <div className="flow-item right-aligned">
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

        {/* Play/Pause Button on Bottom Left (matches screenshot) */}
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
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
