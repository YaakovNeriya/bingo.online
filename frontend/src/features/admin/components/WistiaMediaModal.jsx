import React, { useState, useEffect, useRef } from 'react';
import client from '../../../api/client';
import { X, Search, Upload, Play, Film, AlertTriangle, Trash2 } from 'lucide-react';
import SmartImage from '../../../components/ui/SmartImage';

const WistiaMediaModal = ({ isOpen, onClose, onSelect }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
    }
  }, [isOpen]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get('/admin/wistia/videos');
      setVideos(res.data);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת סרטונים מ-Wistia. בדוק שהטוקן תקין.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post('/admin/wistia/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Select the newly uploaded video automatically
      const newVideo = res.data;
      onSelect(`https://fast.wistia.net/embed/iframe/${newVideo.hashed_id}`);
      onClose();
    } catch (err) {
      console.error(err);
      setError('העלאת הסרטון נכשלה. אנא ודא שהקובץ תקין ובפורמט וידאו נתמך.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteVideo = async (e, hashedId, name) => {
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הסרטון "${name}" לצמיתות מ-Wistia?`)) return;
    try {
      await client.delete(`/admin/wistia/videos/${hashedId}`);
      setVideos(prev => prev.filter(v => v.hashed_id !== hashedId));
      if (previewId === hashedId) setPreviewId(null);
    } catch (err) {
      console.error(err);
      setError('שגיאה במחיקת הסרטון.');
    }
  };

  if (!isOpen) return null;

  const filteredVideos = videos.filter(vid => 
    vid.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      direction: 'rtl'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '98%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-color)' }}>ספריית סרטונים</h3>
            <span style={{ fontSize: '0.9rem', color: '#b43c50ff', fontWeight: 'bold', display: 'block', marginTop: '0.1rem' }}>
               הסרטון צריך להיות HD ולא יותר
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(249, 126, 38, 0.97)',
            border: 'none',
            borderRadius: '20%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-light)',
            transition: 'all 0.2s'
          }} className="btn-hover-danger">
            <X size={25} />
          </button>
        </div>

        {/* Search and Upload bar */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          padding: '0rem 2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '10px' }}>
            <Search size={22} style={{ position: 'absolute', right: '30%', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingRight: '2.5rem', width: '100%' }}
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="video/*" 
            style={{ display: 'none' }} 
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Upload size={18} />
            {uploading ? `מעלה... ${uploadProgress}%` : 'העלה סרטון חדש'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            margin: '1rem 2rem 0 2rem',
            padding: '1rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '1rem' }}>
              <Film className="animate-spin" size={40} color="var(--primary-color)" />
              <span style={{ color: 'var(--text-light)' }}>טוען סרטונים מ-Wistia...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              לא נמצאו סרטונים תואמים.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.9rem'
            }}>
              {filteredVideos.map(vid => {
                const isPreviewing = previewId === vid.hashed_id;
                return (
                  <div key={vid.hashed_id} className="glass-panel hover-lift" style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    {/* Thumbnail / Player area */}
                    <div style={{ aspectRatio: '16/9', position: 'relative', background: '#000', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                        <button 
                          type="button" 
                          onClick={(e) => handleDeleteVideo(e, vid.hashed_id, vid.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                          }}
                          title="מחק סרטון"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {isPreviewing ? (
                        <iframe 
                          src={`https://fast.wistia.net/embed/iframe/${vid.hashed_id}`}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                          frameBorder="0"
                          allowFullScreen
                          title={vid.name}
                        />
                      ) : (
                        <>
                          <img 
                            src={vid.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'} 
                            alt={vid.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => setPreviewId(vid.hashed_id)}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '44px',
                              height: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'white',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}
                          >
                            <Play size={20} fill="white" />
                          </button>
                        </>
                      )}
                      
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {formatDuration(vid.duration)}
                      </div>
                    </div>

                    {/* Meta & Actions */}
                    <div style={{ padding: '0.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-color)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '1.7rem', lineHeight: '1' }}>
                        {vid.name}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            onSelect(`https://fast.wistia.net/embed/iframe/${vid.hashed_id}`);
                            onClose();
                          }}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                          בחר סרטון
                        </button>
                        {isPreviewing && (
                          <button 
                            type="button" 
                            onClick={() => setPreviewId(null)}
                            className="btn"
                            style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-color)' }}
                          >
                            סגור נגן
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WistiaMediaModal;
