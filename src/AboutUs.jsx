import React from 'react';
import './styles/AboutUs.css';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="about-page-wrapper">
      <div className="about-hero-banner">
        <h1 className="about-main-title">Havya Jewelry – Where Heritage Meets the Heartbeat of Today</h1>
      </div>

      <div className="about-content-wrapper">
        <section className="about-content-card">
          <h2 className="about-card-title">The Essence of Havya</h2>
          <p className="about-card-text">At Havya Jewelry, we believe that jewelry is not just something you wear—it's something you feel. It's a reflection of who you are, where you come from, and the beauty you carry within. Havya blends the soulful charm of Indian tradition with the ease and edge of modern fashion—making every piece a graceful bridge between the past and the present.</p>
          <p className="about-card-text">Our collections are curated with deep intention: to bring you jewelry that's stylish, skin-friendly, and affordable—crafted to embrace every mood, every moment, and every woman.</p>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">Our Story – Born from Simplicity, Grown with Purpose</h2>
          <p className="about-card-text">Havya was born not in a boardroom, but in a moment of curiosity and quiet ambition. As a student, I saw something many of us feel but rarely voice—the desire to look and feel confident without spending a fortune. Friends and classmates would admire jewelry, hesitate, and walk away because it was too expensive, too harsh on the skin, or too far from their style.</p>
          <p className="about-card-text">That's when it began—just a few pieces, sold to students at pocket-friendly prices, chosen with care. And those few pieces? They sparked something bigger than expected. Compliments turned into conversations. Conversations turned into orders. A quiet idea began to blossom.</p>
          <p className="about-card-text">With zero pretense and a lot of heart, Havya Jewelry officially came to life in October 2024. Since then, we've grown into a trusted small business, serving customers across India, hosting over 15+ offline stalls, and fulfilling over 100 orders with love, consistency, and style.</p>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">What Makes Havya Different</h2>
          <p className="about-card-text">We are proud resellers of handpicked jewelry from trusted Indian markets like Delhi, Kolkata and Bangaluru. Our bestsellers include anti-tarnish stainless steel jewelry with rhodium plating—gentle on skin, long-lasting in shine, and resistant to allergies that many women face with artificial jewelry.</p>
          <p className="about-card-text">Alongside these, we offer silver oxidized, gold-plated, and everyday minimal pieces that elevate your style without elevating your budget. Our collections blend Indian aesthetics with contemporary elegance—carefully selected to match every outfit, occasion, and personality.</p>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">Our Vision & Values</h2>
          <p className="about-card-text">Our vision is simple yet powerful: To make Havya a household name. We want every woman to feel seen, celebrated, and beautiful in her own skin—with jewelry that expresses her story.</p>
          <p className="about-card-text">Our mission is to deliver quality and elegance at prices that don't compromise. Every piece is chosen with love and offered with honesty.</p>
          <ul className="about-values-grid">
            <li className="about-value-item">✨ Quality over quantity</li>
            <li className="about-value-item">🎨 Tradition with a modern twist</li>
            <li className="about-value-item">💎 Style that's affordable and skin-safe</li>
            <li className="about-value-item">👑 Celebrating womanhood, identity, and individuality</li>
          </ul>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">Who We Serve</h2>
          <p className="about-card-text">Our jewelry speaks to college students, young professionals, working women, and everyday stylists. We also offer timeless pieces for elderly women, all designed to suit the Indian skin tone and spirit. Whether you're dressing up for work, festivals, or just your daily glow-up—Havya is for you.</p>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">Where We're From & Where We Deliver</h2>
          <p className="about-card-text">We proudly operate from Bangalore, and currently deliver across India using our reliable logistics partner, Shiprocket.</p>
          <div className="about-delivery-box">
            <p className="about-delivery-text">🚚 Bangalore deliveries: 2–3 days</p>
            <p className="about-delivery-text">📦 Pan-India deliveries: Typically within 2–7 days, up to 21 in rare cases</p>
          </div>
        </section>

        <section className="about-content-card">
          <h2 className="about-card-title">The Journey Ahead</h2>
          <p className="about-card-text">From a spark of curiosity to a growing community of loyal customers, Havya has been a journey of connection, creativity, and courage. And this is just the beginning.</p>
          <p className="about-card-text">We're here to help you not just wear jewelry—but wear confidence, heritage, and happiness.</p>
          <div className="about-cta-wrapper">
            <Link to="/" className="about-cta-button">Explore Our Collection</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs; 