import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Tight spacing */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/biocol.png" 
                width={66} 
                height={66} 
                alt="Bioncolab Logo"
                
              />
              <span className="-ml-2 text-1x2 font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Bioncolab
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:grow">
            <ul className="flex grow justify-end flex-wrap items-center space-x-1">
              <li>
                <Link 
                  href="/labs" 
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-150 ease-in-out"
                >
                  Labs
                </Link>
              </li>
              <li>
                <Link 
                  href="/challenges" 
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-150 ease-in-out"
                >
                  Challenges
                </Link>
              </li>
              <li>
                <Link 
                  href="/simulations" 
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-150 ease-in-out"
                >
                  Simulations
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-150 ease-in-out"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/signin" 
                  className="btn-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 ml-3 rounded-lg shadow-sm"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile menu button - Only shows menu icon */}
          <div className="md:hidden flex items-center">
            <button className="text-gray-500 hover:text-gray-600 p-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect y="4" width="24" height="2" rx="1" fill="currentColor"/>
                <rect y="11" width="24" height="2" rx="1" fill="currentColor"/>
                <rect y="18" width="24" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}