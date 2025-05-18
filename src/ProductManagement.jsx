import React, { useState, useEffect } from "react";
import "./styles/ProductManagement.css";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    image: null,
    name: "",
    price: "",
    mrp: "",
    discount: "",
    category: "", // Default category
    stock: "",
    timestamp: "", // Added timestamp field
    description: "", // Added description field
    option: "", // Added field for selected option
    ringSize: {}, // Changed to object for ring size
    subcategories: [], // Added subcategories as array of strings
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const authData = JSON.parse(localStorage.getItem("auth_user"));
  const token = authData?.token;
  const isAdmin = authData?.isAdmin;

  if (!isAdmin) {
    return <div>Admin privileges required for product management</div>;
  }

  // Fetch Products with Sales Data
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.success) {
        setProducts(res.data.products);
      } else {
        console.error("Failed to fetch products with sales data");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedProduct = { ...newProduct, [name]: value };

    // Calculate discount if price or mrp changes and both are valid numbers
    if ((name === "price" || name === "mrp") && updatedProduct.price && updatedProduct.mrp) {
      const priceNum = parseFloat(updatedProduct.price);
      const mrpNum = parseFloat(updatedProduct.mrp);
      if (mrpNum > 0 && priceNum >= 0 && priceNum <= mrpNum) {
        const discountCalc = ((mrpNum - priceNum ) / mrpNum) * 100;
        updatedProduct.discount = discountCalc.toFixed(2);
      } else {
        updatedProduct.discount = "";
      }
    }

    setNewProduct(updatedProduct);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProduct({ ...newProduct, image: file });
    }
  };

  // New functions for subcategory management
  const handleAddSubcategory = () => {
    const newSubcategory = prompt("Enter a new subcategory:");
    if (newSubcategory && !newProduct.subcategories.includes(newSubcategory.trim())) {
      setNewProduct({
        ...newProduct,
        subcategories: [...newProduct.subcategories, newSubcategory.trim()],
      });
    }
  };

  const handleRemoveSubcategory = (subcategoryToRemove) => {
    setNewProduct({
      ...newProduct,
      subcategories: newProduct.subcategories.filter(sub => sub !== subcategoryToRemove),
    });
  };

  const addOrUpdateProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.mrp ||
      !newProduct.category ||
      !newProduct.stock ||
      !newProduct.description ||
      !newProduct.option
    ) {
      alert("Please enter all fields.");
      return;
    }
    if (!editingProduct && !newProduct.image) {
      alert("Please select an image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("timestamp", new Date().toISOString());

    if (newProduct.image) {
      formData.append("image", newProduct.image);
    }

    const productData = {
      name: newProduct.name,
      price: newProduct.price,
      mrp: newProduct.mrp,
      discount: newProduct.discount,
      category: newProduct.category,
      stock: newProduct.stock,
      description: newProduct.description,
      option: newProduct.option,
      ringSize: JSON.stringify(newProduct.ringSize),
      subcategories: JSON.stringify(newProduct.subcategories),
    };

    for (const key in productData) {
      formData.append(key, productData[key]);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      let response;
      if (editingProduct) {
        response = await axios.put(
          `${BASE_URL}/edit/${editingProduct._id}`,
          formData,
          config
        );
      } else {
        response = await axios.post(`${BASE_URL}/upload`, formData, config);
      }

      if (response.data && response.data.success) {
        // Reset form first
        setNewProduct({
          image: null,
          name: "",
          price: "",
          mrp: "",
          discount: "",
          category: "",
          description: "",
          stock: "",
          option: "",
          ringSize: {},
          subcategories: [],
        });
        setEditingProduct(null);

        // Then update products list
        if (editingProduct) {
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p._id === response.data.product._id ? response.data.product : p
            )
          );
        } else {
          setProducts(prevProducts => [...prevProducts, response.data.product]);
        }

        // Show success message
        alert(editingProduct ? "Product updated successfully!" : "Product added successfully!");
      } else {
        throw new Error("Failed to add/update product");
      }
    } catch (error) {
      console.error("Error adding/updating product:", error.message);
      alert("Failed to add/update product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${BASE_URL}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      name: product.name || "",
      price: product.price || "",
      mrp: product.mrp || "",
      discount: product.discount || "",
      category: product.category || "",
      stock: product.stock || "",
      description: product.description || "",
      option: product.option || "",
      ringSize: product.ringSize || {},
      subcategories: product.subcategories || [],
      existingImageUrl: product.imageUrl,
    });
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setNewProduct({
      image: null,
      name: "",
      price: "",
      mrp: "",
      discount: "",
      category: "",
      stock: "",
      description: "",
      option: "",
      ringSize: {},
      subcategories: [],
    });
  };

  return (
    <div className="product-container">
      <h2 className="section-title">Product Management</h2>

      {/* Upload Form */}
      <div className="prouductupload-Form">
        <input type="file" onChange={handleFileUpload} />
        <p>Name</p>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={handleInputChange}
        />
        <p>Selling price</p>
        <input
          type="number"
          name="price"
          placeholder="Enter Price"
          value={newProduct.price}
          onChange={handleInputChange}
        />
        <p>M.R.P</p>
        <input
          type="number"
          name="mrp"
          placeholder="MRP"
          value={newProduct.mrp}
          onChange={handleInputChange}
        />
        <p>Discount</p>
        <input
          type="number"
          name="discount"
          placeholder="Discount %"
          value={newProduct.discount}
          onChange={handleInputChange}
        />

        {/* Subcategories UI */}
        <div>
          <label>Subcategories:</label>
          <div className="subcategories-list">
            {newProduct.subcategories.map((subcat) => (
              <div key={subcat} className="subcategory-tag">
                <span>{subcat}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubcategory(subcat)}
                  className="remove-subcategory"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddSubcategory}
            className="add-subcategory-btn"
          >
            Add Subcategory
          </button>
        </div>

        <div>
          <label>Category:</label>
          <div className="category-options">
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
                value="Bracelets"
                checked={newProduct.category === "Bracelets"}
                onChange={handleInputChange}
              />
              Bracelets
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Neck Pieces"
                checked={newProduct.category === "Neck Pieces"}
                onChange={handleInputChange}
              />
              Neck Pieces
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Anklets"
                checked={newProduct.category === "Anklets"}
                onChange={handleInputChange}
              />
              Anklets
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Kada's"
                checked={newProduct.category === "Kada's"}
                onChange={handleInputChange}
              />
              Kada's
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Hair Accessories"
                checked={newProduct.category === "Hair Accessories"}
                onChange={handleInputChange}
              />
              Hair Accessories
            </label>
            <label>
              <input
                type="radio"
                name="category"
                value="Others"
                checked={newProduct.category === "Others"}
                onChange={handleInputChange}
              />
              Others
            </label>
          </div>
        </div>

        {/* Ring Size and Stock Management */}
        {newProduct.category === "Rings" && (
          <div className="ring-sizes-section">
            <h4>Ring Sizes and Stock</h4>
            <div className="ring-sizes-grid">
              {Object.entries(newProduct.ringSize).map(([size, rstock]) => (
                <div key={size} className="ring-size-item">
                  <input type="text" placeholder="Ring Size" value={size} readOnly />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={rstock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        ringSize: { ...newProduct.ringSize, [size]: e.target.value },
                      })
                    }
                  />
                  <button
                    onClick={() => {
                      const updatedStock = { ...newProduct.ringSize };
                      delete updatedStock[size];
                      setNewProduct({ ...newProduct, ringSize: updatedStock });
                    }}
                    className="remove-size-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newSize = prompt("Enter Ring Size:");
                if (newSize && !newProduct.ringSize[newSize]) {
                  setNewProduct({
                    ...newProduct,
                    ringSize: { ...newProduct.ringSize, [newSize]: 0 },
                  });
                }
              }}
              className="add-size-btn"
            >
              Add Ring Size
            </button>
          </div>
        )}

        {/* Options */}
        <div>
          <label>Options:</label>
          <div className="options-grid">
            <label>
              <input
                type="radio"
                name="option"
                value="Anti tarnish"
                checked={newProduct.option === "Anti tarnish"}
                onChange={handleInputChange}
              />
              Anti Tarnish
            </label>
            <label>
              <input
                type="radio"
                name="option"
                value="Regular"
                checked={newProduct.option === "Regular"}
                onChange={handleInputChange}
              />
              Regular
            </label>
            <label>
              <input
                type="radio"
                name="option"
                value="Silver oxidized"
                checked={newProduct.option === "Silver oxidized"}
                onChange={handleInputChange}
              />
              Silver Oxidized
            </label>
            <label>
              <input
                type="radio"
                name="option"
                value="Others"
                checked={newProduct.option === "Others"}
                onChange={handleInputChange}
              />
              Others
            </label>
          </div>
        </div>

        <p>Product Description</p>
        <textarea
          name="description"
          placeholder="Product Description"
          value={newProduct.description}
          onChange={handleInputChange}
          rows="4"
          cols="50"
        />
        <p>Stock Quantity</p>
        <input
          type="number"
          name="stock"
          placeholder="Stock Quantity"
          value={newProduct.stock}
          onChange={handleInputChange}
        />
        <button 
          onClick={addOrUpdateProduct} 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Processing..." : editingProduct ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="prouductupload-Form">
                <input type="file" onChange={handleFileUpload} />
                <p>Name</p>
                <input
                  type="text"
                  name="name"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                />
                <p>Selling price</p>
                <input
                  type="number"
                  name="price"
                  placeholder="Enter Price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                />
                <p>M.R.P</p>
                <input
                  type="number"
                  name="mrp"
                  placeholder="MRP"
                  value={newProduct.mrp}
                  onChange={handleInputChange}
                />
                <p>Discount</p>
                <input
                  type="number"
                  name="discount"
                  placeholder="Discount %"
                  value={newProduct.discount}
                  onChange={handleInputChange}
                />

                {/* Subcategories UI */}
                <div>
                  <label>Subcategories:</label>
                  <div className="subcategories-list">
                    {newProduct.subcategories.map((subcat) => (
                      <div key={subcat} className="subcategory-tag">
                        <span>{subcat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(subcat)}
                          className="remove-subcategory"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="add-subcategory-btn"
                  >
                    Add Subcategory
                  </button>
                </div>

                <div>
                  <label>Category:</label>
                  <div className="category-options">
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
                        value="Bracelets"
                        checked={newProduct.category === "Bracelets"}
                        onChange={handleInputChange}
                      />
                      Bracelets
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="Neck Pieces"
                        checked={newProduct.category === "Neck Pieces"}
                        onChange={handleInputChange}
                      />
                      Neck Pieces
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="Anklets"
                        checked={newProduct.category === "Anklets"}
                        onChange={handleInputChange}
                      />
                      Anklets
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="Kada's"
                        checked={newProduct.category === "Kada's"}
                        onChange={handleInputChange}
                      />
                      Kada's
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="Hair Accessories"
                        checked={newProduct.category === "Hair Accessories"}
                        onChange={handleInputChange}
                      />
                      Hair Accessories
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="Others"
                        checked={newProduct.category === "Others"}
                        onChange={handleInputChange}
                      />
                      Others
                    </label>
                  </div>
                </div>

                {/* Ring Size and Stock Management */}
                {newProduct.category === "Rings" && (
                  <div className="ring-sizes-section">
                    <h4>Ring Sizes and Stock</h4>
                    <div className="ring-sizes-grid">
                      {Object.entries(newProduct.ringSize).map(([size, rstock]) => (
                        <div key={size} className="ring-size-item">
                          <input type="text" placeholder="Ring Size" value={size} readOnly />
                          <input
                            type="number"
                            placeholder="Stock"
                            value={rstock}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                ringSize: { ...newProduct.ringSize, [size]: e.target.value },
                              })
                            }
                          />
                          <button
                            onClick={() => {
                              const updatedStock = { ...newProduct.ringSize };
                              delete updatedStock[size];
                              setNewProduct({ ...newProduct, ringSize: updatedStock });
                            }}
                            className="remove-size-btn"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const newSize = prompt("Enter Ring Size:");
                        if (newSize && !newProduct.ringSize[newSize]) {
                          setNewProduct({
                            ...newProduct,
                            ringSize: { ...newProduct.ringSize, [newSize]: 0 },
                          });
                        }
                      }}
                      className="add-size-btn"
                    >
                      Add Ring Size
                    </button>
                  </div>
                )}

                {/* Options */}
                <div>
                  <label>Options:</label>
                  <div className="options-grid">
                    <label>
                      <input
                        type="radio"
                        name="option"
                        value="Anti tarnish"
                        checked={newProduct.option === "Anti tarnish"}
                        onChange={handleInputChange}
                      />
                      Anti Tarnish
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="option"
                        value="Regular"
                        checked={newProduct.option === "Regular"}
                        onChange={handleInputChange}
                      />
                      Regular
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="option"
                        value="Silver oxidized"
                        checked={newProduct.option === "Silver oxidized"}
                        onChange={handleInputChange}
                      />
                      Silver Oxidized
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="option"
                        value="Others"
                        checked={newProduct.option === "Others"}
                        onChange={handleInputChange}
                      />
                      Others
                    </label>
                  </div>
                </div>

                <p>Product Description</p>
                <textarea
                  name="description"
                  placeholder="Product Description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  rows="4"
                  cols="50"
                />
                <p>Stock Quantity</p>
                <input
                  type="number"
                  name="stock"
                  placeholder="Stock Quantity"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                />
                <div className="modal-actions">
                  <button 
                    onClick={addOrUpdateProduct} 
                    disabled={loading}
                    className="submit-btn"
                  >
                    {loading ? "Processing..." : "Update Product"}
                  </button>
                  <button 
                    onClick={closeModal}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 className="section-title">All Products</h3>
      <div className="products-grid">
        {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          products.map((product) => (
            <div key={product._id} className="product-card-admin">
              <div className="product-image-container">
                <img 
                  src={`${BASE_URL}${product.imageUrl}`} 
                  alt={product.name} 
                  className="product-image-admin"
                  onError={(e) => {
                    if (!e.target.src.includes("placeholder.jpg")) {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.jpg";
                    }
                  }}
                />
              </div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <div className="product-details-grid">
                  <div className="detail-item">
                    <span className="label">Price:</span>
                    <span className="value">₹{product.price}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">MRP:</span>
                    <span className="value">₹{product.mrp}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Discount:</span>
                    <span className="value">{product.discount}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value">{product.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Stock:</span>
                    <span className="value">{product.stock}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Option:</span>
                    <span className="value">{product.option}</span>
                  </div>
                </div>
        
                <div className="sales-info">
                  <h5>Sales Information</h5>
                  <div className="sales-grid">
                    <div className="sales-item">
                      <span className="label">Total Sales:</span>
                      <span className="value">{product.totalSales || 0}</span>
                    </div>
                    <div className="sales-item">
                      <span className="label">Total Revenue:</span>
                      <span className="value">₹{(product.totalRevenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="sales-item">
                      <span className="label">Total Quantity:</span>
                      <span className="value">{product.totalQuantity || 0}</span>
                    </div>
                  </div>
                </div>
        
                {product.category === "Rings" && product.ringSize && (
                  <div className="ring-sizes">
                    <h5>Ring Sizes and Stock:</h5>
                    <div className="ring-sizes-grid">
                      {Object.entries(product.ringSize).map(([size, rstock]) => (
                        <div key={size} className="ring-size-item">
                          <span className="label">Size {size}:</span>
                          <span className="value">{rstock}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
        
                {product.subcategories && product.subcategories.length > 0 && (
                  <div className="subcategories">
                    <h5>Subcategories:</h5>
                    <div className="subcategories-list">
                      {product.subcategories.map((subcat) => (
                        <span key={subcat} className="subcategory-tag">{subcat}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-actions">
                  <button onClick={() => editProduct(product)} className="edit-btn">Edit</button>
                  <button onClick={() => deleteProduct(product._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
