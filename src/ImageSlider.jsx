import React, { useState, useEffect } from "react";
import "./styles/ImageSlider.css";
import img1 from "./assets/clg (2).jpg";
import img2 from "./assets/ring1.jpg";
import img3 from "./assets/clg (1).jpg";
import img4 from "./assets/clg (3).jpg";
import img5 from "./assets/chain.jpg";
import img6 from "./assets/clg (6).jpg";

const images = [
  {
    url: img1,
    title: "Exquisite Collection",
    description: "Discover our handcrafted jewelry pieces"
  },
  {
    url: img2,
    title: "Timeless Elegance",
    description: "Fine jewelry for every occasion"
  },
  {
    url: img3,
    title: "Artisanal Craftsmanship",
    description: "Unique designs that tell your story"
  },
  {
    url: img4,
    title: "Premium Quality",
    description: "Crafted with precision and care"
  },
  // {
  //   url: img5,
  //   title: "Modern Classics",
  //   description: "Contemporary designs with traditional charm"
  // },
  {
    url: img6,
    title: "Luxury Redefined",
    description: "Indulge in our exclusive jewelry collection"
  },
  
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function to go to the previous image
  const prevImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Function to go to the next image
  const nextImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Auto change image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="image-slider">
      <button className="nav-button left" onClick={prevImage} aria-label="Previous Image">
        &#10094;
      </button>
      <div className="image-container">
        {images.map((img, index) => (
          <div
            key={index}
            className={`slide ${index === currentIndex ? "active" : ""}`}
          >
            <img
              src={img.url}
              alt={`Jewelry ${index + 1}`}
              className="slider-image"
            />
            <div className="slide-content">
              <h2 className="slide-title">{img.title}</h2>
              <p className="slide-description">{img.description}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="nav-button right" onClick={nextImage} aria-label="Next Image">
        &#10095;
      </button>
      <div className="slider-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
