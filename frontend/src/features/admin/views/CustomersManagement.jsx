import React from 'react';
import { Loader2, Printer } from 'lucide-react';
import { useCustomersData } from '../hooks/useCustomersData';
import { useCustomerSorting } from '../hooks/useCustomerSorting';
import { RegionCard } from '../components/RegionCard';

const CustomersManagement = () => {
  const {
    regions,
    expandedRegion,
    regionCustomers,
    loadingRegion,
    expandedCustomer,
    customerOrders,
    loadingCustomer,
    toggleRegion,
    toggleCustomer,
    handleImpersonate,
    fetchRegions
  } = useCustomersData();

  const {
    sortedData,
    sortingRegion,
    sortMode,
    isPrintingAll,
    handleSmartSort,
    handlePrint,
    handlePrintAllSorted
  } = useCustomerSorting(regions);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>ניהול לקוחות</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>

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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {regions.map(region => (
          <RegionCard
            key={region.id}
            region={region}
            expandedRegion={expandedRegion}
            toggleRegion={toggleRegion}
            sortMode={sortMode}
            sortingRegion={sortingRegion}
            sortedData={sortedData}
            handleSmartSort={handleSmartSort}
            handlePrint={handlePrint}
            loadingRegion={loadingRegion}
            regionCustomers={regionCustomers}
            expandedCustomer={expandedCustomer}
            toggleCustomer={toggleCustomer}
            handleImpersonate={handleImpersonate}
            loadingCustomer={loadingCustomer}
            customerOrders={customerOrders}
          />
        ))}
        {regions.length === 0 && <p>אין אזורים במערכת.</p>}
      </div>
    </div>
  );
};

export default CustomersManagement;
