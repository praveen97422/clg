import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:5000/products").then((res) => setProducts(res.data));
  }, []);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("name", name);
    formData.append("price", price);

    await axios.post("http://localhost:5000/admin/upload", formData, {
      headers: { "x-auth-token": token },
    });
    window.location.reload();
  };

  const handleDelete = async (id) => {
    // Logic to delete the associated image from local storage
    const imageUrl = `http://localhost:5000${products.find(product => product._id === id).imageUrl}`;
    localStorage.removeItem(imageUrl); // Remove the image from local storage

    await axios.delete(`http://localhost:5000/admin/delete/${id}`, {
      headers: { "x-auth-token": token },
    });
    window.location.reload();
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <input type="text" placeholder="Product Name" onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      <h3>All Products</h3>
      {products.map((product) => (
        <div key={product._id}>
          <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} width="100" />
          <p>{product.name} - ₹{product.price}</p>
          <button onClick={() => handleDelete(product._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
