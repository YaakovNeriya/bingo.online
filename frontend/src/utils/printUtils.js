import { getStatusStyle, getStatusLabel } from '../features/admin/utils/adminUtils';

export const generatePrintHtml = (responses, title = "הדפסת נתונים") => {
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
              <span class="name">${c.first_name} ${c.last_name || ''}</span>
              <span class="phone" style="margin-right: 8px;">${c.phone || ''}</span>
            </div>
            <span class="total">${Number(c.total || 0).toFixed(2)}₪</span>
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
                    <td>${Number(item.price || 0).toFixed(2)}₪</td>
                    <td><span class="status-badge" style="background: ${getStatusStyle(item.status).background}; color: ${getStatusStyle(item.status).color};">${getStatusLabel(item.status)}</span></td>
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
      <title>${title}</title>
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
  
  return fullHtml;
};

export const generateSeasonStatsPrintHtml = (stats, title = "סיכום עונה") => {
  let htmlContent = `
    <div class="header" style="position: relative; margin-bottom: 30px;">
      <div style="position: absolute; right: 0; bottom: 0; font-size: 11px; color: #64748b; font-weight: 500;">בסיעת דשמייה</div>
      <h1>📊 ${title}</h1>
      <div style="display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
        <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: #64748b;">סה"כ הכנסות</div>
          <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${parseFloat(stats.total_revenue || 0).toFixed(2)}₪</div>
        </div>
        <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: #64748b;">סה"כ מטרים</div>
          <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${parseFloat(stats.total_meters || 0).toFixed(1)}m</div>
        </div>
        <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; color: #64748b;">מוצרים נמכרו</div>
          <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${stats.total_items || 0}</div>
        </div>
      </div>
    </div>
  `;

  if (stats.items_stats && stats.items_stats.length > 0) {
    htmlContent += `
      <table style="width: 100%; border-collapse: collapse; text-align: right; margin-top: 20px;">
        <thead>
          <tr>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">מק"ט</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">קטגוריה</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">מוצר</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">צבע</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">מטרים</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">הכנסות</th>
            <th style="background: #f8fafc; padding: 8px 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">הזמנות</th>
          </tr>
        </thead>
        <tbody>
          ${stats.items_stats.map(item => `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.sku || '-'}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.category}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 500;">${item.product_name}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.color_name}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${parseFloat(item.total_meters).toFixed(1)}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 600;">${parseFloat(item.total_revenue).toFixed(2)}₪</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">${item.total_orders}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    htmlContent += `<div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">אין נתונים להצגה</div>`;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #0f172a;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 { font-size: 20px; margin: 0 0 10px 0; color: #0f172a; }
        @media print {
          body { padding: 10px; }
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
  
  return fullHtml;
};
