import { MenuIcon } from "lucide-react";
import Link from "next/link";

export default async function Navbar() {
  return (
    <nav className="p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="#" className="text-2xl font-bold">
          Garment
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mt-1 inline-flex">
            Khazana
          </span>
        </a>
        <div className="hidden md:flex space-x-4">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </nav>
  );
}
