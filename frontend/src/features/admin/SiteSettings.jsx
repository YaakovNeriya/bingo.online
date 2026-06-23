import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { Upload, X, ArrowRight, ArrowLeft } from 'lucide-react';

const SiteSettings = () => {
  const [settings, setSettings] = useState({});
  const [carouselImages, setCarouselImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await client.get('/admin/settings');
      const settingsMap = {};
      res.data.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      // Default fallback
      if (!settingsMap['minimum_order_length']) {
        settingsMap['minimum_order_length'] = '1.0';
      }
      setSettings(settingsMap);
      
      if (settingsMap['carousel_images']) {
        try {
          setCarouselImages(JSON.parse(settingsMap['carousel_images']));
        } catch(e) {
          console.error("Failed to parse carousel images", e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await client.post('/admin/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrls.push(res.data.image_url);
      }
      setCarouselImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      alert('שגיאה בהעלאת התמונות');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setCarouselImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const moveImage = (index, direction) => {
    setCarouselImages(prev => {
      const newArr = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;
      return newArr;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.patch('/admin/settings/minimum_order_length', {
        value: (settings.minimum_order_length || '').toString()
      });
      await client.patch('/admin/settings/main_page_title', {
        value: settings.main_page_title || ''
      });
      await client.patch('/admin/settings/main_page_subtitle', {
        value: settings.main_page_subtitle || ''
      });
      await client.patch('/admin/settings/carousel_images', {
        value: JSON.stringify(carouselImages)
      });
      alert('ההגדרות נשמרו בהצלחה!');
    } catch (err) {
      alert('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>טוען הגדרות...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-color)' }}>הגדרות חנות (גלובליות)</h2>
      
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>מינימום לגזירה (מטרים):</label>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            האורך המינימלי שמותר ללקוח לבחור
          </div>
          <input 
            type="number" 
            step="0.1" 
            min="0.1" 
            className="input-field"
            value={settings.minimum_order_length || ''} 
            onChange={e => setSettings({...settings, minimum_order_length: e.target.value})}
            required
            style={{ width: '150px' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>כותרת ראשית לעמוד הבית:</label>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            אם ריק, יוצג "הקטלוג שלנו"
          </div>
          <input 
            type="text" 
            className="input-field"
            value={settings.main_page_title || ''} 
            onChange={e => setSettings({...settings, main_page_title: e.target.value})}
            placeholder='הקטלוג שלנו'
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>כותרת משנית לעמוד הבית:</label>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            לדוגמה: "הזמנות עד 12/3"
          </div>
          <input 
            type="text" 
            className="input-field"
            value={settings.main_page_subtitle || ''} 
            onChange={e => setSettings({...settings, main_page_subtitle: e.target.value})}
            placeholder='(אופציונלי)'
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>תמונות קרוסלה (עמוד הבית):</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
            <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={16} style={{ marginLeft: '0.5rem' }} /> העלה תמונות לקרוסלה
            </button>
            {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>מעלה...</span>}
          </div>
          {carouselImages.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {carouselImages.map((url, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                    <img src={url} alt={`carousel-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => moveImage(index, -1)} 
                      disabled={index === 0}
                      style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1, padding: '2px 4px' }}
                    >
                      <ArrowRight size={16} color="var(--primary-color)" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveImage(index, 1)} 
                      disabled={index === carouselImages.length - 1}
                      style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === carouselImages.length - 1 ? 'not-allowed' : 'pointer', opacity: index === carouselImages.length - 1 ? 0.4 : 1, padding: '2px 4px' }}
                    >
                      <ArrowLeft size={16} color="var(--primary-color)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
};

export default SiteSettings;
