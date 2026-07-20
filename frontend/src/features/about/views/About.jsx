import React, { useState, useEffect, useContext } from 'react';
import { Mail, Phone, MapPin, Edit, Save, X, Image as ImageIcon, Upload, MessageCircle } from 'lucide-react';
import { AuthContext } from '../../auth/AuthContext';
import client from '../../../api/client';

const About = () => {
  const { user } = useContext(AuthContext);
  const [aboutText, setAboutText] = useState(
    'ברוכים הבאים לבינגו בדים, המקום בו אופנה, יצירה ואיכות נפגשים.\nאנחנו מאמינים שלכל אחד מגיע ליצור עם הבדים הטובים והאיכותיים ביותר.\nהחזון שלנו הוא להביא לכם את הטרנדים החדשים ביותר היישר מהיצרן, תוך שמירה על מחירים הוגנים ושירות מכל הלב.'
  );
  const [phone, setPhone] = useState('054-6594085');
  const [whatsapp, setWhatsapp] = useState('054-6594085');
  const [email, setEmail] = useState('hello@bingo.online');
  const [address, setAddress] = useState('תל אביב יפו');
  const [imageUrl, setImageUrl] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit states
  const [editText, setEditText] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await client.get('/products/public/settings');
        if (res.data) {
          if (res.data.about_text) setAboutText(res.data.about_text);
          if (res.data.about_phone) setPhone(res.data.about_phone);
          if (res.data.about_whatsapp) setWhatsapp(res.data.about_whatsapp);
          if (res.data.about_email) setEmail(res.data.about_email);
          if (res.data.about_address) setAddress(res.data.about_address);
          if (res.data.about_image_url) setImageUrl(res.data.about_image_url);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleEditClick = () => {
    setEditText(aboutText);
    setEditPhone(phone);
    setEditWhatsapp(whatsapp);
    setEditEmail(email);
    setEditAddress(address);
    setEditImageUrl(imageUrl);
    setIsEditing(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const { compressImageClientSide } = await import('../../../utils/imageCompression');
    const compressedFile = await compressImageClientSide(file);
    const formData = new FormData();
    formData.append('file', compressedFile);
    try {
      const res = await client.post('/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditImageUrl(res.data.image_url);
    } catch (err) {
      console.error("Failed to upload image", err);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        client.patch('/admin/settings/about_text', { value: editText }),
        client.patch('/admin/settings/about_phone', { value: editPhone }),
        client.patch('/admin/settings/about_email', { value: editEmail }),
        client.patch('/admin/settings/about_address', { value: editAddress }),
        client.patch('/admin/settings/about_image_url', { value: editImageUrl })
      ]);
      
      setAboutText(editText);
      setPhone(editPhone);
      setWhatsapp(editWhatsapp);
      setEmail(editEmail);
      setAddress(editAddress);
      setImageUrl(editImageUrl);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save about settings", err);
      alert('שגיאה בשמירת הנתונים');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '0', paddingBottom: '3rem' }}>
      <div className="glass-panel" style={{ position: 'relative', padding: '1.5rem', paddingTop: '1rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        
        {user?.is_superuser && (
          <button 
            onClick={handleEditClick}
            title="ערוך דף אודות"
            style={{
              position: 'absolute',
              right: '1rem',
              top: '1rem',
              background: '#ff0000ff',
              border: 'none',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <Edit size={22} />
          </button>
        )}

        <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--primary-color)', marginTop: '0' }}>אודות בינגו בדים</h1>
        
        <div style={{ marginBottom: '2rem', width: '100%' }}>
          <div style={{ 
            width: '100%', 
            height: '350px', 
            borderRadius: '16px', 
            background: 'var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-light)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '4px solid white'
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt="צוות בינגו בדים" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ImageIcon size={48} opacity={0.5} />
            )}
          </div>
        </div>

        <div style={{ fontSize: '1.2rem', lineHeight: '1.8', marginBottom: '2rem', color: 'var(--text-color)', whiteSpace: 'pre-wrap' }}>
          {aboutText}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '1.1rem' }}>
              <Phone size={20} color="var(--primary-color)" />
              <a 
                href={`tel:${phone.replace(/\D/g, '')}`} 
                style={{ color: 'inherit', textDecoration: 'none' }}
                dir="ltr"
              >
                {phone}
              </a>
            </div>
          )}
          {whatsapp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '1.1rem' }}>
              <MessageCircle size={20} color="#25D366" />
              <a 
                href={`https://wa.me/${whatsapp.replace(/\D/g, '').replace(/^0/, '972')}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {whatsapp}
              </a>
            </div>
          )}
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '1.1rem' }}>
              <Mail size={20} color="var(--primary-color)" />
              <span>{email}</span>
            </div>
          )}
          {address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '1.1rem' }}>
              <MapPin size={20} color="var(--primary-color)" />
              <span>{address}</span>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <div className="glass-panel" style={{ 
            padding: '2.5rem', 
            width: '100%', 
            maxWidth: '650px',
            position: 'relative',
            borderRadius: '16px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button 
              onClick={() => setIsEditing(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>עריכת דף אודות</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              
              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>תמונת צוות / עסק</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {editImageUrl && (
                    <img src={editImageUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                  <label className="btn" style={{ background: 'var(--glass-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={18} />
                    {isUploading ? 'מעלה...' : 'העלה תמונה'}
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>טקסט חופשי</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>טלפון החנות (לשיחות)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>וואטסאפ (מסונכרן למשתמש שלך)</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    disabled
                    dir="ltr"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(200,200,200,0.3)', color: 'var(--text-light)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>אימייל</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    dir="ltr"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>כתובת</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)' }}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setIsEditing(false)}
                className="btn"
                style={{ background: 'var(--glass-bg)', color: 'var(--text-color)', border: '1px solid var(--glass-border)' }}
              >
                ביטול
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={18} />
                {isSaving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
