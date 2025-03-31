import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/ProductManager.css";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    image: null,
    name: "",
    price: "",
    mrp: "",
    discount: "",
    category: "",
    stock: ""
  });
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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

  const addOrUpdateProduct = async () => {
    if (!newProduct.image || !newProduct.name || !newProduct.price || !newProduct.mrp || !newProduct.discount || !newProduct.category || !newProduct.stock) {
      alert("Please enter all fields and select an image.");
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append("image", newProduct.image);
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("mrp", newProduct.mrp);
    formData.append("discount", newProduct.discount);
    formData.append("category", newProduct.category);
    formData.append("stock", newProduct.stock);

    try {
      const response = editingProduct ? 
        await axios.put(`http://localhost:5000/update/${editingProduct._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }) :
        await axios.post("http://localhost:5000/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      
      fetchProducts();
      setNewProduct({ image: null, name: "", price: "", mrp: "", discount: "", category: "", stock: "" });
      setEditingProduct(null);
    } catch (error) {
      console.error("Error adding/updating product:", error);
      alert(error.response?.data?.message || "Failed to add/update product.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/delete/${id}`);
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  const editProduct = (product) => {
    setNewProduct({
      image: null,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      category: product.category,
      stock: product.stock
    });
    setEditingProduct(product);
  };

  return (
    <div className="product-container">
      <h2 className="section-title">Product Management</h2>
      
      <div className="admin-panel">
        <input type="file" onChange={handleFileUpload} />
        <input type="text" name="name" placeholder="Product Name" value={newProduct.name} onChange={handleInputChange} />
        <input type="text" name="price" placeholder="Enter Price" value={newProduct.price} onChange={handleInputChange} />
        <input type="text" name="mrp" placeholder="MRP" value={newProduct.mrp} onChange={handleInputChange} />
        <input type="text" name="discount" placeholder="Discount %" value={newProduct.discount} onChange={handleInputChange} />
        <input type="text" name="category" placeholder="Category" value={newProduct.category} onChange={handleInputChange} />
        <input type="text" name="stock" placeholder="Stock Quantity" value={newProduct.stock} onChange={handleInputChange} />
        <button onClick={addOrUpdateProduct} disabled={loading}>{loading ? "Processing..." : editingProduct ? "Update Product" : "Add Product"}</button>
      </div>

      <div className="product-list">
        {products.length === 0 ? <p>No products available.</p> : products.map((product) => (
          <div className="product-card" key={product._id}>
            <img src={`http://localhost:5000${product.imageUrl}`} alt="Product" className="product-image" />
            <p className="product-name">{product.name}</p>
            <p className="product-price">₹ {product.price} (MRP: ₹{product.mrp}, {product.discount}% off)</p>
            <p className="product-category">Category: {product.category}</p>
            <p className="product-stock">Stock: {product.stock}</p>
            <button className="edit-btn" onClick={() => editProduct(product)}>Edit</button>
            <button className="delete-btn" onClick={() => deleteProduct(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
