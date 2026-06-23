import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { ChevronDown, ChevronUp, MapPin, User, Package, DollarSign, Calendar, ArrowDownUp, Printer, ShoppingCart, Truck, Loader2 } from 'lucide-react';

const CustomersManagement = () => {
  const [regions, setRegions] = useState([]);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [regionCustomers, setRegionCustomers] = useState({});
  const [loadingRegion, setLoadingRegion] = useState({});

  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  const [loadingCustomer, setLoadingCustomer] = useState({});

  // Smart sort state
  const [sortedData, setSortedData] = useState({});
  const [sortingRegion, setSortingRegion] = useState({});
  const [sortMode, setSortMode] = useState({});
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await client.get('/admin/customers/regions');
      setRegions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRegion = async (regionId) => {
    if (expandedRegion === regionId) {
      setExpandedRegion(null);
      return;
    }
    setExpandedRegion(regionId);

    if (!regionCustomers[regionId]) {
      setLoadingRegion(prev => ({ ...prev, [regionId]: true }));
      try {
        const res = await client.get(`/admin/customers/regions/${regionId}`);
        setRegionCustomers(prev => ({ ...prev, [regionId]: res.data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRegion(prev => ({ ...prev, [regionId]: false }));
      }
    }
  };

  const toggleCustomer = async (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      return;
    }
    setExpandedCustomer(customerId);

    if (!customerOrders[customerId]) {
      setLoadingCustomer(prev => ({ ...prev, [customerId]: true }));
      try {
        const res = await client.get(`/admin/customers/${customerId}/orders`);
        setCustomerOrders(prev => ({ ...prev, [customerId]: res.data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCustomer(prev => ({ ...prev, [customerId]: false }));
      }
    }
  };

  const handleSmartSort = async (regionId) => {
    if (sortMode[regionId]) {
      setSortMode(prev => ({ ...prev, [regionId]: false }));
      return;
    }

    setSortingRegion(prev => ({ ...prev, [regionId]: true }));
    try {
      const res = await client.get(`/admin/customers/regions/${regionId}/sorted`);
      setSortedData(prev => ({ ...prev, [regionId]: res.data }));
      setSortMode(prev => ({ ...prev, [regionId]: true }));
    } catch (err) {
      console.error(err);
      alert('שגיאה במיון הלקוחות');
    } finally {
      setSortingRegion(prev => ({ ...prev, [regionId]: false }));
    }
  };

  const handlePrint = (regionId, regionName) => {
    const data = sortedData[regionId];
    if (!data) return;

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>רשימת לקוחות - ${regionName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Rubik', sans-serif; 
            padding: 20px 30px; 
            color: #1e293b; 
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 0; }
          .customer-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
            overflow: hidden;
          }
          .customer-header {
            background: #f1f5f9;
            padding: 6px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
          }
          .customer-header .index {
            background: #2563eb;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 11px;
            margin-left: 8px;
          }
          .customer-header .name { font-weight: 700; font-size: 13px; }
          .customer-header .phone { color: #64748b; font-size: 11px; }
          .customer-header .total { font-weight: 700; font-size: 13px; color: #0f172a; }
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th {
            background: #f8fafc;
            text-align: right;
            padding: 4px 10px;
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            border-bottom: 1px solid #e2e8f0;
          }
          .items-table td {
            padding: 4px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
          }
          .items-table tr:last-child td { border-bottom: none; }
          .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
          }
          .status-cart { background: #fef3c7; color: #92400e; }
          .status-received { background: #dbeafe; color: #1e40af; }
          .status-delivered { background: #dcfce7; color: #166534; }

          @media print {
            body { padding: 10px; }
            .customer-card { box-shadow: none; }
          }
          @page {
            margin: 15mm;
            @bottom-center {
              content: "עמוד " counter(page) " מתוך " counter(pages);
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 10px;
              color: #64748b;
            }
          }
        </style>
      </head>
      <body>
        <div class="header" style="position: relative;">
          <div style="position: absolute; right: 0; bottom: 0; font-size: 11px; color: #64748b; font-weight: 500;">בסיעת דשמייה</div>
          <h1>📦 ${regionName} <span style="font-size: 14px; color: #64748b; font-weight: normal; margin-right: 8px;">• ${data.length} לקוחות</span></h1>
        </div>
        ${data.map((c, idx) => `
          <div class="customer-card">
            <div class="customer-header">
              <div>
                <span class="index">${c.sort_index}</span>
                <span class="name">${c.first_name} ${c.last_name}</span>
                <span class="phone" style="margin-right: 8px;">${c.phone || ''}</span>
              </div>
              <span class="total">${c.total.toFixed(2)}₪</span>
            </div>
            ${c.items.length > 0 ? `
              <table class="items-table">
                <colgroup>
                  <col style="width: 15%;">
                  <col style="width: 25%;">
                  <col style="width: 15%;">
                  <col style="width: 10%;">
                  <col style="width: 10%;">
                  <col style="width: 10%;">
                  <col style="width: 15%;">
                </colgroup>
                ${idx === 0 ? `
                <thead>
                  <tr>
                    <th>קטגוריה</th>
                    <th>מוצר</th>
                    <th>צבע</th>
                    <th>אורך</th>
                    <th>יח'</th>
                    <th>סכום</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                ` : ''}
                <tbody>
                  ${c.items.map(item => `
                    <tr>
                      <td style="color:#64748b; font-size:11px;">${item.category}</td>
                      <td>${item.product_name}</td>
                      <td>${item.color_name}</td>
                      <td>${item.length_meters} מ'</td>
                      <td>${item.units > 1 ? item.units : ''}</td>
                      <td>${item.price.toFixed(2)}₪</td>
                      <td><span class="status-badge ${item.status === 'בעגלה' ? 'status-cart' : item.status === 'Received' ? 'status-received' : 'status-delivered'}">${item.status === 'Received' ? 'הזמנה' : item.status === 'Delivered' ? 'נשלח' : item.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="padding: 10px 14px; color: #94a3b8;">אין פריטים</p>'}
          </div>
        `).join('')}
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handlePrintAllSorted = async () => {
    setIsPrintingAll(true);
    
    // פתיחת החלון באופן סינכרוני למניעת חסימת פופ-אפים על ידי הדפדפן
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html dir="rtl"><head><meta charset="UTF-8"></head><body style="font-family: system-ui; text-align: center; margin-top: 50px;"><h2>מכין נתוני הדפסה, אנא המתן...</h2></body></html>');
    } else {
      alert('החלון נחסם על ידי הדפדפן. אנא אשר חלונות קופצים (Pop-ups) עבור אתר זה.');
      setIsPrintingAll(false);
      return;
    }

    try {
      const responses = await Promise.all(
        regions.map(r => client.get(`/admin/customers/regions/${r.id}/sorted`).then(res => ({ region: r, data: res.data })))
      );
      
      let htmlContent = '';
      
      responses.forEach(({ region, data }, index) => {
        if (!data || data.length === 0) return;
        
        if (htmlContent !== '') {
          htmlContent += '<div style="page-break-before: always;"></div>';
        }
        
        htmlContent += `
          <div class="header" style="position: relative;">
            <div style="position: absolute; right: 0; bottom: 0; font-size: 11px; color: #64748b; font-weight: 500;">בסיעת דשמייה</div>
            <h1>📦 ${region.name} <span style="font-size: 14px; color: #64748b; font-weight: normal; margin-right: 8px;">• ${data.length} לקוחות</span></h1>
          </div>
          ${data.map((c, idx) => `
            <div class="customer-card">
              <div class="customer-header">
                <div>
                  <span class="index">${c.sort_index}</span>
                  <span class="name">${c.first_name} ${c.last_name}</span>
                  <span class="phone" style="margin-right: 8px;">${c.phone || ''}</span>
                </div>
                <span class="total">${c.total.toFixed(2)}₪</span>
              </div>
              ${c.items.length > 0 ? `
                <table class="items-table">
                  <colgroup>
                    <col style="width: 15%;">
                    <col style="width: 25%;">
                    <col style="width: 15%;">
                    <col style="width: 10%;">
                    <col style="width: 10%;">
                    <col style="width: 10%;">
                    <col style="width: 15%;">
                  </colgroup>
                  ${idx === 0 ? `
                  <thead>
                    <tr>
                      <th>קטגוריה</th>
                      <th>מוצר</th>
                      <th>צבע</th>
                      <th>אורך</th>
                      <th>יח'</th>
                      <th>סכום</th>
                      <th>סטטוס</th>
                    </tr>
                  </thead>
                  ` : ''}
                  <tbody>
                    ${c.items.map(item => `
                      <tr>
                        <td style="color:#64748b; font-size:11px;">${item.category}</td>
                        <td>${item.product_name}</td>
                        <td>${item.color_name}</td>
                        <td>${item.length_meters} מ'</td>
                        <td>${item.units > 1 ? item.units : ''}</td>
                        <td>${item.price.toFixed(2)}₪</td>
                        <td><span class="status-badge ${item.status === 'בעגלה' ? 'status-cart' : item.status === 'Received' ? 'status-received' : 'status-delivered'}">${item.status === 'Received' ? 'הזמנה' : item.status === 'Delivered' ? 'נשלח' : item.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="padding: 10px 14px; color: #94a3b8;">אין פריטים</p>'}
            </div>
          `).join('')}
        `;
      });
      
      const fullHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>הדפסת כל האזורים ממוינים</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Rubik', sans-serif; 
              padding: 20px 30px; 
              color: #1e293b; 
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 0; }
            .customer-card {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              margin-bottom: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
            }
            .customer-header {
              background: #f1f5f9;
              padding: 6px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #e2e8f0;
            }
            .customer-header .index {
              background: #2563eb;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 11px;
              margin-left: 8px;
            }
            .customer-header .name { font-weight: 700; font-size: 13px; }
            .customer-header .phone { color: #64748b; font-size: 11px; }
            .customer-header .total { font-weight: 700; font-size: 13px; color: #0f172a; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            .items-table th {
              background: #f8fafc;
              text-align: right;
              padding: 4px 10px;
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
              border-bottom: 1px solid #e2e8f0;
            }
            .items-table td {
              padding: 4px 10px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 12px;
            }
            .items-table tr:last-child td { border-bottom: none; }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
            .status-cart { background: #fef3c7; color: #92400e; }
            .status-received { background: #dbeafe; color: #1e40af; }
            .status-delivered { background: #dcfce7; color: #166534; }
  
            @media print {
              body { padding: 10px; }
              .customer-card { box-shadow: none; }
            }
            @page {
              margin: 15mm;
              @bottom-center {
                content: "עמוד " counter(page) " מתוך " counter(pages);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 10px;
                color: #64748b;
              }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      
      // Use setTimeout to ensure images/fonts load, since we just rewrote the document
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (err) {
      console.error(err);
      if (printWindow) printWindow.close();
      alert('שגיאה בהכנת נתוני ההדפסה - ודא שיש אינטרנט תקין');
    } finally {
      setIsPrintingAll(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusStyle = (status) => {
    if (status === 'בעגלה') return { background: '#fef3c7', color: '#92400e' };
    if (status === 'Received') return { background: '#dbeafe', color: '#1e40af' };
    if (status === 'Delivered') return { background: '#dcfce7', color: '#166534' };
    return { background: '#e2e8f0', color: '#334155' };
  };

  const getStatusLabel = (status) => {
    if (status === 'בעגלה') return '🛒 בעגלה';
    if (status === 'Received') return '📦 הזמנה';
    if (status === 'Delivered') return '✅ נשלח';
    return status;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>ניהול לקוחות</h2>
        <button
          onClick={handlePrintAllSorted}
          disabled={isPrintingAll || regions.length === 0}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            padding: '0.6rem 1.2rem',
            fontWeight: '600',
            border: 'none',
            cursor: isPrintingAll ? 'not-allowed' : 'pointer',
            opacity: isPrintingAll ? 0.8 : 1,
            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
          }}
        >
          {isPrintingAll ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} />
              מכין הדפסה...
            </>
          ) : (
            <>
              <Printer size={18} />
              הדפס הכל ממוין
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {regions.map(region => (
          <div key={region.id} style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--primary-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            {/* Level 1: Region */}
            <div
              style={{
                padding: '1rem',
                background: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <MapPin color="var(--primary-color)" size={24} style={{ flexShrink: 0 }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', whiteSpace: 'nowrap' }}>{region.name}</h3>
                <span style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {region.customer_count} לקוחות
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>

                {expandedRegion === region.id && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSmartSort(region.id); }}
                      disabled={sortingRegion[region.id]}
                      style={{
                        background: sortMode[region.id] ? 'var(--primary-color)' : 'white',
                        color: sortMode[region.id] ? 'white' : 'var(--primary-color)',
                        border: '1px solid var(--primary-color)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: '0.2s',
                        opacity: sortingRegion[region.id] ? 0.6 : 1,
                        flexShrink: 0
                      }}
                    >
                      <ArrowDownUp size={16} />
                      {sortingRegion[region.id] ? 'ממיין...' : sortMode[region.id] ? 'ביטול מיון' : 'מיון חכם'}
                    </button>
                    {sortMode[region.id] && sortedData[region.id] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrint(region.id, region.name); }}
                        style={{
                          background: '#0f172a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}
                      >
                        <Printer size={16} />
                        הדפסה
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => toggleRegion(region.id)}
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    flexShrink: 0
                  }}
                >
                  {expandedRegion === region.id ? <ChevronUp size={24} color="var(--primary-color)" /> : <ChevronDown size={24} color="var(--primary-color)" />}
                </button>
              </div>
            </div>

            {/* Level 2: Customers */}
            {expandedRegion === region.id && (
              <div style={{ padding: '1.5rem', background: '#f8fafc' }}>
                {loadingRegion[region.id] ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>טוען רשימת לקוחות...</p>
                ) : sortMode[region.id] && sortedData[region.id] ? (
                  /* ========== SORTED VIEW ========== */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(139, 92, 246, 0.08))',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px dashed var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--primary-color)',
                      fontWeight: '500'
                    }}>
                      <ArrowDownUp size={16} />
                      ממוין לפי חפיפת מוצרים — לקוחות עם הזמנות דומות מופיעים ברצף
                    </div>
                    {sortedData[region.id].map(customer => (
                      <div key={customer.id} style={{
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        {/* Customer header with sort index */}
                        <div style={{
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f1f5f9',
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              background: 'var(--primary-color)',
                              color: 'white',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.95rem',
                              flexShrink: 0
                            }}>
                              {customer.sort_index}
                            </span>
                            <div>
                              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                                {customer.first_name} {customer.last_name}
                              </strong>
                              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>
                                {customer.phone || 'אין טלפון'} • {customer.email}
                              </div>
                            </div>
                          </div>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            color: 'var(--primary-color)',
                            flexShrink: 0
                          }}>
                            {customer.total.toFixed(2)}₪
                          </div>
                        </div>

                        {/* Items list */}
                        {customer.items.length > 0 ? (
                          <div style={{ padding: '0' }}>
                            {customer.items.map((item, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.7rem 1.25rem',
                                borderBottom: idx < customer.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                              }}>
                                <div style={{ flex: '1 1 180px' }}>
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '1px' }}>{item.category}</span>
                                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                                    {item.product_name}
                                  </strong>
                                  <span style={{ color: '#475569', marginRight: '4px' }}> — {item.color_name}</span>
                                  {item.sku && <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginRight: '6px' }}>({item.sku})</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#475569' }}>
                                    {item.length_meters} מ'
                                  </span>
                                  <span style={{ color: '#cbd5e1' }}>×</span>
                                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#475569' }}>
                                    {item.units} יח'
                                  </span>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem', minWidth: '70px', textAlign: 'left' }}>
                                  {item.price.toFixed(2)}₪
                                </div>
                                <span style={{
                                  ...getStatusStyle(item.status),
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>אין פריטים</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : regionCustomers[region.id]?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>אין לקוחות באזור זה.</p>
                ) : (
                  /* ========== NORMAL VIEW (existing) ========== */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {regionCustomers[region.id]?.map(customer => (
                      <div key={customer.id} style={{
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div
                          style={{
                            padding: '1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: expandedCustomer === customer.id ? '#f1f5f9' : 'white'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Top row: Name & Orders */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <User size={20} color="#475569" />
                                <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>{customer.first_name} {customer.last_name}</strong>
                              </div>
                              <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <Package size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
                                {customer.order_count} הזמנות
                              </span>
                            </div>
                            {/* Bottom row: Contact info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', color: '#64748b', fontSize: '0.95rem', paddingRight: '2.25rem' }}>
                              <span>{customer.phone || 'אין טלפון'}</span>
                              <span style={{ color: '#cbd5e1', display: customer.phone ? 'inline' : 'none' }}>|</span>
                              <span>{customer.email}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCustomer(customer.id)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              alignSelf: 'center'
                            }}
                          >
                            {expandedCustomer === customer.id ? <ChevronUp size={20} color="#475569" /> : <ChevronDown size={20} color="#475569" />}
                          </button>
                        </div>

                        {/* Level 3: Orders */}
                        {expandedCustomer === customer.id && (
                          <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderTop: '2px solid #e2e8f0' }}>
                            {loadingCustomer[customer.id] ? (
                              <p style={{ textAlign: 'center', color: '#64748b' }}>טוען היסטוריית הזמנות...</p>
                            ) : customerOrders[customer.id]?.length === 0 ? (
                              <p style={{ textAlign: 'center', color: '#64748b' }}>ללקוח זה אין הזמנות במערכת.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>היסטוריית הזמנות מפורטת:</h4>
                                {customerOrders[customer.id]?.map(order => (
                                  <div key={order.id} style={{ background: 'white', border: '1px solid #94a3b8', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                                    {/* Order Header */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#475569', alignItems: 'center' }}>
                                        <span style={{ background: '#1e293b', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem' }}>הזמנה #{order.id}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                          <Calendar size={16} />
                                          {formatDate(order.created_at)}
                                        </span>
                                        <span style={{ background: order.status === 'Delivered' ? '#dcfce7' : '#fef9c3', color: order.status === 'Delivered' ? '#166534' : '#854d0e', padding: '4px 10px', borderRadius: '4px', fontSize: '0.95rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center' }}>
                                        {order.total_price}₪
                                      </div>
                                    </div>

                                    {/* Order Items */}
                                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                                      {order.items.map((item, index) => (
                                        <div key={item.id} style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: '1rem',
                                          padding: '0.75rem 0',
                                          borderBottom: index !== order.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                                        }}>
                                          {/* Left side: Name & SKU */}
                                          <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>
                                              {item.color_sku?.product_model?.name} <span style={{ fontWeight: 'normal', color: '#475569' }}>- {item.color_sku?.color_name}</span>
                                            </strong>
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>מק"ט: {item.color_sku?.sku || 'ללא'}</span>
                                          </div>

                                          {/* Middle: Quantities */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 120px' }}>
                                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                              {item.length_meters} מטר
                                            </span>
                                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>×</span>
                                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                              {item.units} יח'
                                            </span>
                                          </div>

                                          {/* Right: Price */}
                                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem', textAlign: 'left', minWidth: '70px' }}>
                                            {item.price_at_purchase}₪
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {regions.length === 0 && <p>אין אזורים במערכת.</p>}
      </div>
    </div>
  );
};

export default CustomersManagement;
