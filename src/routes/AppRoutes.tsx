import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home/Home";
// import Login from "../pages/auth/Login";
// import Signup from "../pages/auth/Signup";
// import ForgotPassword from "../pages/auth/ForgotPassword";

import Pricing from "../pages/pricing/Pricing";
import Features from "../pages/features/Features";
import About from "../pages/about/About";
import Contact from "../pages/contact/Contact";

// import RestaurantSetup from "../pages/setup/RestaurantSetup";
// import BranchSetup from "../pages/setup/BranchSetup";
// import OrderTypeSetup from "../pages/setup/OrderTypeSetup";
// import TableSetup from "../pages/setup/TableSetup";
// import CategorySetup from "../pages/setup/CategorySetup";
// import MenuSetup from "../pages/setup/MenuSetup";
// import UserSetup from "../pages/setup/UserSetup";
// import TaxSetup from "../pages/setup/TaxSetup";
// import FinishSetup from "../pages/setup/FinishSetup";

// import Dashboard from "../pages/dashboard/Dashboard";
// import NotFound from "../pages/NotFound";

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

        {/* Auth Pages */}
        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> */}

        {/* Restaurant Setup Flow */}
        {/* <Route path="/setup/restaurant" element={<RestaurantSetup />} />
        <Route path="/setup/branch" element={<BranchSetup />} />
        <Route path="/setup/order-types" element={<OrderTypeSetup />} />
        <Route path="/setup/tables" element={<TableSetup />} />
        <Route path="/setup/categories" element={<CategorySetup />} />
        <Route path="/setup/menu" element={<MenuSetup />} />
        <Route path="/setup/users" element={<UserSetup />} />
        <Route path="/setup/taxes" element={<TaxSetup />} />
        <Route path="/setup/finish" element={<FinishSetup />} /> */}

        {/* Dashboard */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}