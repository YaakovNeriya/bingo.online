import React, { useState, useEffect } from 'react';
import client from '../../../api/client';

const BackupsManagement = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.get('/admin/backups');
      setBackups(res.data);
    } catch (err) {
      console.error(err);
      setError("שגיאה בטעינת היסטוריית הגיבויים.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleTriggerBackup = async () => {
    if (!window.confirm("להפעיל גיבוי עכשיו? הפעולה תרוץ ברקע.")) {
      return;
    }
    
    try {
      setTriggering(true);
      setError(null);
      setSuccessMsg(null);
      await client.post('/admin/backups/trigger');
      setSuccessMsg("הגיבוי החל. נא לרענן את העמוד בעוד מספר דקות.");
    } catch (err) {
      console.error(err);
      setError("שגיאה בהפעלת גיבוי.");
    } finally {
      setTriggering(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr) => {
    const date = new Date(isoStr);
    return date.toLocaleString('he-IL');
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>ניהול גיבויים</h2>
        <button 
          className="btn btn-primary" 
          onClick={handleTriggerBackup}
          disabled={triggering}
        >
          {triggering ? "מפעיל גיבוי..." : "בצע גיבוי עכשיו"}
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', background: '#e6ffe6', border: '1px solid green', borderRadius: '4px' }}>{successMsg}</div>}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>ℹ️ מדריך שחזור במקרה חירום:</h4>
        <ul style={{ margin: 0, paddingRight: '1.2rem', color: '#475569' }}>
          <li><strong>לשחזור מהיר מגיבוי מקומי:</strong> יש להריץ בשרת את הסקריפט <code>restore_backup.py</code> ולבחור מהרשימה.</li>
          <li><strong>לשחזור מלא מהענן (Google Drive):</strong> יש להריץ בשרת את סקריפט הענן <code>restore_from_drive.py</code> והוא ימשוך אוטומטית את הגיבוי האחרון וישחזר הכל.</li>
        </ul>
      </div>

      {loading ? (
        <div>טוען גיבויים...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>שם הגיבוי (תאריך)</th>
              <th>תאריך יצירה</th>
              <th>גודל מסד נתונים (DB)</th>
              <th>גודל תמונות</th>
              <th>סטטוס תקינות</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>לא נמצאו גיבויים מקומיים.</td>
              </tr>
            ) : (
              backups.map(backup => (
                <tr key={backup.name}>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{backup.name}</td>
                  <td>{formatDate(backup.created_at)}</td>
                  <td>{formatBytes(backup.db_size_bytes)}</td>
                  <td>{formatBytes(backup.images_size_bytes)}</td>
                  <td>
                    {backup.is_valid ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>תקין ✓</span>
                    ) : (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>פגום ✗</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BackupsManagement;
