import React from "react";
import "./styles/SectionSelection.css";
import img1 from "./assets/img1.jpg"; // Replace with actual images
import img2 from "./assets/img5.jpg";
import img3 from "./assets/img3.jpg";
import img4 from "./assets/img4.jpg";

const jewelryItems = [
//   { id: 1, image: img1, name: "MANGALSUTRA" },
  { id: 2, image: img2, name: "NECKLACES" },
  { id: 3, image: img3, name: "RINGS" },
  { id: 4, image: img4, name: "BRACELETS" },
];

export default function JewelryCards() {
  return (
    <div className="jewelry-section">
      <h2 className="section-title">Everyday Demi-fine Jewellery</h2>
      <div className="card-container">
        {jewelryItems.map((item) => (
          <div className="jewelry-card" key={item.id}>
            <div className="image-wrapper">
              <img src={item.image} alt={item.name} className="jewelry-image" />
            </div>
            <p className="jewelry-name">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
