import React, { useState, useEffect } from "react";
import "./styles/ProductManagement.css";

import axios from "axios";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    image: null,
    name: "",
    price: "",
    mrp: "",
    discount: "",
    category: "Rings", // Default category
    stock: "",
    timestamp: "", // Added timestamp field
    description: "" // Added description field
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch Products
  useEffect(() => {
    fetchProducts(); // Ensure the updated product list is fetched
  }, []);

const fetchProducts = async () => {
    console.log("Fetching products..."); // Log when fetching products
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
    console.log("Form Data before submission:", newProduct); // Log the form data before submission
    console.log("Editing Product ID:", editingProduct ? editingProduct._id : "No product being edited"); // Log the ID of the product being edited
  


    if ( !newProduct.name || !newProduct.price || !newProduct.mrp || !newProduct.discount || !newProduct.category || !newProduct.stock) {
      alert("Please enter all fields and select an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    // formData.append("timestamp", new Date().toISOString()); // Include timestamp in the form data
    formData.append("timestamp", new Date().toISOString()); // Add current timestamp
    formData.append("image", newProduct.image);
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("mrp", newProduct.mrp);
    formData.append("discount", newProduct.discount);
    formData.append("category", newProduct.category);
    formData.append("stock", newProduct.stock);
    formData.append("description",newProduct.description);

    try {
      const response = editingProduct ? 
        await axios.put(`http://localhost:5000/edit/${editingProduct._id}`, formData, { headers: { "x-auth-token": token } }) :
        await axios.post("http://localhost:5000/upload", formData, { headers: { "x-auth-token": token } });

      
console.log("Response after update:", response.data); // Log the response from the server
console.log("Updated Product:", response.data.product); // Log the updated product data
fetchProducts(); // Refresh the product list after adding/updating
      console.log("Updated Product:", response.data.product); // Log the updated product data

      fetchProducts(); // Refresh the product list after adding/updating
      setNewProduct({ image: null, name: "", price: "", mrp: "", discount: "", category: "", description: "", stock: "" }); 

      setEditingProduct(null);
    } catch (error) {
      console.error("Error adding/updating product:", error.message);
      alert("Failed to add/update product.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://localhost:5000/delete/${id}`, {
        headers: { "x-auth-token": token },
      });

      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  const editProduct = (product) => {
    setNewProduct({
      image: null,
      name: product.name || "", // Ensure default value
      price: product.price || "", // Ensure default value
      mrp: product.mrp || "", // Ensure default value
      discount: product.discount || "", // Ensure default value
      category: product.category || "others", // Ensure default value
      stock: product.stock || "", // Ensure default value
      description: product.description || ""
    });
    setEditingProduct(product);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Product Management</h2>

      {/* Upload Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="file" onChange={handleFileUpload} />
        <input type="text" name="name" placeholder="Product Name" value={newProduct.name} onChange={handleInputChange} />
        <input type="number" name="price" placeholder="Enter Price" value={newProduct.price} onChange={handleInputChange} />
        <input type="number" name="mrp" placeholder="MRP" value={newProduct.mrp} onChange={handleInputChange} />
        <input type="text" name="discount" placeholder="Discount %" value={newProduct.discount} onChange={handleInputChange} />
        <div>
  <label>Category:</label>
  <div>
    <label>
      <input
        type="radio"
        name="category"
        value="Rings"
        checked={newProduct.category === "Rings"}
        onChange={handleInputChange}
      />
      Rings
    </label>

    <label>
      <input
        type="radio"
        name="category"
        value="Earrings"
        checked={newProduct.category === "Earrings"}
        onChange={handleInputChange}
      />
      Earrings
    </label>

    <label>
      <input
        type="radio"
        name="category"
        value="Chains"
        checked={newProduct.category === "Chains"}
        onChange={handleInputChange}
      />
      Chains
    </label>

    <label>
      <input
        type="radio"
        name="category"
        value="Necklace"
        checked={newProduct.category === "Necklace"}
        onChange={handleInputChange}
      />
      Necklace
    </label>

    <label>
      <input
        type="radio"
        name="category"
        value="others"
        checked={newProduct.category === "others"}
        onChange={handleInputChange}
      />
      Others
    </label>
  </div>
</div>


        <input type="text" name="description" placeholder="Product Description" value={newProduct.description} onChange={handleInputChange} /> {/* Changed to textarea */}
        <input type="number" name="stock" placeholder="Stock Quantity" value={newProduct.stock} onChange={handleInputChange} />
        <button onClick={addOrUpdateProduct} disabled={loading}>{loading ? "Processing..." : editingProduct ? "Update Product" : "Add Product"}</button>
      </div>

      <h3>All Products</h3>
      <div>
        {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          products.map((product) => (
            <div key={product._id} style={{ display: "flex", flexDirection: "column", marginBottom: "10px" }}>
              <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} width="100" />
              <p>Name: {product.name}</p>
              <p>Price: ₹{product.price}</p>
              <p>MRP: ₹{product.mrp}</p>
              <p>Discount: {product.discount}%</p>
              <p>Category: {product.category}</p>
              <p>Stock: {product.stock}</p>
              <p>Uploaded At: {product.timestamp ? new Date(product.timestamp).toLocaleString() : "N/A"}</p> {/* Display timestamp */}
              <p>Description: {product.description}</p> {/* Display product description */}


              <button onClick={() => editProduct(product)}>Edit</button>
              <button onClick={() => deleteProduct(product._id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
