import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, ShieldAlert, Archive, Loader2 } from 'lucide-react';
import client from '../../../api/client';

export default function SeasonTransition() {
  const [seasonName, setSeasonName] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Archive state
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveName, setArchiveName] = useState("");

  const handleArchiveSeason = async () => {
    if (!archiveName.trim()) {
      alert('אנא הזן שם לעונה (לדוגמה: קיץ 2024)');
      return;
    }
    
    const confirm = window.confirm("האם אתה בטוח שברצונך לסגור את העונה? פעולה זו תעביר את כל ההזמנות הקיימות לארכיון.");
    if (!confirm) return;

    setIsArchiving(true);
    try {
      await client.post('/admin/season/archive-orders', { season_name: archiveName });
      alert('העונה נסגרה ואורכבה בהצלחה! כל ההזמנות עברו לארכיון.');
      setShowArchiveModal(false);
      setArchiveName("");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('שגיאה בסגירת העונה לארכיון');
    } finally {
      setIsArchiving(false);
    }
  };

  const canSubmit = seasonName.trim() !== '' && confirmationText === 'אישור מחיקת עונה';

  const handleReset = async () => {
    if (!canSubmit) return;
    
    const confirm = window.confirm("האם אתה בטוח שברצונך לאפס את המערכת? פעולה זו תמחק את כל הנתונים לצמיתות.");
    if (!confirm) return;
    
    setLoading(true);
    setError(null);
    try {
      await client.post('/admin/season/reset', { season_name: seasonName, confirmation_text: confirmationText });
      setSuccess(true);
      setSeasonName('');
      setConfirmationText('');
    } catch (err) {
      setError(err.response?.data?.detail || 'אירעה שגיאה בביצוע מחיקת העונה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Archive Section */}
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Archive size={24} color="#4c1d95" />
              סגירת עונה לארכיון
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              שמירת נתוני הלקוחות וההזמנות במסמך הדפסה.
            </p>
          </div>
          <button
            onClick={() => setShowArchiveModal(true)}
            disabled={isArchiving}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#4c1d95',
              color: 'white',
              borderRadius: '8px',
              padding: '0.6rem 1.2rem',
              fontWeight: '600',
              border: 'none',
              cursor: isArchiving ? 'not-allowed' : 'pointer',
              opacity: isArchiving ? 0.8 : 1,
              boxShadow: '0 4px 6px rgba(76, 29, 149, 0.2)'
            }}
          >
            {isArchiving ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} />
                שומר...
              </>
            ) : (
              <>
                <Archive size={18} />
                סגור עונה
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reset System Section */}
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--danger-color)' }}>
        <ShieldAlert size={32} />
        <h2 style={{ margin: 0 }}>הכנה לעונה חדשה (איפוס מערכת)</h2>
      </div>

      {success ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#ecfdf5', color: '#059669', borderRadius: '8px' }}>
          <h3>✅ העונה אופסה בהצלחה!</h3>
          <p>הקטלוג נוקה, התמונות נמחקו, העגלות רוקנו והסטטיסטיקות גובו לארכיון.</p>
          <button className="btn" onClick={() => setSuccess(false)} style={{ marginTop: '1rem' }}>
            חזור
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h3 style={{ color: '#b91c1c', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> אזהרה חמורה
            </h3>
            <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
              פעולה זו היא <strong>בלתי הפיכה</strong> ותבצע את הפעולות הבאות מיד:
            </p>
            <ul style={{ color: '#991b1b', paddingInlineStart: '1.5rem' }}>
              <li><strong>גיבוי נתוני עונה:</strong> יישמרו נתוני מכירות (כמות מטרים והכנסות) של העונה הנוכחית לארכיון.</li>
              <li><strong>מחיקת עגלות קנייה:</strong> כל הפריטים בעגלות של הלקוחות יימחקו כליל.</li>
              <li><strong>מחיקת קטלוג:</strong> כל המוצרים, הצבעים והגדלים יימחקו ממסד הנתונים.</li>
              <li><strong>מחיקת תמונות:</strong> כל התמונות הפיזיות של הבדים יימחקו לצמיתות מהשרת לפינוי מקום.</li>
              <li><strong>ארכוב הזמנות:</strong> כל ההזמנות הפתוחות יהפכו להיסטוריה ולא יופיעו במסך הראשי.</li>
            </ul>
          </div>

          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>1. שם העונה לגיבוי (למשל: "סיכום חורף 2026")</label>
            <input 
              type="text" 
              className="input-field" 
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              placeholder="הכנס את שם העונה..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              2. הקלד <strong>"אישור מחיקת עונה"</strong> לאישור הפעולה:
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder='הקלד "אישור מחיקת עונה"'
              style={{ border: confirmationText === 'אישור מחיקת עונה' ? '2px solid #10b981' : '1px solid #ccc' }}
            />
          </div>

          <button 
            className="btn" 
            onClick={handleReset}
            disabled={!canSubmit || loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem',
              background: canSubmit ? 'var(--danger-color)' : '#cbd5e1',
              color: canSubmit ? 'white' : '#64748b',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? <RefreshCw className="spin" size={20} /> : <ShieldAlert size={20} />}
            {loading ? 'מבצע איפוס עונה...' : 'התחל עונה חדשה (מחק הכל)'}
          </button>
        </>
      )}
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--glass-bg)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-color)' }}>סגירת עונה לארכיון</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              פעולה זו תיצור מסמך הדפסה המכיל את הנתונים הנוכחיים של כל הלקוחות וההזמנות, ותשמור אותו בארכיון העונות של המערכת תחת השם שתבחר.
            </p>
            <div className="form-group">
              <label>שם העונה (למשל: "קיץ 2026"):</label>
              <input 
                type="text" 
                value={archiveName} 
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="הכנס שם לעונה"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setShowArchiveModal(false)}
                style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                disabled={isArchiving}
              >
                ביטול
              </button>
              <button 
                onClick={handleArchiveSeason}
                disabled={!archiveName.trim() || isArchiving}
                style={{ 
                  background: '#4c1d95', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (!archiveName.trim() || isArchiving) ? 0.7 : 1
                }}
              >
                {isArchiving ? <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} /> : <Archive size={16} />}
                שמור לארכיון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
