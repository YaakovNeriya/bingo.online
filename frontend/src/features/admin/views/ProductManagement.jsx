import React, { useEffect, useState, useRef } from 'react';
import client from '../../../api/client';
import { Trash2, Edit2, Upload, X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Film, Plus } from 'lucide-react';
import SmartImage from '../../../components/ui/SmartImage';
import WistiaMediaModal from '../components/WistiaMediaModal';

const ProductManagement = ({ editSkuId }) => {
  const [catalog, setCatalog] = useState([]);
  const [collapsedTypes, setCollapsedTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_collapsed_types');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [collapsedModels, setCollapsedModels] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_collapsed_models');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: null, mode: 'add' });

  // Forms state
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });
  const [modelForm, setModelForm] = useState({ id: null, name: '', product_type_id: '', base_price: '', fabric_height: '', image_url: '', video_url: '' });
  const [skuForm, setSkuForm] = useState({ id: null, sku: '', color_name: '', product_model_id: '', stock_meters: '', specific_price: '', image_urls: [] });
  const [isWistiaModalOpen, setIsWistiaModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const modelFileInputRef = useRef(null);
  const processedEditId = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [modelUploading, setModelUploading] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('admin_collapsed_types', JSON.stringify(collapsedTypes));
    } catch (err) {
      console.error('Failed to save collapsed types:', err);
    }
  }, [collapsedTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('admin_collapsed_models', JSON.stringify(collapsedModels));
    } catch (err) {
      console.error('Failed to save collapsed models:', err);
    }
  }, [collapsedModels]);

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, mode: 'add' });
  };

  const openAddCategoryModal = () => {
    setTypeForm({ id: null, name: '' });
    setModalState({ isOpen: true, type: 'category', mode: 'add' });
  };

  const openEditCategoryModal = (type) => {
    setTypeForm({ id: type.id, name: type.name });
    setModalState({ isOpen: true, type: 'category', mode: 'edit' });
  };

  const openAddModelModal = (typeId = '') => {
    setModelForm({ id: null, name: '', product_type_id: typeId || '', base_price: '', fabric_height: '1.5', image_url: '', video_url: '' });
    setModalState({ isOpen: true, type: 'model', mode: 'add' });
  };

  const openEditModelModal = (model, typeId = '') => {
    setModelForm({ 
      id: model.id, 
      name: model.name, 
      product_type_id: model.product_type_id || typeId || '', 
      base_price: model.base_price, 
      fabric_height: model.fabric_height,
      image_url: model.image_url || '',
      video_url: model.video_url || ''
    });
    setModalState({ isOpen: true, type: 'model', mode: 'edit' });
  };

  const openAddSkuModal = (modelId = '') => {
    setSkuForm({ id: null, sku: '', color_name: '', product_model_id: modelId || '', stock_meters: '', specific_price: '', image_urls: [] });
    setModalState({ isOpen: true, type: 'sku', mode: 'add' });
  };

  const openEditSkuModal = (sku, modelId, basePrice) => {
    setSkuForm({ 
      id: sku.id, 
      sku: sku.sku || '', 
      color_name: sku.color_name, 
      product_model_id: modelId, 
      stock_meters: sku.stock_meters, 
      specific_price: sku.specific_price ?? basePrice, 
      image_urls: sku.image_urls || [] 
    });
    setModalState({ isOpen: true, type: 'sku', mode: 'edit' });
  };

  const handleReorder = async (entity, id, direction) => {
    setReorderingId(`${entity}-${id}-${direction}`);
    try {
      await client.patch(`/admin/${entity}/${id}/reorder`, { direction });
      await fetchCatalog();
    } catch (err) {
      alert('שגיאה בשינוי סדר');
    } finally {
      setReorderingId(null);
    }
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= skuForm.image_urls.length) return;
    
    const newImageUrls = [...skuForm.image_urls];
    const temp = newImageUrls[index];
    newImageUrls[index] = newImageUrls[newIndex];
    newImageUrls[newIndex] = temp;
    
    setSkuForm(prev => ({ ...prev, image_urls: newImageUrls }));
  };

  const removeImage = (index) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק תמונה זו?")) return;
    const newImageUrls = [...skuForm.image_urls];
    newImageUrls.splice(index, 1);
    setSkuForm(prev => ({ ...prev, image_urls: newImageUrls }));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (catalog.length > 0 && editSkuId && processedEditId.current !== editSkuId) {
      processedEditId.current = editSkuId; // Mark as processed
      for (const type of catalog) {
        for (const model of type.product_models) {
          const sku = model.color_skus.find(s => s.id === editSkuId);
          if (sku) {
            openEditSkuModal(sku, model.id, model.base_price);
            return;
          }
        }
      }
    }
  }, [catalog, editSkuId]);

  const fetchCatalog = async () => {
    try {
      const res = await client.get('/products/catalog');
      setCatalog(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (typeForm.id) {
        await client.put(`/admin/product-types/${typeForm.id}`, { name: typeForm.name });
      } else {
        await client.post('/admin/product-types', { name: typeForm.name });
      }
      setTypeForm({ id: null, name: '' });
      closeModal();
      fetchCatalog();
    } catch (err) { alert(err.response?.data?.detail || 'שגיאה בשמירה'); }
  };

  const handleDeleteType = async (id, name) => {
    if (!window.confirm(`למחוק את הקטגוריה "${name}"?\nמחיקת קטגוריה תמחק גם את כל הדגמים והמק"טים שתחתיה.`)) return;
    try {
      await client.delete(`/admin/product-types/${id}`);
      fetchCatalog();
    } catch (err) { alert('שגיאה במחיקה'); }
  };

  const handleModelSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: modelForm.name,
        product_type_id: parseInt(modelForm.product_type_id),
        base_price: parseFloat(modelForm.base_price),
        fabric_height: modelForm.fabric_height ? parseFloat(modelForm.fabric_height) : 1.5,
        image_url: modelForm.image_url || null,
        video_url: modelForm.video_url || null
      };
      if (modelForm.id) {
        await client.put(`/admin/product-models/${modelForm.id}`, payload);
      } else {
        await client.post('/admin/product-models', payload);
      }
      setModelForm({ id: null, name: '', product_type_id: '', base_price: '', fabric_height: '', image_url: '', video_url: '' });
      closeModal();
      fetchCatalog();
    } catch (err) { alert(err.response?.data?.detail || 'שגיאה בשמירה'); }
  };

  const handleDeleteModel = async (id, name) => {
    if (!window.confirm(`למחוק את הדגם "${name}"?\nמחיקת דגם תמחק גם את כל הצבעים שלו.`)) return;
    try {
      await client.delete(`/admin/product-models/${id}`);
      fetchCatalog();
    } catch (err) { alert('שגיאה במחיקה'); }
  };

  const handleModelImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setModelUploading(true);
    try {
      const { compressImageClientSide } = await import('../../../utils/imageCompression');
      const compressedFile = await compressImageClientSide(file);
      
      const formData = new FormData();
      formData.append('file', compressedFile);
      const res = await client.post('/admin/upload-image?aspect_ratio=1:1', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setModelForm(prev => ({ ...prev, image_url: res.data.image_url }));
    } catch (err) {
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setModelUploading(false);
      if (modelFileInputRef.current) modelFileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const { compressImageClientSide } = await import('../../../utils/imageCompression');
      const newUrls = [];
      for (const file of files) {
        const compressedFile = await compressImageClientSide(file);
        
        const formData = new FormData();
        formData.append('file', compressedFile);
        const res = await client.post('/admin/upload-image?aspect_ratio=1:1', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrls.push(res.data.image_url);
      }
      setSkuForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ...newUrls] }));
    } catch (err) {
      alert('שגיאה בהעלאת התמונות');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddWistiaVideo = (url) => {
    setModelForm(prev => ({ ...prev, video_url: url }));
  };

  const handleSkuSubmit = async (e) => {
    e.preventDefault();
    try {
      let basePrice = null;
      for (const type of catalog) {
        const model = type.product_models.find(m => m.id === parseInt(skuForm.product_model_id));
        if (model) {
          basePrice = model.base_price;
          break;
        }
      }

      let finalSpecificPrice = skuForm.specific_price ? parseFloat(skuForm.specific_price) : null;
      if (basePrice !== null && finalSpecificPrice === basePrice) {
        finalSpecificPrice = null;
      }

      const payload = {
        sku: skuForm.sku || null,
        color_name: skuForm.color_name,
        product_model_id: parseInt(skuForm.product_model_id),
        stock_meters: parseFloat(skuForm.stock_meters),
        specific_price: finalSpecificPrice,
        image_urls: skuForm.image_urls
      };
      if (skuForm.id) {
        await client.put(`/admin/color-skus/${skuForm.id}`, payload);
      } else {
        await client.post('/admin/color-skus', payload);
      }
      setSkuForm({ id: null, sku: '', color_name: '', product_model_id: '', stock_meters: '', specific_price: '', image_urls: [] });
      if (fileInputRef.current) fileInputRef.current.value = "";
      closeModal();
      fetchCatalog();
    } catch (err) { alert(err.response?.data?.detail || 'שגיאה בשמירה'); }
  };

  const handleDeleteSku = async (id, name) => {
    if (!window.confirm(`למחוק את הצבע "${name}"?`)) return;
    try {
      await client.delete(`/admin/color-skus/${id}`);
      fetchCatalog();
    } catch (err) { alert('שגיאה במחיקת מק"ט'); }
  };

  const toggleType = (id) => {
    setCollapsedTypes(prev => {
      const isCurrCollapsed = prev[id] !== false;
      return { ...prev, [id]: !isCurrCollapsed };
    });
  };

  const toggleModel = (id) => {
    setCollapsedModels(prev => {
      const isCurrCollapsed = prev[id] !== false;
      return { ...prev, [id]: !isCurrCollapsed };
    });
  };

  const filteredCatalog = catalog.map(type => {
    const matchesType = type.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const filteredModels = type.product_models.map(model => {
      const matchesModel = model.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const filteredSkus = model.color_skus.filter(sku => 
        sku.color_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (sku.sku && sku.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (matchesModel || filteredSkus.length > 0) {
        return { 
          ...model, 
          color_skus: matchesModel && filteredSkus.length === 0 ? model.color_skus : filteredSkus 
        };
      }
      return null;
    }).filter(Boolean);
    
    if (matchesType || filteredModels.length > 0) {
      return { 
        ...type, 
        product_models: matchesType && filteredModels.length === 0 ? type.product_models : filteredModels 
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div style={{ paddingBottom: '8rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>ניהול מוצרים</h2>
        <button 
          className="btn btn-primary" 
          onClick={openAddCategoryModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> הוסף קטגוריה
        </button>
      </div>

      {/* Catalog Search & List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>קטלוג המוצרים הקיים</h3>
        <input 
          type="text" 
          className="input-field" 
          placeholder="חיפוש קטגוריה, דגם או צבע..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          style={{ maxWidth: '300px', margin: 0 }}
        />
      </div>

      <div className="glass-panel" style={{ padding: '0.5rem' }}>
        {filteredCatalog.length === 0 ? <p>{searchTerm ? 'לא נמצאו תוצאות לחיפוש.' : 'אין מוצרים בקטלוג.'}</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredCatalog.map((type, tIndex) => {
              const isCollapsed = searchTerm ? false : (collapsedTypes[type.id] !== false);
              return (
                <div key={type.id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                  <div className="admin-type-row">
                    <div className="admin-reorder-col">
                      <button className="admin-icon-btn" disabled={tIndex === 0 || reorderingId === `product-types-${type.id}-up`} onClick={() => handleReorder('product-types', type.id, 'up')} style={{ color: 'var(--text-color)' }} title="העבר למעלה"><ArrowUp size={16} /></button>
                      <button className="admin-icon-btn" disabled={tIndex === catalog.length - 1 || reorderingId === `product-types-${type.id}-down`} onClick={() => handleReorder('product-types', type.id, 'down')} style={{ color: 'var(--text-color)' }} title="העבר למטה"><ArrowDown size={16} /></button>
                    </div>
                    
                    <div 
                      onClick={() => toggleType(type.id)} 
                      style={{ cursor: 'pointer', flex: 1, userSelect: 'none' }}
                    >
                      <h4 style={{ fontSize: '1.25rem', color: 'var(--text-color)', margin: 0, fontWeight: 'bold', textAlign: 'right' }}>{type.name}</h4>
                    </div>

                    <div className="admin-actions-col" style={{ alignItems: 'center' }}>
                      <button 
                        onClick={() => openAddModelModal(type.id)} 
                        style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }} 
                        title="הוסף דגם לקטגוריה זו"
                      >
                        <Plus size={18} />
                      </button>
                      <button className="admin-icon-btn" onClick={() => openEditCategoryModal(type)} style={{ color: '#3b82f6' }} title="ערוך קטגוריה"><Edit2 size={20} /></button>
                      <button className="admin-icon-btn" onClick={() => handleDeleteType(type.id, type.name)} style={{ color: '#ff0000ff' }} title="מחק קטגוריה"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  {!isCollapsed && type.product_models.map((model, mIndex) => {
                    const isModelCollapsed = searchTerm ? false : (collapsedModels[model.id] !== false);
                    return (
                      <div key={model.id} style={{ marginTop: '1rem' }}>
                        <div className="admin-model-row">
                          <div className="admin-reorder-col">
                            <button className="admin-icon-btn" disabled={mIndex === 0 || reorderingId === `product-models-${model.id}-up`} onClick={() => handleReorder('product-models', model.id, 'up')} style={{ color: 'var(--text-color)' }} title="העבר למעלה"><ArrowUp size={16} /></button>
                            <button className="admin-icon-btn" disabled={mIndex === type.product_models.length - 1 || reorderingId === `product-models-${model.id}-down`} onClick={() => handleReorder('product-models', model.id, 'down')} style={{ color: 'var(--text-color)' }} title="העבר למטה"><ArrowDown size={16} /></button>
                          </div>
                          
                          <div 
                            onClick={() => toggleModel(model.id)} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, cursor: 'pointer', userSelect: 'none' }}
                          >
                            <h5 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)', fontWeight: 'bold' }}>{model.name}</h5>
                            <div className="product-model-details" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)', alignItems: 'center' }}>
                              <span>מחיר בסיס: {model.base_price}₪</span>
                              <span className="mobile-hidden" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                              <span>גובה בד: {model.fabric_height}מ׳</span>
                            </div>
                          </div>

                          <div className="admin-actions-col" style={{ alignItems: 'center' }}>
                            <button 
                              onClick={() => openAddSkuModal(model.id)} 
                              style={{ background: 'rgba(100, 116, 139, 0.2)', border: '1px solid #64748b', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' }} 
                              title="הוסף צבע לדגם זה"
                            >
                              <Plus size={16} />
                            </button>
                            <button className="admin-icon-btn" onClick={() => openEditModelModal(model, type.id)} style={{ color: '#3b82f6' }} title="ערוך דגם"><Edit2 size={18} /></button>
                            <button className="admin-icon-btn" onClick={() => handleDeleteModel(model.id, model.name)} style={{ color: 'var(--danger-color)' }} title="מחק דגם"><Trash2 size={18} /></button>
                          </div>
                        </div>

                        {!isModelCollapsed && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {model.color_skus.length === 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', padding: '0.5rem' }}>אין צבעים לדגם זה</span>}
                            {model.color_skus.map((sku, sIndex) => (
                              <div key={sku.id} className="admin-sku-row">
                                <div className="admin-reorder-col">
                                  <button className="admin-icon-btn" disabled={sIndex === 0 || reorderingId === `color-skus-${sku.id}-up`} onClick={() => handleReorder('color-skus', sku.id, 'up')} style={{ color: 'var(--text-color)' }} title="העבר למעלה"><ArrowUp size={16} /></button>
                                  <button className="admin-icon-btn" disabled={sIndex === model.color_skus.length - 1 || reorderingId === `color-skus-${sku.id}-down`} onClick={() => handleReorder('color-skus', sku.id, 'down')} style={{ color: 'var(--text-color)' }} title="העבר למטה"><ArrowDown size={16} /></button>
                                </div>
                                {sku.image_urls && sku.image_urls.length > 0 ? (
                                  <span className="admin-sku-badge-filled">
                                    {sku.image_urls.length}<br />תמונות
                                  </span>
                                ) : (
                                  <span className="admin-sku-badge-empty">
                                    ללא<br />תמונות
                                  </span>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <strong>{sku.color_name}</strong>
                                    {sku.sku && <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>({sku.sku})</span>}
                                  </div>
                                  <div className="product-sku-details" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-light)', alignItems: 'center' }}>
                                    <span>מלאי: {sku.stock_meters}מ׳</span>
                                    {sku.specific_price && (
                                      <>
                                        <span className="mobile-hidden" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>מחיר מיוחד: {sku.specific_price}₪</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="admin-actions-col" style={{ alignItems: 'center' }}>
                                  <button className="admin-icon-btn" onClick={() => openEditSkuModal(sku, model.id, model.base_price)} style={{ color: '#3b82f6' }} title="ערוך צבע"><Edit2 size={18} /></button>
                                  <button className="admin-icon-btn" onClick={() => handleDeleteSku(sku.id, sku.color_name)} style={{ color: 'var(--danger-color)' }} title="מחק צבע"><Trash2 size={18} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog for Forms */}
      {modalState.isOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.65)', 
            backdropFilter: 'blur(5px)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1rem' 
          }}
          onClick={closeModal}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '520px', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)', 
              border: '1px solid var(--glass-border)', 
              background: 'var(--bg-color)', 
              color: 'var(--text-color)' 
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {modalState.type === 'category' && (modalState.mode === 'edit' ? 'ערוך קטגוריה' : 'הוסף קטגוריה')}
                {modalState.type === 'model' && (modalState.mode === 'edit' ? 'ערוך דגם' : 'הוסף דגם')}
                {modalState.type === 'sku' && (modalState.mode === 'edit' ? 'ערוך צבע / מק"ט' : 'הוסף צבע')}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            {/* Category Form */}
            {modalState.type === 'category' && (
              <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>שם הקטגוריה</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="שם הקטגוריה (למשל: כותנה)" 
                    value={typeForm.name} 
                    onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} 
                    required 
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={closeModal} style={{ background: '#e2e8f0', color: '#475569' }}>ביטול</button>
                  <button type="submit" className="btn btn-primary">{modalState.mode === 'edit' ? 'שמור שינויים' : 'צור סוג'}</button>
                </div>
              </form>
            )}

            {/* Model Form */}
            {modalState.type === 'model' && (
              <form onSubmit={handleModelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>שויך לקטגוריה</label>
                  <select className="input-field" value={modelForm.product_type_id} onChange={e => setModelForm({ ...modelForm, product_type_id: e.target.value })} required>
                    <option value="">בחר קטגוריה...</option>
                    {catalog.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>שם הדגם</label>
                  <input type="text" className="input-field" placeholder="שם הדגם (למשל: תגל)" value={modelForm.name} onChange={e => setModelForm({ ...modelForm, name: e.target.value })} required autoFocus={modalState.mode === 'add'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>מחיר בסיס למטר (₪)</label>
                    <input type="number" step="0.01" className="input-field" placeholder="מחיר בסיס למטר" value={modelForm.base_price} onChange={e => setModelForm({ ...modelForm, base_price: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>גובה בד במטרים</label>
                    <input type="number" step="0.01" className="input-field" placeholder="ברירת מחדל: 1.5" value={modelForm.fabric_height} onChange={e => setModelForm({ ...modelForm, fabric_height: e.target.value })} />
                  </div>
                </div>

                {/* Model Media (1 Image & 1 Video) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>מדית הדגם (תמונה אחת בלבד + סרטון אחד בלבד)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={modelFileInputRef} onChange={handleModelImageUpload} />
                    <button type="button" className="btn btn-primary" onClick={() => modelFileInputRef.current.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={16} style={{ marginLeft: '0.5rem' }} /> {modelForm.image_url ? 'החלף תמונת דגם' : 'העלה תמונת דגם'}
                    </button>
                    <button type="button" className="btn" onClick={() => setIsWistiaModalOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: 'white', padding: '0.75rem' }}>
                      <Film size={16} style={{ marginLeft: '0.5rem' }} /> {modelForm.video_url ? 'החלף סרטון דגם' : 'הוסף סרטון דגם'}
                    </button>
                    {modelUploading && <span style={{ fontSize: '0.8rem' }}>מעלה...</span>}
                  </div>

                  {/* Previews for Model Image & Video */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {modelForm.image_url && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-light)' }}>תמונת הדגם:</span>
                        <div style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                          <SmartImage src={modelForm.image_url} alt="model-preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setModelForm(prev => ({ ...prev, image_url: '' }))} style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    {modelForm.video_url && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-light)' }}>סרטון הדגם:</span>
                        <div style={{ position: 'relative', padding: '0.5rem 0.75rem', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Film size={18} color="#6366f1" />
                          <span style={{ fontSize: '0.85rem', color: '#3730a3', fontWeight: 'bold' }}>סרטון מחובר</span>
                          <button type="button" onClick={() => setModelForm(prev => ({ ...prev, video_url: '' }))} style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '0.25rem' }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={closeModal} style={{ background: '#e2e8f0', color: '#475569' }}>ביטול</button>
                  <button type="submit" className="btn btn-primary">{modalState.mode === 'edit' ? 'שמור שינויים' : 'צור דגם'}</button>
                </div>
              </form>
            )}

            {/* SKU / Color Form */}
            {modalState.type === 'sku' && (
              <form onSubmit={handleSkuSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>שויך לדגם</label>
                  <select className="input-field" value={skuForm.product_model_id} onChange={e => setSkuForm({ ...skuForm, product_model_id: e.target.value })} required>
                    <option value="">בחר דגם...</option>
                    {catalog.map(type =>
                      type.product_models.map(model => (
                        <option key={model.id} value={model.id}>{type.name} - {model.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>שם הצבע</label>
                  <input type="text" className="input-field" placeholder="שם הצבע (למשל: אדום)" value={skuForm.color_name} onChange={e => setSkuForm({ ...skuForm, color_name: e.target.value })} required autoFocus={modalState.mode === 'add'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>מלאי זמין במטרים</label>
                    <input type="number" step="0.1" className="input-field" placeholder="מלאי זמין" value={skuForm.stock_meters} onChange={e => setSkuForm({ ...skuForm, stock_meters: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>מחיר מיוחד (אופציונלי)</label>
                    <input type="number" step="0.01" className="input-field" placeholder="מחיר מיוחד" value={skuForm.specific_price} onChange={e => setSkuForm({ ...skuForm, specific_price: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>תמונות הצבע</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
                    <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={16} style={{ marginLeft: '0.5rem' }} /> העלה תמונות צבע (1:1)
                    </button>
                    {uploading && <span style={{ fontSize: '0.8rem' }}>מעלה...</span>}
                  </div>
                </div>

                {skuForm.image_urls && skuForm.image_urls.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {skuForm.image_urls.map((url, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
                          תמונה {index + 1}
                        </div>
                        <div style={{ position: 'relative', width: '70px', height: '70px', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                          <SmartImage src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                          <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                            <X size={10} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            type="button" 
                            onClick={() => moveImage(index, -1)} 
                            disabled={index === 0}
                            style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1, padding: '1px 3px' }}
                            title="הזז ימינה"
                          >
                            <ArrowRight size={14} color="var(--primary-color)" />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => moveImage(index, 1)} 
                            disabled={index === skuForm.image_urls.length - 1}
                            style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === skuForm.image_urls.length - 1 ? 'not-allowed' : 'pointer', opacity: index === skuForm.image_urls.length - 1 ? 0.4 : 1, padding: '1px 3px' }}
                            title="הזז שמאלה"
                          >
                            <ArrowLeft size={14} color="var(--primary-color)" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" onClick={closeModal} style={{ background: '#e2e8f0', color: '#475569' }}>ביטול</button>
                  <button type="submit" className="btn btn-primary">{modalState.mode === 'edit' ? 'שמור שינויים' : 'צור צבע'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <WistiaMediaModal 
        isOpen={isWistiaModalOpen}
        onClose={() => setIsWistiaModalOpen(false)}
        onSelect={handleAddWistiaVideo}
      />
    </div>
  );
};

export default ProductManagement;
