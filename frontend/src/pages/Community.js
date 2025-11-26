import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Community.css';

export default function Community() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: ''
  });

  const categories = [
    'Budgeting Tips',
    'Saving Strategies',
    'Investment Advice',
    'Expense Management',
    'Financial Goals',
    'Debt Management',
    'General Discussion'
  ];

  // Load posts from backend on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts');
      setPosts(response.data);
      // Save to localStorage as backup
      localStorage.setItem('bw_community_posts', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading posts from backend:', error);
      // Try to load from localStorage as fallback
      const savedPosts = localStorage.getItem('bw_community_posts');
      if (savedPosts) {
        try {
          setPosts(JSON.parse(savedPosts));
        } catch (e) {
          console.error('Error parsing saved posts:', e);
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.title.trim()) {
      alert('Post title cannot be empty');
      return;
    }
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    if (!formData.content.trim()) {
      alert('Post content cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/posts', formData);
      setPosts([response.data, ...posts]);
      setFormData({ title: '', category: '', content: '' });
      setShowNewPostModal(false);
      localStorage.setItem('bw_community_posts', JSON.stringify([response.data, ...posts]));
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      // Fallback to localStorage
      const newPost = {
        id: Date.now(),
        author: user?.username || 'Anonymous',
        authorAvatar: user?.username ? user.username[0].toUpperCase() : 'A',
        title: formData.title,
        category: formData.category,
        content: formData.content,
        createdAt: new Date().toISOString(),
        comments: [],
        likes: 0,
        isLikedByUser: false
      };
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('bw_community_posts', JSON.stringify(updatedPosts));
      setFormData({ title: '', category: '', content: '' });
      setShowNewPostModal(false);
      alert('Post created (offline mode)');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/posts/${selectedPost.id}/comments`, {
        content: newComment
      });

      // Update the selected post with the new comment
      setSelectedPost({
        ...selectedPost,
        comments: [response.data, ...(selectedPost.comments || [])]
      });

      // Update the posts list
      setPosts(posts.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments: [response.data, ...(p.comments || [])] }
          : p
      ));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/like`);
      
      // Update posts list
      const updatedPosts = posts.map(p => 
        p.id === postId ? response.data : p
      );
      setPosts(updatedPosts);

      // Update selected post if it's the liked one
      if (selectedPost?.id === postId) {
        setSelectedPost(response.data);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/api/posts/${postId}`);
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
        alert('Post deleted successfully!');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await axios.delete(`/api/posts/comments/${commentId}`);
        
        // Update selected post
        if (selectedPost) {
          const updatedComments = selectedPost.comments.filter(c => c.id !== commentId);
          setSelectedPost({ ...selectedPost, comments: updatedComments });
          
          // Update posts list
          setPosts(posts.map(p =>
            p.id === selectedPost.id
              ? { ...p, comments: updatedComments }
              : p
          ));
        }
        alert('Comment deleted successfully!');
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
      }
    }
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafb';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f1f5f9' : '#111827';
  const subtleText = isDarkMode ? '#94a3b8' : '#6b7280';
  const borderColor = isDarkMode ? '#334155' : '#e5e7eb';
  const primaryColor = '#2563eb';
  const buttonHover = isDarkMode ? '#1e3a8a' : '#1d4ed8';

  return (
    <div style={{ padding: '24px', background: bgColor, minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: textColor, fontSize: '32px', marginBottom: '8px' }}>Community Forum!💬</h1>
          <p style={{ color: subtleText, marginBottom: '20px' }}>Share tips and learn from others</p>
          <button
            onClick={() => setShowNewPostModal(true)}
            disabled={loading}
            style={{
              background: primaryColor,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: '0.3s',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = buttonHover)}
            onMouseLeave={(e) => !loading && (e.target.style.background = primaryColor)}
          >
            + New Post
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedPost ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Posts Feed */}
          <div>
            {loading && posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: subtleText }}>
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div
                style={{
                  background: cardBg,
                  padding: '40px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: `1px solid ${borderColor}`
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p style={{ color: subtleText }}>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    background: cardBg,
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: `1px solid ${borderColor}`,
                    cursor: 'pointer',
                    transition: '0.3s',
                    boxShadow: selectedPost?.id === post.id ? `0 0 0 2px ${primaryColor}` : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = cardBg}
                >
                  {/* Post Header */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: primaryColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {post.authorAvatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: textColor, fontWeight: '600', fontSize: '14px' }}>{post.author}</div>
                      <div style={{ color: subtleText, fontSize: '12px' }}>{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Post Title and Category */}
                  <h3 style={{ color: textColor, marginBottom: '8px', fontSize: '16px' }}>{post.title}</h3>
                  <div style={{ display: 'inline-block', background: primaryColor, color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                    {post.category}
                  </div>

                  {/* Post Content */}
                  <p style={{ color: textColor, marginBottom: '16px', lineHeight: '1.6' }}>{post.content}</p>

                  {/* Post Stats */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '20px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${borderColor}`,
                      color: subtleText,
                      fontSize: '13px'
                    }}
                  >
                    <span>❤️ {post.likes || 0} Likes</span>
                    <span>💬 {post.comments?.length || 0} Comments</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Details Panel */}
          {selectedPost && (
            <div
              style={{
                background: cardBg,
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                maxHeight: '600px',
                overflowY: 'auto'
              }}
            >
              {/* Post Header */}
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${borderColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: primaryColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {selectedPost.authorAvatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: textColor, fontWeight: '600' }}>{selectedPost.author}</div>
                    <div style={{ color: subtleText, fontSize: '12px' }}>{new Date(selectedPost.createdAt).toLocaleString()}</div>
                  </div>
                  {selectedPost.author === user?.username && (
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      disabled={loading}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <h2 style={{ color: textColor, marginBottom: '12px', fontSize: '20px' }}>{selectedPost.title}</h2>
                <div style={{ display: 'inline-block', background: primaryColor, color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                  {selectedPost.category}
                </div>
                <p style={{ color: textColor, lineHeight: '1.6' }}>{selectedPost.content}</p>

                {/* Like Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => handleLikePost(selectedPost.id)}
                    disabled={loading}
                    style={{
                      background: selectedPost.isLikedByUser ? primaryColor : isDarkMode ? '#334155' : '#e5e7eb',
                      color: selectedPost.isLikedByUser ? 'white' : textColor,
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: '0.3s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) =>
                      !loading && (e.currentTarget.style.background = selectedPost.isLikedByUser
                        ? buttonHover
                        : isDarkMode ? '#475569' : '#d1d5db')
                    }
                    onMouseLeave={(e) =>
                      !loading && (e.currentTarget.style.background = selectedPost.isLikedByUser
                        ? primaryColor
                        : isDarkMode ? '#334155' : '#e5e7eb')
                    }
                  >
                    ❤️ {selectedPost.likes || 0} Likes
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: textColor, marginBottom: '16px', fontSize: '16px' }}>Comments</h3>

                {/* Add Comment Form */}
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      color: textColor,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px',
                      marginBottom: '10px',
                      opacity: loading ? 0.6 : 1
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={loading}
                    style={{
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      width: '100%',
                      transition: '0.3s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.background = buttonHover)}
                    onMouseLeave={(e) => !loading && (e.target.style.background = primaryColor)}
                  >
                    Post Comment
                  </button>
                </div>

                {/* Comments List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <p style={{ color: subtleText, fontSize: '13px' }}>No comments yet</p>
                  ) : (
                    selectedPost.comments.map(comment => (
                      <div
                        key={comment.id}
                        style={{
                          background: isDarkMode ? '#0f172a' : '#f8fafb',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: `1px solid ${borderColor}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: primaryColor,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {comment.authorAvatar}
                            </div>
                            <div>
                              <div style={{ color: textColor, fontWeight: '600', fontSize: '13px' }}>
                                {comment.author}
                              </div>
                              <div style={{ color: subtleText, fontSize: '11px' }}>{new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          {comment.author === user?.username && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={loading}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                opacity: loading ? 0.6 : 1
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p style={{ color: textColor, fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewPostModal(false)}
        >
          <div
            style={{
              background: cardBg,
              padding: '28px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              border: `1px solid ${borderColor}`,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: textColor, marginBottom: '24px', fontSize: '20px' }}>Create a New Post</h2>

            {/* Title Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What's your post about?"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Content Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your thoughts..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '140px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setFormData({ title: '', category: '', content: '' });
                }}
                style={{
                  background: isDarkMode ? '#334155' : '#e5e7eb',
                  color: textColor,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = isDarkMode ? '#475569' : '#d1d5db'}
                onMouseLeave={(e) => e.target.style.background = isDarkMode ? '#334155' : '#e5e7eb'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                style={{
                  background: primaryColor,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = buttonHover}
                onMouseLeave={(e) => e.target.style.background = primaryColor}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
