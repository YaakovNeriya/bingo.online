import React, { useState, useEffect } from 'react';
import client from '../../../api/client';
import { Archive, Printer, Loader2 } from 'lucide-react';
import { generatePrintHtml, generateSeasonStatsPrintHtml } from '../../../utils/printUtils';

const SeasonArchives = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/season-archives');
      setArchives(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async (archive) => {
    setPrintingId(archive.id);
    
    // Open window immediately to prevent popup blocking
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html dir="rtl"><head><meta charset="UTF-8"></head><body style="font-family: system-ui; text-align: center; margin-top: 50px;"><h2>טוען מהארכיון, אנא המתן...</h2></body></html>');
    } else {
      alert('החלון נחסם על ידי הדפדפן. אנא אשר חלונות קופצים עבור אתר זה.');
      setPrintingId(null);
      return;
    }

    try {
      const res = await client.get(`/admin/season-archives/${archive.id}`);
      const archiveData = res.data.archive_data;
      
      let fullHtml;
      if (Array.isArray(archiveData)) {
        fullHtml = generatePrintHtml(archiveData, `ארכיון עונה - ${archive.season_name}`);
      } else {
        fullHtml = generateSeasonStatsPrintHtml(archiveData, `ארכיון עונה - ${archive.season_name}`);
      }
      
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (err) {
      console.error('Error fetching archive full HTML', err);
      if (printWindow) printWindow.close();
      alert('שגיאה בטעינת הארכיון');
    } finally {
      setPrintingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} style={{ animation: 'spin 2s linear infinite', color: '#4c1d95' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>ארכיון עונות</h2>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {archives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            <Archive size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>אין עדיין עונות בארכיון.</p>
            <p style={{ fontSize: '0.9rem' }}>ניתן לשמור עונה לארכיון דרך מסך "לקוחות".</p>
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem' }}>שם העונה</th>
                <th style={{ padding: '1rem' }}>תאריך שמירה</th>
                <th style={{ padding: '1rem', width: '150px', textAlign: 'center' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {archives.map(archive => (
                <tr key={archive.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{archive.season_name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{formatDate(archive.created_at)}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleReprint(archive)}
                      disabled={printingId === archive.id}
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'transparent',
                        color: '#4c1d95',
                        border: '1px solid #4c1d95',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: printingId === archive.id ? 'not-allowed' : 'pointer',
                        opacity: printingId === archive.id ? 0.7 : 1,
                        transition: 'opacity 0.2s, background-color 0.2s, color 0.2s, border-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (printingId !== archive.id) {
                          e.currentTarget.style.background = '#4c1d95';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (printingId !== archive.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#4c1d95';
                        }
                      }}
                    >
                      {printingId === archive.id ? (
                        <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} />
                      ) : (
                        <Printer size={16} />
                      )}
                      הדפס מחדש
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SeasonArchives;
