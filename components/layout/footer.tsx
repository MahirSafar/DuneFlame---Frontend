import Link from "next/link"
import { Instagram, Twitter, Facebook } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary dark:bg-matte-black text-primary-foreground dark:text-cream-white border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">DuneFlame</h3>
            <p className="text-sm opacity-80">Premium coffee roasts crafted with passion and precision.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products?category=beans" className="hover:underline">
                  Coffee Beans
                </Link>
              </li>
              <li>
                <Link href="/products?category=capsules" className="hover:underline">
                  Capsules
                </Link>
              </li>
              <li>
                <Link href="/products?category=equipment" className="hover:underline">
                  Equipment
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:underline">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-80 transition-smooth">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:opacity-80 transition-smooth">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:opacity-80 transition-smooth">
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8 text-center text-sm opacity-75">
          <p>&copy; 2026 DuneFlame Coffee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
