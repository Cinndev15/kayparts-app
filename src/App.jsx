import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import Categories from './components/Categories';
import Subcategories from './components/Subcategories';
import Brands from './components/Brands';
import Models from './components/Models';
import Years from './components/Years';
import Displacements from './components/Displacements';
import ProductBrands from './components/ProductBrands';
import Taxes from './components/Taxes';
import Products from './components/Products';
import Clients from './components/Clients';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user session is persisted
  useEffect(() => {
    try {
      const persistedUser = localStorage.getItem('kayparts_session');
      if (persistedUser) {
        setUser(JSON.parse(persistedUser));
      }
    } catch (e) {
      console.error('Error recovering session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('kayparts_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kayparts_session');
  };

  // Wait for session recovery to finish before rendering routes
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f6f8'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #cbd5e1',
          borderTopColor: '#e21a22',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />

        {/* Forgot Password Route */}
        <Route 
          path="/forgot-password" 
          element={
            <ForgotPassword />
          } 
        />

        {/* Reset Password Route */}
        <Route 
          path="/reset-password" 
          element={
            <ResetPassword />
          } 
        />

        {/* Profile Route */}
        <Route 
          path="/profile" 
          element={
            user ? <Profile user={user} onUserUpdate={handleLoginSuccess} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Categories Route */}
        <Route 
          path="/categories" 
          element={
            user ? <Categories user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Subcategories Route */}
        <Route 
          path="/subcategories" 
          element={
            user ? <Subcategories user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Brands Route */}
        <Route 
          path="/brands" 
          element={
            user ? <Brands user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Models Route */}
        <Route 
          path="/models" 
          element={
            user ? <Models user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Products Route */}
        <Route 
          path="/products" 
          element={
            user ? <Products user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Product Brands Route */}
        <Route 
          path="/product-brands" 
          element={
            user ? <ProductBrands user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Years Route */}
        <Route 
          path="/years" 
          element={
            user ? <Years user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Displacements Route */}
        <Route 
          path="/displacements" 
          element={
            user ? <Displacements user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Taxes Route */}
        <Route 
          path="/taxes" 
          element={
            user ? <Taxes user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Clients Route */}
        <Route 
          path="/clients" 
          element={
            user ? <Clients user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          } 
        />

        {/* Wildcard Route redirect */}
        <Route 
          path="*" 
          element={
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


