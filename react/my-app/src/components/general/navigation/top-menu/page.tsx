"use client";
import { useState } from "react";
import Image from "next/image";

// Define strict TypeScript types for navigation links
interface NavItem {
  label: string;
  href: string;
}

export const Navbar: React.FC<{ navItems: NavItem[] }> = ({
  navItems: customNavItems,
}) => {
  // State handling for the mobile menu drawer toggle
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleMenu = (): void => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 bg-linear-to-b from-blue-400 via-blue-300 to-blue-200 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <Image
            src="/ReduceCheat_Logo.png"
            alt="ReduceCheat Logo"
            width={90}
            height={90}
            // style={{ width: "100%", height: "auto" }}
            priority
          />
          {/* <div className="flex shrink-0 items-center">
            <a
              href="#"
              className="text-xl font-bold tracking-tight text-blue-600"
            >
              ReduceCheat
            </a>
          </div> */}

          {/* Desktop Navigation Links */}
          {/* Hidden on mobile, flex on medium screens and up */}
          <div className="hidden space-x-4 md:flex">
            {customNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-md px-3 py-2 font-bold text-gray-600 transition-colors duration-200 hover:text-blue-600"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Action Button */}
          <div className="hidden items-center md:flex">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700">
              Log Out
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          {/* Flex on mobile, hidden on medium screens and up */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                // Close/X Icon
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger Menu Icon
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {/* Dynamic visibility using template literals based on standard state */}
      <div
        className={`${isOpen ? "block" : "hidden"} border-b border-gray-200 bg-white md:hidden`}
      >
        <div className="space-y-1 px-2 pt-2 pb-4 sm:px-3">
          {customNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)} // Auto-closes mobile drawer after clicking link
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600"
            >
              {item.label}
            </a>
          ))}
          <div className="border-t border-gray-100 px-3 pt-4 pb-2">
            <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
