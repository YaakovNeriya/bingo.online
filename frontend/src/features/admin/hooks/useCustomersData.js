import { useState, useEffect } from 'react';
import client from '../../../api/client';

export const useCustomersData = () => {
  const [regions, setRegions] = useState([]);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [regionCustomers, setRegionCustomers] = useState({});
  const [loadingRegion, setLoadingRegion] = useState({});

  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  const [loadingCustomer, setLoadingCustomer] = useState({});

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

  const handleImpersonate = (customer) => {
    if (window.confirm(`האם ברצונך להתחזות ולהיכנס לעגלה של ${customer.first_name} ${customer.last_name}?`)) {
      localStorage.setItem('impersonatedUserId', customer.id);
      localStorage.setItem('impersonatedUserName', `${customer.first_name} ${customer.last_name}`);
      window.location.href = '/cart';
    }
  };

  return {
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
  };
};
