import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ProductList from '@/pages/products/ProductList'
import ProductForm from '@/pages/products/ProductForm'
import OrderList from '@/pages/orders/OrderList'
import OrderDetail from '@/pages/orders/OrderDetail'
import CityList from '@/pages/cities/CityList'
import CityForm from '@/pages/cities/CityForm'
import CategoryList from '@/pages/categories/CategoryList'
import CategoryForm from '@/pages/categories/CategoryForm'
import StoreSettings from '@/pages/settings/StoreSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="cities" element={<CityList />} />
        <Route path="cities/new" element={<CityForm />} />
        <Route path="cities/:id/edit" element={<CityForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />
        <Route path="settings" element={<StoreSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
