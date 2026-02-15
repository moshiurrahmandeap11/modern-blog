"use client";

import { LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);
    const pathname = usePathname();

    // Check if user is logged in (from localStorage or cookies)
    useEffect(() => {
        const checkAuth = () => {
            try {
                // Get user from localStorage (you can modify this based on your auth method)
                const userData = localStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setUser(null);
            }
        };

        checkAuth();
        
        // Listen for storage changes (if user logs in/out in another tab)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]); // Re-check on route change

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false);
        setIsDropdownOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        try {
            // Clear user data from localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setIsDropdownOpen(false);
            
            // Optional: Redirect to home page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getUserInitial = () => {
        if (user?.name) {
            return user.name.charAt(0).toUpperCase();
        }
        return '';
    };

    const isActive = (path) => {
        return pathname === path;
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo/Left section */}
                    <div className="shrink-0">
                        <Link 
                            href="/" 
                            className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-gray-600 transition-colors"
                        >
                            Modern Blog
                        </Link>
                    </div>

                    {/* Desktop Navigation - Right section */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        {user ? (
                            // User is logged in - Show user menu
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    aria-expanded={isDropdownOpen}
                                    aria-haspopup="true"
                                >
                                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {getUserInitial()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 max-w-25 truncate">
                                        {user.name}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                                            isDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <User className="mr-3 h-4 w-4 text-gray-500" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // User is not logged in - Show login button
                            <Link
                                href="/login"
                                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    isActive('/login')
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }`}
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                            aria-expanded={isOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" />
                            ) : (
                                <Menu className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div
                    className={`md:hidden transition-all duration-300 ease-in-out ${
                        isOpen 
                            ? 'max-h-64 opacity-100 visible' 
                            : 'max-h-0 opacity-0 invisible overflow-hidden'
                    }`}
                >
                    <div className="space-y-1 pb-3 pt-2">
                        {user ? (
                            // Mobile - User is logged in
                            <>
                                <div className="px-3 py-2">
                                    <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                            {getUserInitial()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/profile"
                                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User className="mr-3 h-5 w-5 text-gray-500" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                                >
                                    <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                                    Log Out
                                </button>
                            </>
                        ) : (
                            // Mobile - User is not logged in
                            <Link
                                href="/login"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;