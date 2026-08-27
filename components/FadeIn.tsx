import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-royal-900 text-white pt-24 pb-10 border-t border-royal-800 font-sans">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
        
        {/* Brand (4 Cols) */}
        <div className="md:col-span-5 space-y-8">
          <h2 className="text-4xl font-serif italic font-bold tracking-tight text-white">Essential <span className="text-gold-500">Rush</span></h2>
          <p className="text-gray-400 text-sm leading-loose max-w-sm font-light">
            Premium watches, chosen with care. Straight talk, clear photos, and service you can count on.
          </p>
          <div className="flex gap-4">
            {[Instagram, Facebook, Twitter, Mail].map((Icon, i) => (
              <a key={i} href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-gold-500 hover:text-royal-900 hover:border-gold-500 transition-all duration-300">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Links (Col 1) */}
        <div className="md:col-span-2">
          <h3 className="text-gold-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">Shop</h3>
          <ul className="space-y-6 text-xs font-medium text-gray-300 uppercase tracking-widest">
            <li><Link href="/collection" className="hover:text-gold-400 transition-colors flex items-center gap-2 group">Collection <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/></Link></li>
            <li><Link href="/godmode" className="hover:text-gold-400 transition-colors">Admin</Link></li>
          </ul>
        </div>

        {/* Contact (Col 2) */}
        <div className="md:col-span-5">
          <h3 className="text-gold-500 text-xs font-bold uppercase tracking-[0.2em] mb-8">Contact</h3>
          <p className="text-3xl font-serif text-white mb-2">+91 98765 43210</p>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-10">We answer day or night</p>

          <form className="flex border-b border-white/20 pb-4">
            <input 
              type="email" 
              placeholder="YOUR EMAIL FOR UPDATES" 
              className="w-full bg-transparent outline-none text-xs font-bold uppercase tracking-widest placeholder:text-gray-600 focus:placeholder:text-gray-400 transition-all"
            />
            <button className="text-gold-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest px-6 md:px-12">
        <p>© 2026 Essential Rush</p>
        <div className="flex gap-8 mt-4 md:mt-0">
          <span className="hover:text-gold-500 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-gold-500 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}