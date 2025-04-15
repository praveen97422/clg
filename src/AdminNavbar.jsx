import { FaSearch, FaUser, FaCog, FaBox, FaChartLine } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "./styles/AdminNavbar.css";
import { useAuth } from "./auth/AuthContext.jsx";
import { useState } from "react";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <div>
      {/* Admin Navbar Section */}
      <div className="admin-navbar-container">
        {/* Logo */}
        <h1 className="admin-logo">
          <Link to="/admin">Havya Jewels Admin</Link>
        </h1>
        
        {/* Admin Navigation */}
        <div className="admin-nav-menu">
          <Link to="/">Home</Link>
          <Link to="/admin/dashboard">
            <FaChartLine /> Dashboard
          </Link>
          <Link to="/admin/products">
            <FaBox /> Products
          </Link>
          <Link to="/admin/settings">
            <FaCog /> Settings
          </Link>
        </div>

        {/* User Profile */}
        <div className="admin-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <FaUser />
          {showDropdown && (
            <div className="admin-profile-dropdown">
               <div className="dropdown-item" ><Link to="/">Home</Link></div>
              <div className="dropdown-item">Admin: {user?.name}</div>
              <div className="dropdown-item" onClick={logout}>Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
