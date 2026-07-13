import { useState } from 'react';
import client from '../../../api/client';
import { generatePrintHtml } from '../../../utils/printUtils';

export const useCustomerSorting = (regions) => {
  // Smart sort state
  const [sortedData, setSortedData] = useState({});
  const [sortingRegion, setSortingRegion] = useState({});
  const [sortMode, setSortMode] = useState({});
  const [isPrintingAll, setIsPrintingAll] = useState(false);

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
    if (!printWindow) {
      alert('החלון נחסם. אנא אשר חלונות קופצים.');
      return;
    }
    
    const html = generatePrintHtml([{ region: { name: regionName }, data }], `הדפסת אזור - ${regionName}`);
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handlePrintAllSorted = async () => {
    setIsPrintingAll(true);
    
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
      
      const fullHtml = generatePrintHtml(responses, 'הדפסת כל האזורים ממוינים');
      
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (err) {
      console.error(err);
      printWindow.document.write('<h2>שגיאה בהכנת הנתונים</h2>');
      alert('שגיאה בשליפת נתוני כל האזורים');
    } finally {
      setIsPrintingAll(false);
    }
  };

  return {
    sortedData,
    sortingRegion,
    sortMode,
    isPrintingAll,
    handleSmartSort,
    handlePrint,
    handlePrintAllSorted
  };
};
