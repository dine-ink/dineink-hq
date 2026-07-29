import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from './ProtectedRoute'
import AuthRoute from './AuthRoute'
import NotFound from "../pages/NotFound";

// Every page below is route-split via React.lazy — previously all ~26 pages
// (public marketing + the full authenticated dashboard, including every
// charting/reporting library they pull in) were eagerly bundled into one
// 12.4 MB (3.4 MB gzip) JS chunk, so even an anonymous visit to the public
// Home page downloaded the entire dashboard. Each route now only loads the
// code it actually needs.
const Home = lazy(() => import("../pages/home/Home"));
const Pricing = lazy(() => import("../pages/pricing/Pricing"));
const Features = lazy(() => import("../pages/features/Features"));
const About = lazy(() => import("../pages/about/About"));
const Contact = lazy(() => import("../pages/contact/Contact"));
const PrivacyPolicy = lazy(() => import("../pages/legal/PrivacyPolicy"));

const Login = lazy(() => import("../pages/auth/Login"));
const Signup = lazy(() => import("../pages/auth/Signup"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Settings = lazy(() => import("../pages/settings/Settings"));
const Shops = lazy(() => import("../pages/shops/Shops"));
const Bills = lazy(() => import("../components/bills/Bills"));
const Customers = lazy(() => import("../pages/customers/Customers"));
const Reports = lazy(() => import("../pages/reports/Report"));
const Attendance = lazy(() => import("../pages/attendance/Attendance"));
const CashSessions = lazy(() => import("../pages/cash/CashSessions"));
const BranchComparison = lazy(() => import("../pages/comparison/BranchComparison"));
const Kitchen = lazy(() => import("../pages/kitchen/Kitchen"));
const Insights = lazy(() => import("@/pages/insights/Insights"));
const MenuManagement = lazy(() => import("@/pages/menuManagement/MenuManagement"));
const Vendors = lazy(() => import("@/pages/vendors/Vendors"));
const ProcurementIntelligence = lazy(() => import("@/pages/procurement/ProcurementIntelligence"));
const FinancialStatements = lazy(() => import("@/pages/reports/FinancialStatements"));
const BudgetVsActual = lazy(() => import("@/pages/budget/BudgetVsActual"));
const ScenarioAnalysis = lazy(() => import("@/pages/scenario/ScenarioAnalysis"));
const Forecasting = lazy(() => import("@/pages/forecast/Forecasting"));
const InvestmentAnalysis = lazy(() => import("@/pages/investment/InvestmentAnalysis"));
const ExecutiveDashboard = lazy(() => import("@/pages/executive/ExecutiveDashboard"));
const AIAdvisorDashboard = lazy(() => import("@/pages/ai/AIAdvisorDashboard"));
const DailyStockAudit = lazy(() => import("@/pages/stockAudit/DailyStockAudit"));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
  </div>
);

// Each route's element gets its OWN Suspense boundary (rather than one
// boundary wrapping <Routes> as a whole) so navigating between dashboard
// pages only suspends the page being switched to — DashboardLayout (the
// persistent sidebar/shell for every /dashboard/* route) never unmounts.
const withSuspense = (element: React.ReactNode) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={withSuspense(<Home />)} />
        <Route path="/pricing" element={withSuspense(<Pricing />)} />
        <Route path="/features" element={withSuspense(<Features />)} />
        <Route path="/about" element={withSuspense(<About />)} />
        <Route path="/contact" element={withSuspense(<Contact />)} />
        <Route path="/privacy-policy" element={withSuspense(<PrivacyPolicy />)} />

        {/* Auth */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              {withSuspense(<Login />)}
            </AuthRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthRoute>
              {withSuspense(<Signup />)}
            </AuthRoute>
          }
        />

        <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />

        {/* 🔥 DASHBOARD WITH LAYOUT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={withSuspense(<Dashboard />)} />
          <Route path="settings" element={withSuspense(<Settings />)} />
          <Route path="shops" element={withSuspense(<Shops />)} />
          <Route path="bills" element={withSuspense(<Bills />)} />
          <Route path="customers" element={withSuspense(<Customers/>)}/>
          <Route path="insights" element={withSuspense(<Insights />)}/>
          <Route path="menu-management" element={withSuspense(<MenuManagement/>)}/>
          <Route path="reports" element={withSuspense(<Reports />)}/>
          <Route path="financial-statements" element={withSuspense(<FinancialStatements />)}/>
          <Route path="budget" element={withSuspense(<BudgetVsActual />)}/>
          <Route path="scenario-analysis" element={withSuspense(<ScenarioAnalysis />)}/>
          <Route path="forecasting" element={withSuspense(<Forecasting />)}/>
          <Route path="investment-analysis" element={withSuspense(<InvestmentAnalysis />)}/>
          <Route path="executive" element={withSuspense(<ExecutiveDashboard />)}/>
          <Route path="ai-advisor" element={withSuspense(<AIAdvisorDashboard />)}/>
          <Route path="attendance" element={withSuspense(<Attendance />)}/>
          <Route path="cash" element={withSuspense(<CashSessions />)}/>
          <Route path="comparison" element={withSuspense(<BranchComparison />)}/>
          <Route path="kitchen" element={withSuspense(<Kitchen />)}/>
          <Route path="vendors" element={withSuspense(<Vendors />)}/>
          <Route path="procurement-intelligence" element={withSuspense(<ProcurementIntelligence />)}/>
          <Route path="daily-stock-audit" element={withSuspense(<DailyStockAudit />)}/>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
