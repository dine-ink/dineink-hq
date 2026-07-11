import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home/Home";
import Pricing from "../pages/pricing/Pricing";
import Features from "../pages/features/Features";
import About from "../pages/about/About";
import Contact from "../pages/contact/Contact";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import Dashboard from "../pages/dashboard/Dashboard";

import DashboardLayout from "../layouts/DashboardLayout";
import Settings from "../pages/settings/Settings";
import Shops from "../pages/shops/Shops";
import Bills from "../components/bills/Bills";
import Customers from "../pages/customers/Customers";
import Reports from "../pages/reports/Report";
import Attendance from "../pages/attendance/Attendance";
import CashSessions from "../pages/cash/CashSessions";
import BranchComparison from "../pages/comparison/BranchComparison";
import Kitchen from "../pages/kitchen/Kitchen";
import ProtectedRoute from './ProtectedRoute'
import AuthRoute from './AuthRoute'
import Insights from "@/pages/insights/Insights";
import MenuManagement from "@/pages/menuManagement/MenuManagement";
import Vendors from "@/pages/vendors/Vendors";
import DailyStockAudit from "@/pages/stockAudit/DailyStockAudit";
import ForgotPassword from "../pages/auth/ForgotPassword";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 🔥 DASHBOARD WITH LAYOUT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >          
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shops" element={<Shops />} />
          <Route path="bills" element={<Bills />} />
          <Route path="customers" element={<Customers/>}/>
          <Route path="insights" element={<Insights />}/>
          <Route path="menu-management" element={<MenuManagement/>}/>
          <Route path="reports" element={<Reports />}/>
          <Route path="attendance" element={<Attendance />}/>
          <Route path="cash" element={<CashSessions />}/>
          <Route path="comparison" element={<BranchComparison />}/>
          <Route path="kitchen" element={<Kitchen />}/>
          <Route path="vendors" element={<Vendors />}/>
          <Route path="daily-stock-audit" element={<DailyStockAudit />}/>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}