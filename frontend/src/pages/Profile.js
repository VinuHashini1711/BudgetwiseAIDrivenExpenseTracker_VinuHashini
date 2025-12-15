import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import '../styles/Profile.css';

export default function Profile(){
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: user?.email || '',
    occupation: '',
    address: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: '',
    profileImageUrl: '',
    createdAt: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile...');
      const response = await axios.get('/api/profile');
      console.log('Profile response:', response.data);
      const data = response.data;
      setProfile({
        fullName: data.fullName || '',
        email: data.email || user?.email || '',
        occupation: data.occupation || '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        dateOfBirth: data.dateOfBirth || '',
        bio: data.bio || '',
        profileImageUrl: data.profileImageUrl || '',
        createdAt: data.createdAt || null
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use default values if API fails
      setProfile(prev => ({
        ...prev,
        email: user?.email || prev.email
      }));
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Legacy Member';
    const date = new Date(dateString);
    const options = { month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Prepare data with only non-empty values
      const updateData = {
        fullName: profile.fullName.trim() || undefined,
        occupation: profile.occupation.trim() || undefined,
        address: profile.address.trim() || undefined,
        phoneNumber: profile.phoneNumber.trim() || undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
        bio: profile.bio.trim() || undefined
      };
      
      console.log('Saving profile with data:', updateData);
      
      // Update profile via backend API
      const response = await axios.put('/api/profile', updateData);
      
      console.log('Save response:', response.data);
      
      const updatedData = response.data;
      // Update state with response data to ensure data persists
      setProfile({
        fullName: updatedData.fullName || '',
        email: updatedData.email || user?.email || '',
        occupation: updatedData.occupation || '',
        address: updatedData.address || '',
        phoneNumber: updatedData.phoneNumber || '',
        dateOfBirth: updatedData.dateOfBirth || '',
        bio: updatedData.bio || '',
        profileImageUrl: updatedData.profileImageUrl || ''
      });
      
      alert('Profile saved successfully!');
      // Reload profile to confirm persistence
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if(!profile) return <div>Loading...</div>;

  const age = calculateAge(profile.dateOfBirth);
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Profile</h1>
        <div style={{ color: '#6b7280' }}>Manage your personal information</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Profile Picture and Name */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div>
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />
            ) : profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }} />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: 'white',
                marginBottom: 16
              }}>{getInitial(profile.fullName)}</div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div onClick={() => setShowUploader(s => !s)} style={{ cursor: 'pointer', color: '#2563eb', marginBottom: 8 }}>
              {showUploader ? 'Cancel' : (profile.profileImageUrl || previewUrl) ? 'Change profile picture' : 'Add profile picture'}
            </div>
            {showUploader && (
              <div>
                {/* hidden native input - will be triggered by Choose button */}
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    onClick={() => document.getElementById('avatar-input').click()}
                  >
                    Choose File
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      if (!selectedFile) return alert('Select an image first');
                      const fd = new FormData();
                      fd.append('file', selectedFile);
                      try {
                        setLoading(true);
                        const res = await axios.post('/api/profile/avatar', fd, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        });
                        const data = res.data;
                        // update local profile
                        const updated = { ...profile };
                        if (data.profileImageUrl) updated.profileImageUrl = data.profileImageUrl;
                        setProfile(updated);
                        setShowUploader(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        alert('Profile picture uploaded');
                      } catch (err) {
                        console.error(err);
                        const status = err?.response?.status;
                        const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Upload failed';
                        alert(`Upload failed (status ${status}): ${msg}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{profile.fullName}</div>
          <div style={{ color: '#6b7280', marginBottom: 8 }}>{profile.email}</div>
          <div style={{ color: '#6b7280' }}>{profile.occupation}</div>
        </div>

        {/* Member Since */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#6366f1',
            marginBottom: 16
          }}>
            📅
          </div>
          <div style={{ color: '#6b7280', marginBottom: 4 }}>Member Since</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#6366f1' }}>{memberSince}</div>
        </div>

        {/* Age */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#faf5ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#9333ea',
            marginBottom: 16
          }}>
            🎂
          </div>
          <div style={{ color: '#6b7280', marginBottom: 4 }}>Age</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#9333ea' }}>
            {calculateAge(profile.dateOfBirth)} years
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Personal Information</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Full Name */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#6366f1',
              flexShrink: 0
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Contact support to change your name</div>
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#dc2626',
              flexShrink: 0
            }}>
              ✉️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => handleChange('email', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                disabled
              />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Contact support to change your email</div>
            </div>
          </div>

          {/* Occupation */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#0284c7',
              flexShrink: 0
            }}>
              💼
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={e => handleChange('occupation', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#16a34a',
              flexShrink: 0
            }}>
              📱
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Phone Number</label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={e => handleChange('phoneNumber', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#d97706',
              flexShrink: 0
            }}>
              📍
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={e => handleChange('address', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#9333ea',
              flexShrink: 0
            }}>
              📅
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Date of Birth</label>
              <input
                type="date"
                value={profile.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <div style={{ fontSize: 14, color: '#6366f1', marginTop: 4 }}>
                You are {calculateAge(profile.dateOfBirth)} years old
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: '#f5f3ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#7c3aed',
              flexShrink: 0,
              marginTop: 0
            }}>
              ✍️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#111827' }}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={e => handleChange('bio', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minHeight: 100 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleSave}
            className="btn"
            style={{ padding: '12px 24px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: 15 }}
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
