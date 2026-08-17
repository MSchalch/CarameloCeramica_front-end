import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CustomerRegistration from '../pages/CustomerRegistration';
import ProductRegistration from '../pages/ProductRegistration';
import UserProfile from '../pages/UserProfile';
import ProductEdit from '../pages/ProductEdit';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customer/new" element={<CustomerRegistration />} />
        <Route path="/product/new" element={<ProductRegistration />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/product/edit/:id" element={<ProductEdit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
