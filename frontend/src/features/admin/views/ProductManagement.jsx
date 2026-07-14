import React, { useEffect, useState, useRef } from 'react';
import client from '../../../api/client';
import { Trash2, Edit2, Upload, X, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Film } from 'lucide-react';
import SmartImage from '../../../components/ui/SmartImage';
import WistiaMediaModal from '../components/WistiaMediaModal';

const ProductManagement = ({ editSkuId }) => {
  const [catalog, setCatalog] = useState([]);

  // Forms state
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });
  const [modelForm, setModelForm] = useState({ id: null, name: '', product_type_id: '', base_price: '', fabric_height: '' });
  const [skuForm, setSkuForm] = useState({ id: null, sku: '', color_name: '', product_model_id: '', stock_meters: '', specific_price: '', image_urls: [] });
  const [isWistiaModalOpen, setIsWistiaModalOpen] = useState(false);

  const typeFormRef = useRef(null);
  const modelFormRef = useRef(null);
  const skuFormRef = useRef(null);
  const fileInputRef = useRef(null);
  const processedEditId = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);

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
            setSkuForm({ 
              id: sku.id, 
              sku: sku.sku || '', 
              color_name: sku.color_name, 
              product_model_id: model.id, 
              stock_meters: sku.stock_meters, 
              specific_price: sku.specific_price ?? model.base_price, 
              image_urls: sku.image_urls || [] 
            });
            setTimeout(() => {
              skuFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
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
      let newId = typeForm.id;
      if (typeForm.id) {
        await client.put(`/admin/product-types/${typeForm.id}`, { name: typeForm.name });
      } else {
        const res = await client.post('/admin/product-types', { name: typeForm.name });
        newId = res.data.id;
      }
      setTypeForm({ id: null, name: '' });
      setModelForm(prev => ({ ...prev, product_type_id: newId || '' }));
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
        fabric_height: modelForm.fabric_height ? parseFloat(modelForm.fabric_height) : 1.5
      };
      let newId = modelForm.id;
      if (modelForm.id) {
        await client.put(`/admin/product-models/${modelForm.id}`, payload);
      } else {
        const res = await client.post('/admin/product-models', payload);
        newId = res.data.id;
      }
      setModelForm({ id: null, name: '', product_type_id: '', base_price: '', fabric_height: '' });
      setSkuForm(prev => ({ ...prev, product_model_id: newId || '' }));
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
    setSkuForm(prev => ({ ...prev, image_urls: [...prev.image_urls, url] }));
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

  return (
    <div>
      <h2>ניהול מוצרים</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div ref={typeFormRef} className="glass-panel" style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{typeForm.id ? 'ערוך קטגוריה' : 'הוסף קטגוריה'}</h3>
            {typeForm.id && <button onClick={() => setTypeForm({ id: null, name: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>}
          </div>
          <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input type="text" className="input-field" placeholder="שם הקטגוריה (למשל: כותנה)" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} required />
            <button type="submit" className="btn btn-primary">{typeForm.id ? 'שמור שינויים' : 'צור סוג'}</button>
          </form>
        </div>

        <div ref={modelFormRef} className="glass-panel" style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{modelForm.id ? 'ערוך דגם' : 'הוסף דגם'}</h3>
            {modelForm.id && <button onClick={() => setModelForm({ id: null, name: '', product_type_id: '', base_price: '', fabric_height: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>}
          </div>
          <form onSubmit={handleModelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select className="input-field" value={modelForm.product_type_id} onChange={e => setModelForm({ ...modelForm, product_type_id: e.target.value })} required>
              <option value="">בחר קטגוריה...</option>
              {catalog.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
            <input type="text" className="input-field" placeholder="שם הדגם (למשל: תגל)" value={modelForm.name} onChange={e => setModelForm({ ...modelForm, name: e.target.value })} required />
            <input type="number" step="0.01" className="input-field" placeholder="מחיר בסיס למטר" value={modelForm.base_price} onChange={e => setModelForm({ ...modelForm, base_price: e.target.value })} required />
            <input type="number" step="0.01" className="input-field" placeholder="גובה בד במטרים (ברירת מחדל: 1.5)" value={modelForm.fabric_height} onChange={e => setModelForm({ ...modelForm, fabric_height: e.target.value })} />
            <button type="submit" className="btn btn-primary">{modelForm.id ? 'שמור שינויים' : 'צור דגם'}</button>
          </form>
        </div>

        <div ref={skuFormRef} className="glass-panel" style={{ padding: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{skuForm.id ? 'ערוך מק"ט' : 'הוסף צבע/מק"ט'}</h3>
            {skuForm.id && <button onClick={() => setSkuForm({ id: null, sku: '', color_name: '', product_model_id: '', stock_meters: '', specific_price: '', image_urls: [] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={16} /></button>}
          </div>
          <form onSubmit={handleSkuSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <select className="input-field" value={skuForm.product_model_id} onChange={e => setSkuForm({ ...skuForm, product_model_id: e.target.value })} required>
              <option value="">בחר דגם...</option>
              {catalog.map(type =>
                type.product_models.map(model => (
                  <option key={model.id} value={model.id}>{type.name} - {model.name}</option>
                ))
              )}
            </select>
            <input type="text" className="input-field" placeholder='קוד מק"ט' value={skuForm.sku} onChange={e => setSkuForm({ ...skuForm, sku: e.target.value })} />
            <input type="text" className="input-field" placeholder="שם הצבע (למשל: אדום)" value={skuForm.color_name} onChange={e => setSkuForm({ ...skuForm, color_name: e.target.value })} required />
            <input type="number" step="0.1" className="input-field" placeholder="מלאי זמין במטרים" value={skuForm.stock_meters} onChange={e => setSkuForm({ ...skuForm, stock_meters: e.target.value })} required />
            <input type="number" step="0.01" className="input-field" placeholder="מחיר מיוחד (אופציונלי)" value={skuForm.specific_price} onChange={e => setSkuForm({ ...skuForm, specific_price: e.target.value })} />

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageUpload} />
              <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={16} style={{ marginLeft: '0.5rem' }} /> העלה תמונות <br /> ( 1:1 , האחרונה תשמש גם לעיגול )
              </button>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <button type="button" className="btn" onClick={() => setIsWistiaModalOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6366f1', color: 'white', padding: '0.75rem' }}>
                  <Film size={16} style={{ marginLeft: '0.5rem' }} /> הוסף סרטון
                </button>
                <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.2' }}>
                  הסרטון צריך להיות מצולם ב HD ולא יותר
                </span>
              </div>
              {uploading && <span style={{ fontSize: '0.8rem' }}>מעלה...</span>}
            </div>
            {skuForm.image_urls && skuForm.image_urls.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {skuForm.image_urls.map((url, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    {/* Number above */}
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
                      תמונה {index + 1}
                    </div>
                    
                    {/* Image Container */}
                    <div style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                      <SmartImage src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                      <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <X size={12} />
                      </button>
                    </div>

                    {/* Arrows below */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => moveImage(index, -1)} 
                        disabled={index === 0}
                        style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1, padding: '2px 4px' }}
                        title="הזז ימינה"
                      >
                        <ArrowRight size={16} color="var(--primary-color)" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveImage(index, 1)} 
                        disabled={index === skuForm.image_urls.length - 1}
                        style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: index === skuForm.image_urls.length - 1 ? 'not-allowed' : 'pointer', opacity: index === skuForm.image_urls.length - 1 ? 0.4 : 1, padding: '2px 4px' }}
                        title="הזז שמאלה"
                      >
                        <ArrowLeft size={16} color="var(--primary-color)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary">{skuForm.id ? 'שמור שינויים' : 'צור צבע'}</button>
          </form>
        </div>
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>קטלוג המוצרים הקיים</h3>
      <div className="glass-panel" style={{ padding: '0.5rem' }}>
        {catalog.length === 0 ? <p>אין מוצרים בקטלוג.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {catalog.map((type, tIndex) => (
              <div key={type.id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', background: 'rgba(59,130,246,0.25)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                    <button disabled={tIndex === 0 || reorderingId === `product-types-${type.id}-up`} onClick={() => handleReorder('product-types', type.id, 'up')} style={{ background: 'none', border: 'none', cursor: tIndex === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: tIndex === 0 ? 0.3 : 1, padding: 0 }} title="העבר למעלה"><ArrowUp size={16} /></button>
                    <button disabled={tIndex === catalog.length - 1 || reorderingId === `product-types-${type.id}-down`} onClick={() => handleReorder('product-types', type.id, 'down')} style={{ background: 'none', border: 'none', cursor: tIndex === catalog.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: tIndex === catalog.length - 1 ? 0.3 : 1, padding: 0 }} title="העבר למטה"><ArrowDown size={16} /></button>
                  </div>
                  <h4 style={{ fontSize: '1.25rem', color: 'var(--text-color)', margin: 0, fontWeight: 'bold' }}>{type.name}</h4>
                  <div style={{ display: 'flex', gap: '1rem', marginRight: 'auto' }}>
                    <button onClick={() => { setTypeForm({ id: type.id, name: type.name }); setTimeout(() => typeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center' }} title="ערוך קטגוריה"><Edit2 size={20} /></button>
                    <button onClick={() => handleDeleteType(type.id, type.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff0000ff', display: 'flex', alignItems: 'center' }} title="מחק קטגוריה"><Trash2 size={20} /></button>
                  </div>
                </div>

                {type.product_models.map((model, mIndex) => (
                  <div key={model.id} style={{ marginRight: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(156, 163, 175, 0.25)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(156, 163, 175, 0.4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                        <button disabled={mIndex === 0 || reorderingId === `product-models-${model.id}-up`} onClick={() => handleReorder('product-models', model.id, 'up')} style={{ background: 'none', border: 'none', cursor: mIndex === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: mIndex === 0 ? 0.3 : 1, padding: 0 }} title="העבר למעלה"><ArrowUp size={16} /></button>
                        <button disabled={mIndex === type.product_models.length - 1 || reorderingId === `product-models-${model.id}-down`} onClick={() => handleReorder('product-models', model.id, 'down')} style={{ background: 'none', border: 'none', cursor: mIndex === type.product_models.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: mIndex === type.product_models.length - 1 ? 0.3 : 1, padding: 0 }} title="העבר למטה"><ArrowDown size={16} /></button>
                      </div>
                      <h5 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-color)' }}>{model.name}</h5>
                      <span style={{ color: 'var(--text-light)' }}>- מחיר בסיס: {model.base_price}₪ | גובה בד: {model.fabric_height}מ'</span>
                      <div style={{ display: 'flex', gap: '1rem', marginRight: 'auto' }}>
                        <button onClick={() => { setModelForm({ id: model.id, name: model.name, product_type_id: type.id, base_price: model.base_price, fabric_height: model.fabric_height }); setTimeout(() => modelFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center' }} title="ערוך דגם"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteModel(model.id, model.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', alignItems: 'center' }} title="מחק דגם"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', marginRight: '1rem', paddingRight: '1rem', borderRight: '2px solid rgba(255,255,255,0.1)' }}>
                      {model.color_skus.length === 0 && <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', padding: '0.5rem' }}>אין צבעים לדגם זה</span>}
                      {model.color_skus.map((sku, sIndex) => (
                        <div key={sku.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--glass-border)', flex: '1 1 100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                            <button disabled={sIndex === 0 || reorderingId === `color-skus-${sku.id}-up`} onClick={() => handleReorder('color-skus', sku.id, 'up')} style={{ background: 'none', border: 'none', cursor: sIndex === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: sIndex === 0 ? 0.3 : 1, padding: 0 }} title="העבר למעלה"><ArrowUp size={16} /></button>
                            <button disabled={sIndex === model.color_skus.length - 1 || reorderingId === `color-skus-${sku.id}-down`} onClick={() => handleReorder('color-skus', sku.id, 'down')} style={{ background: 'none', border: 'none', cursor: sIndex === model.color_skus.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--text-color)', opacity: sIndex === model.color_skus.length - 1 ? 0.3 : 1, padding: 0 }} title="העבר למטה"><ArrowDown size={16} /></button>
                          </div>
                          {sku.image_urls && sku.image_urls.length > 0 ? (
                            <span style={{ background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {sku.image_urls.length} תמונות
                            </span>
                          ) : (
                            <span style={{ background: '#e2e8f0', color: 'var(--text-light)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              ללא תמונות
                            </span>
                          )}
                          <span style={{ fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong>{sku.color_name}</strong>
                            {sku.sku && <span style={{ color: 'var(--text-light)' }}>({sku.sku})</span>}
                            <span style={{ color: 'var(--text-light)' }}>|</span>
                            <span>מלאי: {sku.stock_meters}מ'</span>
                            {sku.specific_price && (
                              <>
                                <span style={{ color: 'var(--text-light)' }}>|</span>
                                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>מחיר מיוחד: {sku.specific_price}₪</span>
                              </>
                            )}
                          </span>
                          <div style={{ display: 'flex', gap: '1rem', marginRight: 'auto' }}>
                            <button onClick={() => { setSkuForm({ id: sku.id, sku: sku.sku || '', color_name: sku.color_name, product_model_id: model.id, stock_meters: sku.stock_meters, specific_price: sku.specific_price ?? model.base_price, image_urls: sku.image_urls || [] }); setTimeout(() => skuFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="ערוך צבע"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteSku(sku.id, sku.color_name)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="מחק צבע"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <WistiaMediaModal 
        isOpen={isWistiaModalOpen}
        onClose={() => setIsWistiaModalOpen(false)}
        onSelect={handleAddWistiaVideo}
      />
    </div>
  );
};

export default ProductManagement;
