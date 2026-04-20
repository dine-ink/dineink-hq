export default function Footer() {
  return (
    <footer className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
      <div className="border-t border-gray-200 pt-16 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-6">
            <div className="text-3xl font-bold text-red-700">DineInk</div>

            <p className="max-w-md text-sm leading-6 text-gray-600">
              DineInk helps restaurants manage billing, menu, tables, kitchen staff,
              reports and customer flow in one simple platform.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Product</h3>
                <ul className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Free Trial
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900">Restaurant Types</h3>
                <ul className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Fine Dining
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Cafes
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Quick Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Cloud Kitchens
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Company</h3>
                <ul className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
                <ul className="mt-6 space-y-4">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-red-700">
                      Refund Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-8 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            © 2026 DineInk. All rights reserved.
          </p>

          <div className="mt-6 flex space-x-6 sm:mt-0">
            <a href="#" className="text-gray-400 hover:text-red-700">
              Facebook
            </a>
            <a href="#" className="text-gray-400 hover:text-red-700">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-red-700">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
