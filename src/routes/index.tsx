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
import ClientOrders from '../pages/ClientOrders';
import AdminCustomers from '../pages/AdminCustomers';
import AdminOrders from '../pages/AdminOrders';
import AdminProducts from '../pages/AdminProducts';
import AdminUsers from '../pages/AdminUsers';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/customer/new" element={<CustomerRegistration />} />
        
        {/* Rotas Restritas de Cliente */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/orders"
          element={
            <ProtectedRoute>
              <ClientOrders />
            </ProtectedRoute>
          }
        />
        
        {/* Rotas Restritas de Administrador */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/new"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ProductRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/edit/:id"
          element={
            <ProtectedRoute requireAdmin={true}>
              <ProductEdit />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
