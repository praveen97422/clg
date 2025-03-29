import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/ProductManager.css";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ image: null, name: "", price: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/products");
      setProducts(res.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProduct({ ...newProduct, image: file });
    }
  };

  const addProduct = async () => {
    if (!newProduct.image || !newProduct.name || !newProduct.price) {
      alert("Please enter all fields and select an image.");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("image", newProduct.image);
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setProducts([...products, response.data.product]);
      setNewProduct({ image: null, name: "", price: "" });
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error.response?.data?.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    const imageUrl = `http://localhost:5000${products.find(product => product._id === id).imageUrl}`;
    localStorage.removeItem(imageUrl);

    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/delete/${id}`);
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="product-container">
      <h2 className="section-title">Product Management</h2>
      
      <div className="admin-panel">
        <input type="file" onChange={handleFileUpload} />
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="price"
          placeholder="Enter price"
          value={newProduct.price}
          onChange={handleInputChange}
        />
        <button onClick={addProduct} disabled={loading}>{loading ? "Uploading..." : "Add Product"}</button>
      </div>

      <div className="product-list">
        {products.length === 0 ? <p>No products available.</p> : products.map((product) => (
          <div className="product-card" key={product._id}>
            <img src={`http://localhost:5000${product.imageUrl}`} alt="Product" className="product-image" />
            <p className="product-name">{product.name}</p>
            <p className="product-price">₹ {product.price}</p>
            <button className="delete-btn" onClick={() => deleteProduct(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
