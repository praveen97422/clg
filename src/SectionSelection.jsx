import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/SectionSelection.css";
import img1 from "./assets/chain.jpg";
import img2 from "./assets/earring.jpg";
import img3 from "./assets/ring1.jpg";
import img4 from "./assets/img4.jpg";
import img5 from "./assets/kada.jpg";
import img6 from "./assets/braclet.jpg";
import img7 from "./assets/anklet.jpeg";
import img8 from "./assets/collage.jpg";
const jewelryItems = [
  { id: 1, image: img2, name: "EARRINGS", value: "Earrings", description: "Elegant designs for every occasion" },
  { id: 2, image: img3, name: "RINGS", value: "Rings", description: "Timeless pieces that make a statement" },
  { id: 3, image: img4, name: "BRACELETS", value: "Bracelets", description: "Delicate and sophisticated styles" },
  { id: 4, image: img1, name: "NECK PIECES", value: "Neck Pieces", description: "Stunning centerpieces for your look" },
  { id: 5, image: img7, name: "ANKLETS", value: "Anklets", description: "Graceful adornments for your feet" },
  { id: 6, image: img5, name: "KADAS", value: "Kada's", description: "Traditional elegance reimagined" },
  { id: 7, image: img6, name: "HAIR ACCESSORIES", value: "Hair Accessories", description: "Beautiful accents for your hair" },
  { id: 8, image: img8, name: "ALL PRODUCTS", value: "ALL PRODUCTS", description: "Explore our complete collection" },
];

export default function JewelryHexGrid() {
  const navigate = useNavigate();

  const handleClick = (categoryName, id) => {
    if (id === 8) {
      navigate('/All-products');
    } else {
      navigate(`/categories?category=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <section className="jewelry-section">
      <div className="section-header">
        <h2 className="section-title">Everyday Jewellery Inspired by Tradition</h2>
        <p className="section-subtitle">Discover our curated collection of handcrafted pieces</p>
      </div>
      <div className="category-grids">
         {jewelryItems.map((item) =>
          item.id === 8 ? (
            <div
              key={item.id}
              className="category-cards"
              onClick={() => handleClick(item.value, item.id)}
              role="button"
              tabIndex={0}
              aria-label={item.name}
            >
              <div className="category-image">
                <img src={img8} alt="ALL PRODUCTS" className="jewelry-image" />
                <div className="category-overlay">
                  <p className="category-description">Explore our complete collection</p>
                  <button className="explore-button">Explore Collection</button>
                  <h3 className="category-names">ALL PRODUCTS</h3>
                </div>
              </div>
              <h3 className="category-name">ALL PRODUCTS</h3>
            </div>
          ) : (
            <div
              key={item.id}
              className="category-cards"
              onClick={() => handleClick(item.value)}
              role="button"
              tabIndex={0}
              aria-label={item.name}
            >
              <div className="category-image">
                <img src={item.image} alt={item.name} className="jewelry-image" />
                <div className="category-overlay">
                  <p className="category-description">{item.description}</p>
                  <button className="explore-button">Explore Collection</button>
                  <h3 className="category-names">{item.name}</h3>
                </div>
              </div>
              <h3 className="category-name">{item.name}</h3>
            </div>
          )
        )}
      </div>
    </section>
  );
}
