"use client"

import axiosInstance from "@/app/components/sharedComponents/AxiosInstance/AxiosInstance";
import RichTextEditor from "@/app/components/sharedComponents/RichTextEditor/RichTextEditor";
import 'sweetalert2/dist/sweetalert2.min.css';

import { format } from 'date-fns';
import {
    BookOpen,
    Calendar,
    ChevronRight,
    Edit2,
    Eye,
    FileText,
    Info,
    Mail,
    MessageCircle,
    Phone,
    Plus,
    Shield,
    Tag,
    ThumbsUp,
    Trash2,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentBlogId, setCurrentBlogId] = useState(null);
    const [blogData, setBlogData] = useState({
        title: '',
        description: '',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    // Get user data from localStorage - only runs on client
    useEffect(() => {
        try {
            const userInfo = localStorage.getItem("user");
            if (userInfo) {
                const userData = JSON.parse(userInfo);
                setUserId(userData?.id);
                setUserEmail(userData?.email);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Not Logged In',
                    text: 'Please login to view your profile',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/login';
                });
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
            window.location.href = '/login';
        }
    }, []);

    // Fetch user data and blogs
    useEffect(() => {
        const fetchData = async () => {
            if (!userId || !userEmail) return;

            try {
                setLoading(true);
                
                const userRes = await axiosInstance.get(`/users/${userId}`);
                if (userRes.data.success) {
                    setUser(userRes.data.data);
                }

                const blogsRes = await axiosInstance.get(`/blogs?authorEmail=${userEmail}`);
                if (blogsRes.data.success) {
                    setBlogs(blogsRes.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setBlogs([]);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load profile data',
                    timer: 2000,
                    showConfirmButton: false
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, userEmail]);

    // Handle edit profile
    const handleEditProfile = () => {
        Swal.fire({
            title: 'Edit Profile',
            html: `
                <div class="space-y-4">
                    <input id="swal-name" class="swal2-input" placeholder="Full Name" value="${user?.name || ''}">
                    <input id="swal-email" class="swal2-input" placeholder="Email" value="${user?.email || ''}" type="email" disabled>
                    <textarea id="swal-bio" class="swal2-textarea" placeholder="Bio">${user?.bio || ''}</textarea>
                    <input id="swal-phone" class="swal2-input" placeholder="Phone Number" value="${user?.phone || ''}">
                </div>
                <p class="text-xs text-gray-500 mt-2">Email cannot be changed</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#8b5cf6',
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const bio = document.getElementById('swal-bio').value;
                const phone = document.getElementById('swal-phone').value;

                if (!name) {
                    Swal.showValidationMessage('Name is required');
                    return false;
                }

                return { name, bio, phone };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.patch(`/users/${userId}`, result.value);
                    if (response.data.success) {
                        setUser(response.data.data);
                        
                        const userInfo = localStorage.getItem("user");
                        if (userInfo) {
                            const userData = JSON.parse(userInfo);
                            userData.name = result.value.name;
                            localStorage.setItem("user", JSON.stringify(userData));
                        }
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Updated!',
                            text: 'Profile updated successfully',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.message || 'Failed to update profile',
                    });
                }
            }
        });
    };

    // Handle create blog
    const handleCreateBlog = async () => {
        if (!blogData.title || !blogData.description) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete',
                text: 'Title and description are required',
            });
            return;
        }

        try {
            const response = await axiosInstance.post('/blogs', {
                ...blogData,
                authorId: userId,
                authorEmail: userEmail,
                authorName: user?.name
            });

            if (response.data.success) {
                setBlogs([response.data.data, ...(blogs || [])]);
                handleCloseModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Blog created successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create blog',
            });
        }
    };

    // Handle update blog
    const handleUpdateBlog = async () => {
        if (!blogData.title || !blogData.description) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete',
                text: 'Title and description are required',
            });
            return;
        }

        try {
            const response = await axiosInstance.patch(`/blogs/${currentBlogId}`, blogData);

            if (response.data.success) {
                setBlogs(blogs.map(blog => 
                    blog.id === currentBlogId ? response.data.data : blog
                ));
                handleCloseModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Blog updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update blog',
            });
        }
    };

    // Handle delete blog
    const handleDeleteBlog = (blogId, blogTitle) => {
        Swal.fire({
            title: 'Delete Blog?',
            text: `Are you sure you want to delete "${blogTitle}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/blogs/${blogId}`);
                    if (response.data.success) {
                        setBlogs(blogs.filter(blog => blog.id !== blogId));
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Blog has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.message || 'Failed to delete blog',
                    });
                }
            }
        });
    };

    // Handle delete account
    const handleDeleteAccount = () => {
        Swal.fire({
            title: 'Delete Account?',
            text: "This action cannot be undone! All your data will be permanently deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.delete(`/users/${userId}`);
                    if (response.data.success) {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Your account has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = '/';
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: error.response?.data?.message || 'Failed to delete account',
                    });
                }
            }
        });
    };

    // Handle tag input
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!blogData.tags.includes(tagInput.trim())) {
                setBlogData({
                    ...blogData,
                    tags: [...blogData.tags, tagInput.trim()]
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setBlogData({
            ...blogData,
            tags: blogData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    // Handle blog edit
    const handleEditBlog = (blog) => {
        // Convert tags string to array if needed
        const tagsArray = blog?.tags 
            ? (typeof blog.tags === 'string' 
                ? blog.tags.split(',').map(t => t.trim()).filter(t => t) 
                : blog.tags)
            : [];

        setBlogData({
            title: blog.title,
            description: blog.description,
            tags: tagsArray
        });
        setCurrentBlogId(blog.id);
        setIsEditMode(true);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentBlogId(null);
        setBlogData({ title: '', description: '', tags: [] });
        setTagInput('');
        document.body.style.overflow = 'unset';
    };

    // Handle modal open for create
    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setCurrentBlogId(null);
        setBlogData({ title: '', description: '', tags: [] });
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Calculate stats with safe checks
    const totalViews = Array.isArray(blogs) ? blogs.reduce((sum, blog) => sum + (blog?.views || 0), 0) : 0;
    const totalLikes = Array.isArray(blogs) ? blogs.reduce((sum, blog) => sum + (blog?.likes || 0), 0) : 0;

    // Helper function to parse tags
    const parseTags = (tags) => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
            return tags.split(',').map(t => t.trim()).filter(t => t);
        }
        return [];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!userId || !userEmail || !user) {
        return null;
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                        <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-purple-600 font-medium">Profile</span>
                    </div>

                    {/* Profile Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        {/* Cover Photo */}
                        <div className="h-40 sm:h-56 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"></div>
                        
                        {/* Profile Info */}
                        <div className="px-4 sm:px-8 pb-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 sm:-mt-20 mb-6">
                                {/* Avatar */}
                                <div className="relative mx-auto sm:mx-0">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white"></div>
                                </div>
                                
                                <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{user?.name}</h1>
                                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mt-2">
                                        <p className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                                            <Mail className="h-4 w-4 text-purple-600" />
                                            {user?.email}
                                        </p>
                                        <p className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                                            <Shield className="h-4 w-4 text-purple-600" />
                                            <span className="capitalize px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                {user?.role}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                                    <button
                                        onClick={handleEditProfile}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span className="sm:inline">Edit</span>
                                    </button>
                                    <button
                                        onClick={handleOpenCreateModal}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all text-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span className="sm:inline">Create</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
                                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                                        <BookOpen className="h-4 w-4" />
                                        <span className="text-xs font-medium">Blogs</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{blogs?.length || 0}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                                        <Eye className="h-4 w-4" />
                                        <span className="text-xs font-medium">Views</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="text-xs font-medium">Likes</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{totalLikes}</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl text-center">
                                    <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-medium">Joined</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Bio and Contact */}
                            {(user?.bio || user?.phone) && (
                                <div className="border-t border-gray-100 pt-6">
                                    {user?.bio && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Info className="h-4 w-4 text-purple-600" />
                                                Bio
                                            </h3>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                                {user.bio}
                                            </p>
                                        </div>
                                    )}
                                    {user?.phone && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-purple-600" />
                                                Phone
                                            </h3>
                                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                                {user.phone}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Blogs Section */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-4 sm:px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-purple-600" />
                                Your Blogs
                                <span className="text-sm font-normal text-gray-500 ml-2">({blogs?.length || 0})</span>
                            </h2>
                            <button
                                onClick={handleOpenCreateModal}
                                className="sm:hidden flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm"
                            >
                                <Plus className="h-4 w-4" />
                                New
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-8">
                            {!blogs || blogs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No blogs yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                                        Start sharing your thoughts and ideas with the world. Create your first blog post now!
                                    </p>
                                    <button
                                        onClick={handleOpenCreateModal}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Your First Blog
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {blogs.map(blog => {
                                        // Parse tags - convert string to array if needed
                                        const tagsArray = parseTags(blog?.tags);
                                        
                                        return (
                                            <div 
                                                key={blog?.id} 
                                                className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all"
                                            >
                                                {blog?.coverImage ? (
                                                    <img 
                                                        src={blog.coverImage} 
                                                        alt={blog.title}
                                                        className="w-full h-40 sm:h-48 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                                        <FileText className="h-12 w-12 text-purple-400" />
                                                    </div>
                                                )}
                                                
                                                <div className="p-4">
                                                    {/* Meta info */}
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {blog?.created_at ? format(new Date(blog.created_at), 'MMM dd') : 'N/A'}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {blog?.views || 0}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Title */}
                                                    <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">
                                                        <Link 
                                                            href={`/blog/${blog?.id}`}
                                                            className="hover:text-purple-600 transition-colors"
                                                        >
                                                            {blog?.title || 'Untitled'}
                                                        </Link>
                                                    </h3>
                                                    
                                                    {/* Tags - using parsed tagsArray */}
                                                    {tagsArray.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {tagsArray.slice(0, 2).map(tag => (
                                                                <span 
                                                                    key={tag} 
                                                                    className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full"
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                            {tagsArray.length > 2 && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                    +{tagsArray.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <ThumbsUp className="h-3 w-3" />
                                                                {blog?.likes || 0}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageCircle className="h-3 w-3" />
                                                                {blog?.comments || 0}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEditBlog(blog)}
                                                                className="p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Edit blog"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5 text-gray-500 hover:text-purple-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBlog(blog?.id, blog?.title)}
                                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete blog"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
                                                            </button>
                                                            <Link 
                                                                href={`/blog/${blog?.id}`}
                                                                className="text-purple-600 hover:text-purple-800 text-xs font-medium ml-1"
                                                            >
                                                                Read
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delete Account Button */}
                    <div className="mt-6 sm:mt-8 text-center">
                        <button
                            onClick={handleDeleteAccount}
                            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            This action is permanent and cannot be undone
                        </p>
                    </div>
                </div>
            </div>

            {/* Create/Edit Blog Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={handleCloseModal}
                    ></div>

                    {/* Modal Container */}
                    <div className="flex items-center justify-center min-h-screen px-4 py-4">
                        {/* Modal Content */}
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-4 sticky top-0 z-10">
                                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                                    {isEditMode ? (
                                        <>
                                            <Edit2 className="h-5 w-5" />
                                            Edit Blog
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5" />
                                            Create New Blog
                                        </>
                                    )}
                                </h3>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="px-4 sm:px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Blog Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={blogData.title}
                                            onChange={(e) => setBlogData({...blogData, title: e.target.value})}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                            placeholder="Enter an engaging title..."
                                        />
                                    </div>

                                    {/* Description with Rich Text Editor */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <RichTextEditor
                                            value={blogData.description}
                                            onChange={(content) => setBlogData({...blogData, description: content})}
                                            placeholder="Write your amazing content here..."
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tags (Press Enter to add)
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                                            {blogData.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                                                >
                                                    #{tag}
                                                    <button
                                                        onClick={() => removeTag(tag)}
                                                        className="hover:bg-purple-200 rounded-full p-0.5"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                                placeholder="Type a tag and press Enter (e.g., technology)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t sticky bottom-0">
                                <div className="flex justify-end gap-2 sm:gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 sm:px-5 py-2 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={isEditMode ? handleUpdateBlog : handleCreateBlog}
                                        className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 text-sm"
                                    >
                                        {isEditMode ? 'Update Blog' : 'Create Blog'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;