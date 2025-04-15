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
  const authData = JSON.parse(localStorage.getItem("auth_user"));
  const token = authData?.token;
  const isAdmin = authData?.isAdmin;

  if (!isAdmin) {
    alert("Admin privileges required for product management");
    return;
  }

  // Fetch Products
  useEffect(() => {
    fetchProducts(); // Ensure the updated product list is fetched
  }, []);

const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/products");
      // Ensure all products have all required fields
      const completeProducts = res.data.products.map(product => ({
        _id: product._id,
        name: product.name || '',
        price: product.price || 0,
        mrp: product.mrp || 0,
        discount: product.discount || 0,
        category: product.category || 'Rings',
        stock: product.stock || 0,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        timestamp: product.timestamp || new Date().toISOString(),
        createdAt: product.createdAt || new Date().toISOString()
      }));
      setProducts(completeProducts);
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
  


    if ( !newProduct.name || !newProduct.price || !newProduct.mrp || !newProduct.discount || !newProduct.category || !newProduct.stock) {
      alert("Please enter all fields and select an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("timestamp", new Date().toISOString());
    
    // Only append image if a new one was selected
    if (newProduct.image) {
      formData.append("image", newProduct.image);
    }
    
    // Append all other fields as JSON string
    const productData = {
      name: newProduct.name,
      price: newProduct.price,
      mrp: newProduct.mrp,
      discount: newProduct.discount,
      category: newProduct.category,
      stock: newProduct.stock,
      description: newProduct.description
    };
    // Send data directly in body like stock endpoint
    for (const key in productData) {
      formData.append(key, productData[key]);
    }

    try {
      const config = {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: progressEvent => {
          console.log(`Upload Progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
        }
      };

      const response = editingProduct ? 
        await axios.put(`http://localhost:5000/edit/${editingProduct._id}`, formData, config) :
        await axios.post("http://localhost:5000/upload", formData, config);

      // Response logging removed
      
      // Ensure we have all product fields
      const updatedProduct = {
        ...response.data.product,
        name: response.data.product.name || newProduct.name,
        price: response.data.product.price || newProduct.price,
        mrp: response.data.product.mrp || newProduct.mrp,
        discount: response.data.product.discount || newProduct.discount,
        category: response.data.product.category || newProduct.category,
        stock: response.data.product.stock || newProduct.stock,
        description: response.data.product.description || newProduct.description
      };
      
      // Product update logging removed

      // Update the products list with the complete product data
      if (editingProduct) {
        setProducts(products.map(p => 
          p._id === updatedProduct._id ? updatedProduct : p
        ));
      } else {
        setProducts([...products, updatedProduct]);
      }
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
        headers: { "Authorization": `Bearer ${token}` },
      });

      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  const editProduct = (product) => {
    setNewProduct({
      image: null, // Keep as null but we'll handle existing image differently
      name: product.name || "",
      price: product.price || "",
      mrp: product.mrp || "",
      discount: product.discount || "",
      category: product.category || "Rings",
      stock: product.stock || "",
      description: product.description || "",
      existingImageUrl: product.imageUrl // Store existing image URL
    });
    setEditingProduct(product);
    // Editing product debug log removed
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
