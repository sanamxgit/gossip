import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import RequireAuth from "./components/auth/RequireAuth"
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import HomePage from "./pages/HomePage"
import ProductPage from "./pages/ProductPage"
import CartPage from "./pages/CartPage"
import CheckoutPage from "./pages/CheckoutPage"
import OrderSuccessPage from "./pages/OrderSuccessPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import SellerDashboard from "./pages/SellerDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import ProfilePage from "./pages/ProfilePage"
import OrderHistoryPage from "./pages/OrderHistoryPage"
import CategoryPage from "./pages/CategoryPage"
import SellerVerification from "./components/SellerVerification"
import "./styles/App.css"

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/category/:category" element={<CategoryPage />} />

                {/* Protected Routes */}
                <Route
                  path="/checkout"
                  element={
                    <RequireAuth>
                      <CheckoutPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/order-success"
                  element={
                    <RequireAuth>
                      <OrderSuccessPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <RequireAuth>
                      <OrderHistoryPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/seller/dashboard"
                  element={
                    <RequireAuth>
                      <SellerDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/seller/verification"
                  element={
                    <RequireAuth>
                      <SellerVerification />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <RequireAuth>
                      <AdminDashboard />
                    </RequireAuth>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
