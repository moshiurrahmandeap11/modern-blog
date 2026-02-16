"use client";

import axiosInstance from "@/app/components/sharedComponents/AxiosInstance/AxiosInstance";
import RichTextEditor from "@/app/components/sharedComponents/RichTextEditor/RichTextEditor";
import { format } from 'date-fns';
import {
    Bookmark,
    Calendar,
    ChevronLeft,
    Clock,
    Edit2,
    Eye,
    Facebook,
    Heart,
    Linkedin,
    Link as LinkIcon,
    MessageCircle,
    Share2,
    Tag,
    ThumbsUp,
    Trash2,
    Twitter,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const BlogDetails = () => {
    const params = useParams();
    const router = useRouter();
    const blogId = params?.id;

    const [blog, setBlog] = useState(null);
    const [author, setAuthor] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editedBlog, setEditedBlog] = useState({
        title: '',
        description: '',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');

    // Get current user from localStorage
    const [currentUser, setCurrentUser] = useState(null);
    
    useEffect(() => {
        try {
            const userInfo = localStorage.getItem("user");
            if (userInfo) {
                setCurrentUser(JSON.parse(userInfo));
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
        }
    }, []);

    // Fetch blog details
    useEffect(() => {
        const fetchBlogDetails = async () => {
            if (!blogId) return;

            try {
                setLoading(true);
                
                // Fetch blog by ID
                const response = await axiosInstance.get(`/blogs/${blogId}`);
                
                if (response.data.success) {
                    const blogData = response.data.data;
                    setBlog(blogData);
                    setLikesCount(blogData.likes || 0);
                    
                    // Parse tags
                    const tagsArray = parseTags(blogData.tags);
                    
                    // Set edited blog data
                    setEditedBlog({
                        title: blogData.title || '',
                        description: blogData.description || '',
                        tags: tagsArray
                    });

                    // Fetch author details
                    if (blogData.authorEmail) {
                        const authorRes = await axiosInstance.get(`/users/email/${blogData.authorEmail}`);
                        if (authorRes.data.success) {
                            setAuthor(authorRes.data.data);
                        }
                    }

                    // Fetch related blogs (by same author or similar tags)
                    if (blogData.authorEmail) {
                        const relatedRes = await axiosInstance.get(`/blogs?authorEmail=${blogData.authorEmail}&limit=3`);
                        if (relatedRes.data.success) {
                            setRelatedBlogs(relatedRes.data.data.filter(b => b.id !== blogData.id));
                        }
                    }

                    // Fetch comments
                    fetchComments(blogData.id);
                }
            } catch (error) {
                console.error("Error fetching blog details:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load blog details',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBlogDetails();
    }, [blogId]);

    // Fetch comments
    const fetchComments = async (blogId) => {
        try {
            const response = await axiosInstance.get(`/comments?blogId=${blogId}`);
            if (response.data.success) {
                setComments(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    // Parse tags
    const parseTags = (tags) => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string') {
            return tags.split(',').map(t => t.trim()).filter(t => t);
        }
        return [];
    };

    // Handle like
    const handleLike = async () => {
        try {
            const newLikedState = !liked;
            const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1;
            
            setLiked(newLikedState);
            setLikesCount(newLikesCount);

            // Update likes in database
            await axiosInstance.patch(`/blogs/${blogId}`, {
                likes: newLikesCount
            });
        } catch (error) {
            console.error("Error updating like:", error);
            // Revert on error
            setLiked(!liked);
            setLikesCount(likesCount);
        }
    };

    // Handle bookmark
    const handleBookmark = () => {
        setBookmarked(!bookmarked);
        Swal.fire({
            icon: 'success',
            title: bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    };

    // Handle share
    const handleShare = (platform) => {
        const url = window.location.href;
        const title = blog?.title || 'Check out this blog';
        
        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                Swal.fire({
                    icon: 'success',
                    title: 'Link copied!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
        setShowShareMenu(false);
    };

    // Handle comment submit
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const response = await axiosInstance.post('/comments', {
                blogId: blogId,
                userId: currentUser?.id,
                userName: currentUser?.name,
                content: comment,
                createdAt: new Date().toISOString()
            });

            if (response.data.success) {
                setComments([response.data.data, ...comments]);
                setComment('');
                Swal.fire({
                    icon: 'success',
                    title: 'Comment added!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    // Handle delete blog
    const handleDeleteBlog = () => {
        Swal.fire({
            title: 'Delete Blog?',
            text: "This action cannot be undone!",
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
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'Blog has been deleted.',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            router.push('/blogs');
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

    // Handle update blog
    const handleUpdateBlog = async () => {
        if (!editedBlog.title || !editedBlog.description) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete',
                text: 'Title and description are required',
            });
            return;
        }

        try {
            const response = await axiosInstance.patch(`/blogs/${blogId}`, editedBlog);

            if (response.data.success) {
                setBlog(response.data.data);
                setIsEditing(false);
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

    // Handle tag input for editing
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!editedBlog.tags.includes(tagInput.trim())) {
                setEditedBlog({
                    ...editedBlog,
                    tags: [...editedBlog.tags, tagInput.trim()]
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setEditedBlog({
            ...editedBlog,
            tags: editedBlog.tags.filter(tag => tag !== tagToRemove)
        });
    };

    // Calculate reading time
    const calculateReadingTime = (text) => {
        if (!text) return 1;
        const wordsPerMinute = 200;
        const textLength = text.replace(/<[^>]*>/g, '').length;
        const minutes = Math.ceil(textLength / wordsPerMinute);
        return minutes || 1;
    };

    // Check if current user is author
    const isAuthor = currentUser?.email === blog?.authorEmail;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading blog...</p>
                </div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h2>
                    <p className="text-gray-600 mb-6">The blog you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link
                        href="/blogs"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Blogs
                    </Link>
                </div>
            </div>
        );
    }

    const readingTime = calculateReadingTime(blog.description);
    const tagsArray = parseTags(blog.tags);

    return (
        <div className="min-h-screen text-black bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <Link
                        href="/blogs"
                        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Blogs
                    </Link>

                    {isAuthor && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
                            >
                                <Edit2 className="h-4 w-4" />
                                {isEditing ? 'Cancel Edit' : 'Edit Blog'}
                            </button>
                            <button
                                onClick={handleDeleteBlog}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Edit Mode */}
                {isEditing ? (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Blog</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editedBlog.title}
                                    onChange={(e) => setEditedBlog({...editedBlog, title: e.target.value})}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <RichTextEditor
                                    value={editedBlog.description}
                                    onChange={(content) => setEditedBlog({...editedBlog, description: content})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {editedBlog.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                        >
                                            #{tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-red-600"
                                            >
                                                ×
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
                                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Add tags and press Enter"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateBlog}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Update Blog
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Blog Content */
                    <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        {/* Cover Image */}
                        {blog.coverImage ? (
                            <img
                                src={blog.coverImage}
                                alt={blog.title}
                                className="w-full h-64 sm:h-96 object-cover"
                            />
                        ) : (
                            <div className="w-full h-48 sm:h-64 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                <span className="text-6xl">📝</span>
                            </div>
                        )}

                        {/* Blog Header */}
                        <div className="p-6 sm:p-8">
                            {/* Author Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                                    {author?.name?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
                                </div>
                                <div>
                                    {/* <h3 className="font-semibold text-gray-900">{author?.name || 'Unknown Author'}</h3> */}
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {blog.created_at ? format(new Date(blog.created_at), 'MMMM dd, yyyy') : 'N/A'}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {readingTime} min read
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                {blog.blogtitle}
                            </h1>

                            {/* Tags */}
                            {tagsArray.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {tagsArray.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                        >
                                            #{blogtags}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b">
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        liked 
                                            ? 'bg-red-100 text-red-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                                    <span>{likesCount}</span>
                                </button>

                                <button
                                    onClick={handleBookmark}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        bookmarked 
                                            ? 'bg-purple-100 text-purple-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                                    >
                                        <Share2 className="h-5 w-5" />
                                        Share
                                    </button>

                                    {showShareMenu && (
                                        <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-xl border p-2 z-10">
                                            <button
                                                onClick={() => handleShare('facebook')}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg w-full"
                                            >
                                                <Facebook className="h-4 w-4 text-blue-600" />
                                                Facebook
                                            </button>
                                            <button
                                                onClick={() => handleShare('twitter')}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg w-full"
                                            >
                                                <Twitter className="h-4 w-4 text-blue-400" />
                                                Twitter
                                            </button>
                                            <button
                                                onClick={() => handleShare('linkedin')}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg w-full"
                                            >
                                                <Linkedin className="h-4 w-4 text-blue-700" />
                                                LinkedIn
                                            </button>
                                            <button
                                                onClick={() => handleShare('copy')}
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg w-full"
                                            >
                                                <LinkIcon className="h-4 w-4 text-gray-600" />
                                                Copy Link
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Blog Description */}
                            <div 
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: blog.blogdescription }}
                            />
                        </div>
                    </article>
                )}

                {/* Comments Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-purple-600" />
                        Comments ({comments.length})
                    </h2>

                    {/* Comment Form */}
                    {currentUser ? (
                        <form onSubmit={handleCommentSubmit} className="mb-8">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your comment..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                                rows="4"
                            />
                            <button
                                type="submit"
                                disabled={!comment.trim()}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Post Comment
                            </button>
                        </form>
                    ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center mb-8">
                            <p className="text-gray-600">
                                Please <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">login</Link> to comment
                            </p>
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                        ) : (
                            comments.map((comment, index) => (
                                <div key={index} className="border-b last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <span className="text-sm font-medium text-purple-700">
                                                {comment.userName?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{comment.userName}</h4>
                                            <p className="text-xs text-gray-500">
                                                {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd, yyyy') : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 ml-11">{comment.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Related Blogs */}
                {relatedBlogs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Blogs</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedBlogs.map(related => (
                                <Link
                                    key={related.id}
                                    href={`/blog-details/${related.id}`}
                                    className="group block"
                                >
                                    <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all">
                                        {related.coverImage ? (
                                            <img
                                                src={related.coverImage}
                                                alt={related.title}
                                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                                                <span className="text-2xl">📝</span>
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                                                {related.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <Eye className="h-3 w-3" />
                                                {related.views || 0} views
                                                <span>•</span>
                                                <ThumbsUp className="h-3 w-3" />
                                                {related.likes || 0}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogDetails;