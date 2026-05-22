'use client'

import Navbar from '../../components/common/Navbar'
import HeroSection from '../../components/home/HeroSection'
import WhyDineInkSection from '../../components/home/WhyDineInkSection'
import DashboardPreviewSection from '../../components/home/DashboardPreviewSection'
import TestimonialsSection from '../../components/home/TestimonialsSection'
import LaunchSection from '../../components/home/LaunchSection'
import Footer from '../../components/common/Footer'


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-red-100 shadow-xl p-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                <h3 className="text-3xl font-bold text-red-700">500+</h3>
                <p className="mt-2 text-sm text-slate-600">Restaurants Expected</p>
              </div>
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center">
                <h3 className="text-3xl font-bold text-red-700">10k+</h3>
                <p className="mt-2 text-sm text-slate-600">Orders Managed Daily</p>
              </div>
              <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                <h3 className="text-3xl font-bold text-red-700">24/7</h3>
                <p className="mt-2 text-sm text-slate-600">Billing & Kitchen Support</p>
              </div>
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-center">
                <h3 className="text-3xl font-bold text-red-700">100%</h3>
                <p className="mt-2 text-sm text-slate-600">Cloud Based Access</p>
              </div>
            </div>
          </div>
        </div>
        <DashboardPreviewSection />
        <WhyDineInkSection />
        <LaunchSection />
        <TestimonialsSection />
      </main>
      {/* Footer */}
      <Footer />
    </div>
  )
}
