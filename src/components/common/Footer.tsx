import { Link } from "react-router-dom";
import Logo from "./Logo";

const productLinks = [
  { name: "Features", to: "/features" },
  { name: "Pricing", to: "/pricing" },
  { name: "Owner dashboard", to: "/login" },
  { name: "Start free", to: "/signup" },
];

const companyLinks = [
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
];

const legalLinks = [{ name: "Privacy Policy", to: "/privacy-policy" }];

const products = [
  {
    name: "DineInk Professional",
    detail: "One restaurant — POS, kitchen, inventory and the full finance suite.",
  },
  {
    name: "DineInk Enterprise",
    detail: "Chains and franchises — priced per outlet, branch comparison built in.",
  },
  {
    name: "DineInk DOT",
    detail: "A mobile app for street vendors and single counters.",
  },
];

export default function Footer() {
  return (
    <footer className="mt-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-slate-200 pt-16 pb-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6">
              <Logo tone="onLight" size="lg" subtitle="Restaurant OS" />
              <p className="max-w-sm text-sm leading-6 text-slate-600">
                Every other POS tells you what you sold. DineInk tells you what
                you earned — billing, kitchen, inventory and a real finance
                layer in one platform built for Indian restaurants.
              </p>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.name} className="text-sm">
                    <div className="font-semibold text-slate-900">
                      {product.name}
                    </div>
                    <div className="text-slate-500">{product.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Product
                </h3>
                <ul className="mt-6 space-y-4">
                  {productLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-600 transition hover:text-[#b10000]"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Company
                </h3>
                <ul className="mt-6 space-y-4">
                  {companyLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-600 transition hover:text-[#b10000]"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
                <ul className="mt-6 space-y-4">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-600 transition hover:text-[#b10000]"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-slate-200 pt-8 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} DineInk. All rights reserved.
            </p>
            <p className="mt-4 text-sm text-slate-500 sm:mt-0">
              Built in India, for Indian restaurants.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
