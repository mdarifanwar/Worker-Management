import React from "react";

const About = () => (
  <div style={{ maxWidth: 700, margin: "3rem auto", background: "#fff", borderRadius: 20, boxShadow: "0 8px 32px rgba(37,99,235,0.08)", padding: "2.5rem 2rem", fontFamily: 'Inter, Segoe UI, Arial, sans-serif', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
    <h1 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#2563eb", marginBottom: "1.2rem", letterSpacing: "-1px", textAlign: 'center' }}>
      About Worker Management App
    </h1>
    <p style={{ fontSize: "1.15rem", color: "#222", marginBottom: "2rem", lineHeight: 1.7, textAlign: 'center' }}>
      <span style={{ fontWeight: 600, color: '#2563eb' }}>Worker Management App</span> is a complete and professional solution designed to help organizations manage their workforce with ease and accuracy. It simplifies tracking worker details, attendance, performance, and payments — all in one place. With a secure authentication system and an intuitive dashboard, it ensures smooth daily operations and transparent reporting.
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "2.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", color: "#2563eb", fontWeight: 700, marginBottom: 12 }}>Key Features</h2>
        <ul style={{ paddingLeft: 20, color: "#444", fontSize: "1.05rem", marginBottom: 0, lineHeight: 1.7 }}>
          <li>Maintain detailed worker profiles and work history</li>
          <li>Track attendance and performance efficiently</li>
          <li>Generate insightful performance and payment reports</li>
          <li>Access a clean, user-friendly dashboard and forms</li>
          <li>Ensure data security with reliable login and management systems</li>
        </ul>
        <h2 style={{ fontSize: "1.15rem", color: "#2563eb", fontWeight: 700, margin: "22px 0 12px" }}>Future Enhancements</h2>
        <ul style={{ paddingLeft: 20, color: "#444", fontSize: "1.05rem", marginBottom: 0, lineHeight: 1.7 }}>
          <li>Real-time analytics dashboard</li>
          <li>Payroll integration</li>
          <li>Mobile app support</li>
          <li>Multi-role access control</li>
        </ul>
      </div>
      <div>
        <h2 style={{ fontSize: "1.15rem", color: "#2563eb", fontWeight: 700, margin: "22px 0 12px" }}>Use Cases / Target Audience</h2>
        <ul style={{ paddingLeft: 20, color: "#444", fontSize: "1.05rem", marginBottom: 0, lineHeight: 1.7 }}>
          <li>Construction companies</li>
          <li>Manufacturing units</li>
          <li>Service agencies</li>
          <li>Any organization managing a workforce</li>
        </ul>
        <h2 style={{ fontSize: "1.15rem", color: "#2563eb", fontWeight: 700, margin: "22px 0 12px" }}>Unique Selling Point (USP)</h2>
        <ul style={{ paddingLeft: 20, color: "#444", fontSize: "1.05rem", marginBottom: 0, lineHeight: 1.7 }}>
          <li>Lightweight design for fast performance</li>
          <li>Real-time sync across devices</li>
          <li>Easy customization for different industries</li>
        </ul>
      </div>
    </div>
    <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
      <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "1.1rem" }}>Contact:</span>
      <span style={{ color: "#333", fontSize: "1.08rem", marginLeft: 8 }}>
        For any enquiry, email <a href="mailto:employeeinfo45@gmail.com" style={{ color: "#2563eb", textDecoration: "underline" }}>employeeinfo45@gmail.com</a>
      </span>
    </div>
  </div>
);

export default About;
