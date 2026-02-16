"use client";

import axiosInstance from "@/app/components/sharedComponents/AxiosInstance/AxiosInstance";
import { format } from 'date-fns';
import {
    Calendar,
    ChevronRight,
    Eye,
    Filter,
    MessageCircle,
    Search,
    ThumbsUp,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const AllBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalBlogs, setTotalBlogs] = useState(0);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef(null);
    console.log("blog", blogs);

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.5,
        triggerOnce: false
    });

    // Fetch all users for filter
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/users');
                if (response.data.success) {
                    setUsers(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Fetch blogs with pagination
    useEffect(() => {
        fetchBlogs(1, true);
    }, []);

    // Fetch more blogs when scroll reaches bottom
    useEffect(() => {
        if (inView && hasMore && !loading && !loadingMore) {
            fetchBlogs(page + 1, false);
        }
    }, [inView]);

    // Filter blogs when user or search changes
    useEffect(() => {
        let filtered = [...blogs];

        // Filter by user
        if (selectedUser) {
            filtered = filtered.filter(blog => 
                blog.authorEmail?.toLowerCase() === selectedUser.email?.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(blog =>
                blog.title?.toLowerCase().includes(query) ||
                blog.description?.toLowerCase().includes(query) ||
                blog.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        setFilteredBlogs(filtered);
    }, [blogs, selectedUser, searchQuery]);

    const fetchBlogs = async (pageNum, isInitial = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const response = await axiosInstance.get(`/blogs?page=${pageNum}&limit=4`);
            
            if (response.data.success) {
                const newBlogs = response.data.data;
                const total = response.data.total || 0;
                
                setTotalBlogs(total);
                
                if (pageNum === 1) {
                    setBlogs(newBlogs);
                } else {
                    setBlogs(prev => [...prev, ...newBlogs]);
                }
                
                setPage(pageNum);
                setHasMore(newBlogs.length === 4 && blogs.length + newBlogs.length < total);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            if (isInitial) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    // Handle user selection
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setShowUserDropdown(false);
    };

    // Clear filters
    const clearFilters = () => {
        setSelectedUser(null);
        setSearchQuery('');
    };

    // Parse tags from string to array
    const parseTags = (tags) => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
            return tags.split(',').map(t => t.trim()).filter(t => t);
        }
        return [];
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Loading skeleton component
    const BlogSkeleton = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200"></div>
            <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="space-y-2 mb-3">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
                <div className="flex gap-1 mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex gap-3">
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen text-black bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="text-center mb-8">
                        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                        <div className="h-6 w-96 max-w-full bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </div>

                    {/* Filter Skeleton */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-full sm:w-64 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>

                    {/* Blogs Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <BlogSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        All Blogs
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Discover amazing stories and insights from our community
                    </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search blogs by title, content or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* User Filter Dropdown */}
                        <div className="relative sm:w-64" ref={dropdownRef}>
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors text-sm"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">
                                        {selectedUser ? selectedUser.name : 'Filter by author'}
                                    </span>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${showUserDropdown ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showUserDropdown && (
                                <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto">
                                    <button
                                        onClick={() => handleUserSelect(null)}
                                        className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors text-sm"
                                    >
                                        All Authors
                                    </button>
                                    {users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleUserSelect(user)}
                                            className="w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors text-sm"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-purple-700">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="truncate">{user.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear Filters Button */}
                        {(selectedUser || searchQuery) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium text-sm"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Results Info */}
                    <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredBlogs.length} of {totalBlogs} blogs
                        {selectedUser && ` by ${selectedUser.name}`}
                    </div>
                </div>

                {/* Blogs Grid */}
                {filteredBlogs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-xl shadow-md p-8">
                            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No blogs found</h3>
                            <p className="text-gray-600">
                                {selectedUser || searchQuery 
                                    ? 'Try adjusting your filters'
                                    : 'Be the first to create a blog!'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBlogs.map((blog) => {
                                const tagsArray = parseTags(blog?.tags);
                                const author = users.find(u => u.email === blog.authorEmail);
                                
                                return (
                                    <div
                                        key={blog.id}
                                        className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Blog Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            {blog.coverImage ? (
                                                <img
                                                    src={blog.coverImage}
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                                    <span className="text-4xl">📝</span>
                                                </div>
                                            )}
                                            
                                            {/* Author Badge */}
                                            {author && (
                                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs font-medium">
                                                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <span className="text-purple-700">
                                                            {author.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="truncate max-w-[100px]">
                                                        {author.name?.split(' ')[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Blog Content */}
                                        <div className="p-4">
                                            {/* Meta Info */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {blog.created_at 
                                                        ? format(new Date(blog.created_at), 'MMM dd, yyyy')
                                                        : 'N/A'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {blog.views || 0}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2">
                                                <Link href={`/blog-details/${blog.id}`}>
                                                    {blog.blogtitle || 'Untitled'}
                                                </Link>
                                            </h3>

                                            {/* Description */}
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                                                {blog.blogdescription?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                                            </p>

                                            {/* Tags */}
                                            {tagsArray.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {tagsArray.slice(0, 3).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <ThumbsUp className="h-3 w-3" />
                                                        {blog.likes || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" />
                                                        {blog.comments || 0}
                                                    </span>
                                                </div>

                                                <Link
                                                    href={`/blog-details/${blog.id}`}
                                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 group"
                                                >
                                                    Read More
                                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Load More Trigger */}
                        {hasMore && (
                            <div
                                ref={loadMoreRef}
                                className="mt-8 flex justify-center"
                            >
                                {loadingMore ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                                        {[...Array(4)].map((_, i) => (
                                            <BlogSkeleton key={`more-${i}`} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-sm">Scroll for more blogs...</div>
                                )}
                            </div>
                        )}

                        {/* End Message */}
                        {!hasMore && blogs.length > 0 && (
                            <div className="mt-8 text-center text-gray-500 text-sm">
                                You&asop;ve reached the end! 🎉
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllBlogs;