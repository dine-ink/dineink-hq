import Navbar from "../../components/common/Navbar";
import HeroSection from "../../components/home/HeroSection";
import ProblemSection from "../../components/home/ProblemSection";
import DashboardPreviewSection from "../../components/home/DashboardPreviewSection";
import ThreeLayersSection from "../../components/home/ThreeLayersSection";
import WhyDineInkSection from "../../components/home/WhyDineInkSection";
import ProductSplitSection from "../../components/home/ProductSplitSection";
import LaunchSection from "../../components/home/LaunchSection";
import Footer from "../../components/common/Footer";

const productStats = [
  { value: "29", label: "Dashboard modules" },
  { value: "98", label: "Analytical views" },
  { value: "50", label: "Named reports" },
  { value: "675", label: "Tracked metrics" },
  { value: "345", label: "Forecast permutations" },
  { value: "20", label: "Scenario levers" },
  { value: "27", label: "Excel export sheets" },
  { value: "11", label: "POS screens" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        <HeroSection />

        {/* Product scale — every figure counted from the shipped product */}
        <section className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
          <p className="mb-6 text-center text-sm font-semibold tracking-widest text-[#b10000] uppercase">
            Shipped today, not on a roadmap
          </p>
          <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {productStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl p-6 text-center ${
                    index % 2 === 0
                      ? "border border-red-900 bg-[#b10000]"
                      : "border border-red-100 bg-red-50"
                  }`}
                >
                  <h3
                    className={`text-3xl font-bold ${
                      index % 2 === 0 ? "text-white" : "text-[#b10000]"
                    }`}
                  >
                    {stat.value}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      index % 2 === 0 ? "text-red-100" : "text-slate-600"
                    }`}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Every number above is counted from the product itself.
            </p>
          </div>
        </section>

        <ProblemSection />
        <DashboardPreviewSection />
        <ThreeLayersSection />
        <WhyDineInkSection />
        <ProductSplitSection />
        <LaunchSection />
      </main>
      <Footer />
    </div>
  );
}
