'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { isAuthenticated, getUser, logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  const toggleCart = useCartStore((state) => state.toggleCart);
  const totalItems = useCartStore((state) => state.getTotalItems());

  // Hydrate auth state on client
  useEffect(() => {
    setAuthed(isAuthenticated());
    const user = getUser();
    if (user) {
      setUserName(user.name);
      setUserRole(user.role);
    }
  }, []);

  function handleLogout() {
    logout();
    setAuthed(false);
    setUserMenuOpen(false);
    window.location.href = '/';
  }

  const navLinks = [
    { href: '/menu', label: 'Menu' },
    { href: '/reserve', label: 'Reserve' },
    { href: '/track', label: 'Track Order' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary">
            DineDesk
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-text hover:text-primary transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* Auth section — desktop */}
            <div className="hidden md:flex items-center gap-2">
              {authed ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-1 text-sm font-medium text-text hover:text-primary transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{userName || 'Account'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-surface-border py-1">
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-text hover:bg-surface-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      {userRole === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-text hover:bg-surface-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      {(userRole === 'KITCHEN' || userRole === 'ADMIN') && (
                        <Link
                          href="/kitchen"
                          className="block px-4 py-2 text-sm text-text hover:bg-surface-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Kitchen
                        </Link>
                      )}
                      <hr className="my-1 border-surface-border" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-surface-muted"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">Register</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-text hover:text-primary transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-surface-border px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-text hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-surface-border" />
          {authed ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
