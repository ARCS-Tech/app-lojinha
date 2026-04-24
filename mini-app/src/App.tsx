import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthGate from '@/pages/AuthGate'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import SupportFAB from '@/components/SupportFAB'
import CitySelect from '@/pages/CitySelect'
import Catalog from '@/pages/Catalog'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import OrderConfirm from '@/pages/OrderConfirm'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import { useAuthStore } from '@/store/authStore'

function RequireCity({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user?.selectedCityId) return <Navigate to="/city" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const showNav = location.pathname !== '/city'
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1" style={showNav ? { paddingBottom: 'var(--bottom-nav-height)' } : undefined}>
        {children}
      </div>
      {showNav && <BottomNav />}
      {showNav && <SupportFAB />}
    </div>
  )
}

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/city" element={<AppLayout><CitySelect /></AppLayout>} />
        <Route path="/" element={<RequireCity><AppLayout><Catalog /></AppLayout></RequireCity>} />
        <Route path="/products/:id" element={<RequireCity><AppLayout><ProductDetail /></AppLayout></RequireCity>} />
        <Route path="/cart" element={<RequireCity><AppLayout><Cart /></AppLayout></RequireCity>} />
        <Route path="/orders" element={<RequireCity><AppLayout><Orders /></AppLayout></RequireCity>} />
        <Route path="/orders/:id" element={<RequireCity><AppLayout><OrderDetail /></AppLayout></RequireCity>} />
        <Route path="/orders/:id/confirm" element={<RequireCity><AppLayout><OrderConfirm /></AppLayout></RequireCity>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  )
}
