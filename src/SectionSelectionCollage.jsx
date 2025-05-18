import React from "react";
import img1 from "./assets/chain.jpg";
import img2 from "./assets/earring.jpg";
import img3 from "./assets/ring1.jpg";
import img4 from "./assets/img4.jpg";
import img5 from "./assets/kada.jpg";
import img6 from "./assets/braclet.jpg";
import img7 from "./assets/anklet.jpeg";
import img8 from "./assets/img4.jpg";
import "./styles/SectionSelection.css";

const images = [img1, img2, img3, img4, img5, img6];

export default function SectionSelectionCollage() {
  return (
    <div className="collage-grid" aria-label="Collage of jewelry images">
      {images.map((image, index) => (
        <div key={index} className="collage-image">
          <img src={image} alt={`Jewelry collage item ${index + 1}`} className="collage-image" />
        </div>
      ))}
    </div>
  );
}
