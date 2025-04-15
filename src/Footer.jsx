import React from "react";
import "./styles/footer.css";

const footerData = {
  contact: {
    address:
      "Office No 501/502/503/504/505(A) 5th Floor, Verdant 84, Plot 1, Lane Z, Koregaon Park Annexe, Mundhwa, Pune, Maharashtra 411036.",
    phone: "9055156911",
    time: "Bandhavya",
    email: "Havya@gmail.com",
  },
  sections: {
    Help: [
      "FAQ's",
      "Shipping & Handling",
      "Return & Exchange",
      "Warranty Policy",
      "Refund Policy",
      "Contact Us",
      "Terms of Service",
      "Privacy Policy",
      "Request for Return / Exchange",
    ],
    "About Us": ["About Us", "Blogs", "Contact Us", "Stores & Services"],
  },
  socialIcons: ["facebook", "instagram", "linkedin"],
  payments: ["google-pay", "mastercard", "paypal", "visa"],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="subscribe">
          <h3>Subscribe and follow us for more</h3> 
          <div className="email-box">
            <input type="email" placeholder="Your email address" />
            <button>📧</button>
          </div>
          <p>📍 {footerData.contact.address}</p>
          <p>📞 {footerData.contact.phone} <br /> ({footerData.contact.time})</p>
          <p>✉️ {footerData.contact.email}</p>
        </div>

        {Object.entries(footerData.sections).map(([title, links], i) => (
          <div key={i} className="footer-column">
            <h4>{title}</h4>
            <ul>
              {links.map((link, j) => (
                <li key={j}>{link}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="social-icons">
          {footerData.socialIcons.map((icon, i) => (
            <span key={i}>{icon}</span>
          ))}
        </div>
        <p>All Rights Reserved © Havya</p>
        <div className="payments">
          {footerData.payments.map((method, i) => (
            <span key={i}>{method}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

