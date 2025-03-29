import React from "react";
import "./styles/ImageSlider.css";
import img1 from "./assets/img1.jpg";
import img2 from "./assets/img4.jpg";
import img3 from "./assets/img5.jpg";

export default function ImageSlider() {
  return (
    <div className="image-slider">
      <img src={img1} alt="Jewelry 1" className="slider-image" />
      <img src={img2} alt="Jewelry 2" className="slider-image" />
      <img src={img3} alt="Jewelry 3" className="slider-image" />
    </div>
  );
}
