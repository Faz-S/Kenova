'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  isBlurred?: boolean;
  customNavItems?: NavItem[];
  minimalMode?: boolean;
}

export default function Navbar({ 
  isBlurred = false, 
  customNavItems,
  minimalMode = false
}: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const defaultNavItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Question Paper', href: '/question-paper' },
    { label: 'Flashcards', href: '/flashcards' },
    { label: 'Quiz', href: '/quiz' },
    { label: 'Smart Notes', href: '/smart-notes' },
    { label: 'AI Assistant', href: '/ai-assistant' },
    { label: 'Revise', href: '/revise' },
  ];

  // Use custom nav items if provided, otherwise use default
  const navItems = customNavItems || defaultNavItems;

  // Minimal navigation mode
  if (minimalMode) {
    return (
      <nav className="fixed top-[20px] left-[20px] right-[20px] z-50 bg-white border-b-2 border-l-2 border-r-2 border-t-2 border-black">
        <div className="max-w-[1400px] mx-auto flex justify-end items-center relative">
          <div className="flex flex-wrap">
            {customNavItems.map((item, index) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`px-6 py-4 border-x-2 border-black ${index === 0 ? 'border-l-2' : ''} hover:bg-[#FFB800] transition-colors text-xs sm:text-sm lg:text-base`}
                style={{ fontFamily: 'var(--font-courier-prime)', height: '100%' }}
              >
                {item.label.trim()}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Default full navigation
  return (
    <nav className={`fixed top-[10px] left-[15px] right-[15px] xl:right-[20px] xl:left-[20px] lg:top-[20px] z-50 ${
      pathname === '/quiz' 
        ? 'bg-[#FFE3E0]' 
        : pathname === '/question-paper' 
          ? 'bg-[#CCF1EE]' 
          : pathname === '/smart-notes'
            ? 'bg-[#E4FFE1]'
            :pathname === '/ai-assistant'
              ? 'bg-[#FFF7DF]'
              : 'bg-white'
    } border-b-2 border-l-2 border-r-2 border-t-2 border-black  ${
      isBlurred ? 'blur-sm pointer-events-none cursor-not-allowed' : ''
    }`}>
      <div className="flex justify-end items-center relative">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-wrap">
          {navItems.map((item, index) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`px-6 py-4 border-black border-l-2 ${index === 0 ? '' : ''} 
                ${
                  pathname === item.href 
                    ? (item.href === '/question-paper'
                      ? 'bg-[#00CBBB] text-white'
                      : item.href === '/quiz'
                        ? 'bg-[#FF6958] text-white'
                        : item.href === '/smart-notes'
                          ? 'bg-[#4BA943] text-white'
                          :item.href === '/ai-assistant'
                          ? 'bg-[#FFB800] text-white'
                          : 'bg-[#FFB800]')
                    : 'hover:bg-[#FFF]'
                } transition-colors text-xs sm:text-sm lg:text-base`}
              style={{ fontFamily: 'var(--font-courier-prime)', height: '100%' }}
            >
              {item.label.trim()}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center h-full">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-4 focus:outline-none text-sm sm:text-base flex items-center justify-center"
            style={{ height: '100%' }}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b-2 border-black">
            {navItems.map((item, index) => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-6 py-4 border-b-2 border-black 
                  ${
                    pathname === item.href 
                      ? (item.href === '/question-paper'
                        ? 'bg-[#00CBBB] text-white'
                        : item.href === '/quiz'
                          ? 'bg-[#FFB800]'
                          : item.href === '/smart-notes'
                            ? 'bg-[#4BA943] text-white'
                            : 'bg-[#FFB800]')
                      : 'hover:bg-[#FFB800]'
                  } transition-colors text-xs sm:text-sm lg:text-base`}
                style={{ fontFamily: 'var(--font-courier-prime)' }}
              >
                {item.label.trim()}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
