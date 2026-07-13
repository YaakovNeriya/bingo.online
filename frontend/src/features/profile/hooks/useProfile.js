import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import client from '../../../api/client';

export const useProfile = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [regions, setRegions] = useState([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    region_id: '',
    password: '',
    confirm_password: '',
    current_password: ''
  });

  // Load regions and initialize form
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await client.get('/users/regions');
        setRegions(res.data || []);
      } catch (err) {
        console.error('Failed to fetch regions', err);
      } finally {
        setIsLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  // Update form data when user context is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        region_id: user.region_id || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear alerts on user typing
    setError(null);
    setSuccessMessage(null);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const isImpersonating = !!localStorage.getItem('impersonatedUserId');

    // Validate password change
    if (formData.password) {
      if (!isImpersonating && !formData.current_password) {
        setError('יש להזין את הסיסמה הנוכחית כדי לקבוע סיסמה חדשה');
        setIsSaving(false);
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setError('הסיסמה החדשה ואימות הסיסמה אינם תואמים');
        setIsSaving(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('הסיסמה החדשה חייבת להיות לפחות באורך 6 תווים');
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        region_id: formData.region_id ? parseInt(formData.region_id) : null
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.current_password = formData.current_password;
      }

      await client.put('/users/me', payload);
      
      // Update global AuthContext user
      if (refreshUser) await refreshUser();

      setSuccessMessage('הפרופיל עודכן בהצלחה!');
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirm_password: '',
        current_password: ''
      }));
    } catch (err) {
      console.error("Profile update failed:", err, err.response?.data);
      let msg = 'עדכון הפרופיל נכשל. אנא נסה שנית.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map(e => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        }
      } else if (err.message) {
        msg += ` (${err.message})`;
      }
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    regions,
    isLoadingRegions,
    isSaving,
    error,
    successMessage,
    formData,
    handleChange,
    updateProfile
  };
};
