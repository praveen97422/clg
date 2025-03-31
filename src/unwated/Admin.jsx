// import React, { useState, useEffect } from "react";
// import axios from "axios";

// export default function Admin() {
//   const [products, setProducts] = useState([]);
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState("");
//   const [mrp, setMrp] = useState("");
//   const [discount, setDiscount] = useState("");
//   const [category, setCategory] = useState("Rings"); // Default category
//   const [stock, setStock] = useState("");
//   const [image, setImage] = useState(null);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const token = localStorage.getItem("token");

//   // Fetch Products
//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       const res = await axios.get("http://localhost:5000/products");
//       setProducts(res.data.products);
//     } catch (error) {
//       console.error("Error fetching products:", error);
//     }
//   };

//   // Handle Upload
//   const handleUpload = async () => {
//     if (!name || !price || !discount || !mrp || !category || !stock || (!image && !editingProduct)) {
//       alert("Please enter all required fields.");
//       return;
//     }

//     setLoading(true);
//     const formData = new FormData();
//     if (image) formData.append("image", image);
//     formData.append("name", name);
//     formData.append("price", price);
//     formData.append("mrp", mrp);
//     formData.append("discount", discount);
//     formData.append("category", category);
//     formData.append("stock", stock);

//     try {
//       if (editingProduct) {
//         await axios.put(`http://localhost:5000/admin/update/${editingProduct._id}`, formData, {
//           headers: { "x-auth-token": token },
//         });
//       } else {
//         await axios.post("http://localhost:5000/admin/upload", formData, {
//           headers: { "x-auth-token": token },
//         });
//       }
//       fetchProducts(); // Refresh product list
//       resetForm();
//     } catch (error) {
//       console.error("Error uploading/updating product:", error);
//       alert("Failed to upload/update product.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle Delete
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this product?")) return;

//     try {
//       await axios.delete(`http://localhost:5000/admin/delete/${id}`, {
//         headers: { "x-auth-token": token },
//       });
//       setProducts(products.filter((product) => product._id !== id));
//     } catch (error) {
//       console.error("Error deleting product:", error);
//       alert("Failed to delete product.");
//     }
//   };

//   const resetForm = () => {
//     setName("");
//     setPrice("");
//     setMrp("");
//     setDiscount("");
//     setCategory("Rings");
//     setStock("");
//     setImage(null);
//     setEditingProduct(null);
//   };

//   const handleEdit = (product) => {
//     setEditingProduct(product);
//     setName(product.name);
//     setPrice(product.price);
//     setMrp(product.mrp);
//     setDiscount(product.discount);
//     setCategory(product.category);
//     setStock(product.stock);
//     setImage(null);
//   };

//   return (
//     <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
//       <h2>Admin Panel</h2>

//       {/* Upload Form */}
//       <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//         <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
//         <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
//         <input type="number" placeholder="MRP" value={mrp} onChange={(e) => setMrp(e.target.value)} />
//         <input type="number" placeholder="Discount %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
//         <select value={category} onChange={(e) => setCategory(e.target.value)}>
//           <option value="Rings">Rings</option>
//           <option value="Chain">Chain</option>
//           <option value="Necklace">Necklace</option>
//           <option value="Earrings">Earrings</option>
//         </select>
//         <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
//         {!editingProduct && <input type="file" onChange={(e) => setImage(e.target.files[0])} />}
//         <button onClick={handleUpload} disabled={loading}>{loading ? "Uploading..." : editingProduct ? "Update" : "Upload"}</button>
//       </div>

//       <h3>All Products</h3>
//       <div>
//         {products.length === 0 ? (
//           <p>No products available.</p>
//         ) : (
//           products.map((product) => (
//             <div key={product._id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
//               <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} width="100" />
//               <div>
//                 <p>{product.name} - ₹{product.price} (Discount: {product.discount}%)</p>
//                 <button onClick={() => handleEdit(product)}>Edit</button>
//                 <button onClick={() => handleDelete(product._id)}>Delete</button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
