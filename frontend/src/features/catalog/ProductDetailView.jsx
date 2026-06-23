import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { AuthContext } from '../auth/AuthContext';
import { CartContext } from '../cart/CartContext';
import ImageLightbox from '../../components/ImageLightbox';
import ImageCarousel from '../../components/ImageCarousel';
import ShareWidget from '../../components/ShareWidget';
import ProductCard from './ProductCard'; // Mini cards for related/random
import { Edit2, Plus, Minus, ShoppingCart } from 'lucide-react';
import FabricLengthSlider from '../../components/FabricLengthSlider';
import AddToCartButton from '../../components/AddToCartButton';
const ProductDetailView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { fetchCartCount } = useContext(CartContext);
  
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local state for the product
  const [productModel, setProductModel] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
  const [lengthMeters, setLengthMeters] = useState(1);
  const [units, setUnits] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cartError, setCartError] = useState('');
  const [minCutLength, setMinCutLength] = useState(1.0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchMinCutLength = async () => {
    try {
      const res = await client.get('/products/public/settings');
      if (res.data && res.data['minimum_order_length']) {
        setMinCutLength(parseFloat(res.data['minimum_order_length']) || 1.0);
        // If current value is less than the new min, update it
        setLengthMeters(prev => Math.max(prev, parseFloat(res.data['minimum_order_length']) || 1.0));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMinCutLength();
  }, [modelId]);

  // Load catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await client.get('/products/catalog');
        setCatalog(res.data);
      } catch (err) {
        setError('שגיאה בטעינת הקטלוג');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // When catalog or modelId changes, find the model
  useEffect(() => {
    if (!catalog.length) return;
    
    let foundModel = null;
    for (const type of catalog) {
      const model = type.product_models.find(m => m.id === parseInt(modelId));
      if (model) {
        foundModel = { ...model, type_name: type.name, type_id: type.id };
        break;
      }
    }
    
    if (foundModel) {
      setProductModel(foundModel);
      // Select first sku by default
      if (foundModel.color_skus.length > 0) {
        setSelectedSku(foundModel.color_skus[0]);
        setCurrentImageIndex(0);
      }
      setLengthMeters(1.0);
      setUnits(1);
      setCartError('');
      // Scroll to top automatically when a new product is loaded
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError('המוצר לא נמצא.');
    }
  }, [catalog, modelId]);

  const handleAddToCart = async () => {
    if (lengthMeters < 0.1) {
      setCartError('אורך מינימלי הוא 0.1 מטר.');
      return;
    }
    if (units < 1) {
      setCartError('מספר יחידות מינימלי הוא 1.');
      return;
    }
    if (Math.abs(lengthMeters - Math.round(lengthMeters * 10) / 10) > 0.0001) {
      setCartError('אורך חייב להיות בקפיצות של 0.1 מטר.');
      return;
    }
    if (lengthMeters < minCutLength) {
      setCartError(`אורך מינימלי לחתיכה הוא ${minCutLength} מטרים.`);
      return;
    }
    const totalRequested = lengthMeters * units;
    if (selectedSku && totalRequested > selectedSku.stock_meters) {
      setCartError(`לא ניתן להוסיף. סך הכל מבוקש: ${totalRequested} מטרים. המלאי הזמין הוא ${selectedSku.stock_meters} מטרים בלבד.`);
      return;
    }
    setCartError('');

    try {
      setAddingToCart(true);
      await client.post('/orders/cart', {
        color_sku_id: selectedSku.id,
        length_meters: parseFloat(Number(lengthMeters).toFixed(1)),
        units: units
      });
      fetchCartCount();
      setAddingToCart(false);
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      setCartError(
        Array.isArray(errDetail) 
          ? errDetail.map(d => d.msg).join(', ') 
          : (errDetail || 'שגיאה בהוספה או שאינך מחובר.')
      );
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="container" style={{ paddingBottom: '2rem' }}>טוען...</div>;
  if (error) return <div className="container" style={{ paddingBottom: '2rem', color: 'var(--danger-color)' }}>{error}</div>;
  if (!productModel) return null;

  const currentPrice = selectedSku?.specific_price || productModel.base_price;
  
  // Find related models (same category, excluding current)
  const relatedModels = catalog
    .find(t => t.id === productModel.type_id)
    ?.product_models.filter(m => m.id !== productModel.id) || [];

  // Find random models (from entire catalog, excluding current)
  const allModels = catalog.flatMap(t => t.product_models).filter(m => m.id !== productModel.id);
  const randomModels = [...allModels].sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Breadcrumb / Top Navigation */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>חנות</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>{productModel.type_name}</span>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--text-color)' }}>{productModel.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '2rem' }}>
        
        {/* Right Side (RTL) - Image */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ImageCarousel 
            images={selectedSku?.image_urls || []} 
            alt={selectedSku?.color_name || "מוצר"} 
            height="400px" 
            onClick={() => setLightboxOpen(true)}
            showDots={true}
            onIndexChange={setCurrentImageIndex}
          />
        </div>

        {/* Left Side (RTL) - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{productModel.name}</h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>{productModel.type_name}</p>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-color)', marginTop: 0 }}>
                גובה בד: <strong>{productModel.fabric_height}</strong> מטר
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {user?.is_superuser && selectedSku && (
                <button 
                  onClick={() => navigate('/admin', { state: { editSkuId: selectedSku.id } })}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--primary-color)',
                    transition: 'all 0.2s'
                  }}
                  title="ערוך דגם"
                >
                  <Edit2 size={20} />
                </button>
              )}
              <ShareWidget url={window.location.href} title={`בינגו בדים - ${productModel.name}`} />
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {currentPrice}₪ <span style={{ fontSize: '1rem', color: 'var(--text-light)', fontWeight: 'normal' }}>/ מטר</span>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>בחר צבע:</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {productModel.color_skus.map(sku => {
                const isOutOfStock = sku.stock_meters <= 0;
                const isSelected = selectedSku?.id === sku.id;
                
                return (
                  <button 
                    key={sku.id} 
                    onClick={() => { setSelectedSku(sku); setCurrentImageIndex(0); }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: isSelected 
                        ? '2px solid var(--primary-color)' 
                        : (isOutOfStock ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #cbd5e1'),
                      background: isSelected 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : (isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9'),
                      cursor: 'pointer',
                      color: isOutOfStock ? '#b91c1c' : 'var(--text-color)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {sku.color_name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ color: 'var(--text-light)' }}>
            במלאי: <strong>{selectedSku?.stock_meters}</strong> מטרים
          </div>

          <div style={{ marginTop: '2rem' }}>
            <FabricLengthSlider 
              value={lengthMeters} 
              onChange={setLengthMeters} 
              min={minCutLength} 
              max={selectedSku ? selectedSku.stock_meters : 0} 
            />
          </div>

          <div style={{ marginTop: 0, background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 'bold' }}>כמות יחידות</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '30px', padding: '0.25rem' }}>
                  <button 
                    onClick={() => setUnits(Math.max(1, units - 1))} 
                    disabled={!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1}
                    style={{ 
                      background: 'var(--primary-color)', 
                      color: '#fff', 
                      borderRadius: '50%', 
                      width: '44px', 
                      height: '44px', 
                      border: 'none', 
                      cursor: (!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1) ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 8px',
                      transition: '0.2s',
                      opacity: (!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1) ? 0.5 : 1 
                    }}
                  >
                    <Minus size={24} />
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    step="1" 
                    value={units} 
                    onChange={e => setUnits(parseInt(e.target.value) || 0)}
                    disabled={!selectedSku || selectedSku.stock_meters < 0.1}
                    style={{ width: '50px', textAlign: 'center', fontSize: '1.3rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontWeight: 'bold' }}
                  />
                  <button 
                    onClick={() => setUnits(units + 1)} 
                    disabled={!selectedSku || selectedSku.stock_meters < 0.1}
                    style={{ 
                      background: 'var(--primary-color)', 
                      color: '#fff', 
                      borderRadius: '50%', 
                      width: '44px', 
                      height: '44px', 
                      border: 'none', 
                      cursor: (!selectedSku || selectedSku.stock_meters < 0.1) ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 8px',
                      transition: '0.2s',
                      opacity: (!selectedSku || selectedSku.stock_meters < 0.1) ? 0.5 : 1 
                    }}
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', width: '100%' }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 'bold', marginBottom: '0.25rem' }}>סה"כ לתשלום:</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--primary-color)', lineHeight: 1.2 }}>
                  {((currentPrice || 0) * lengthMeters * units).toFixed(2)} ₪
                </span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  {lengthMeters.toFixed(1)} מטרים, {units === 1 ? 'יחידה אחת' : `${units} יחידות`}
                </span>
              </div>
            </div>

            {!user ? (
              <button 
                className="btn btn-primary hover-lift" 
                onClick={() => navigate('/login')} 
                style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#3b82f6', borderRadius: '12px' }}
              >
                התחבר כדי להוסיף לעגלה
              </button>
            ) : (
              <AddToCartButton 
                onClick={handleAddToCart} 
                disabled={!selectedSku || selectedSku.stock_meters < 0.1 || addingToCart}
                style={{ width: '100%' }}
              >
                {!selectedSku || selectedSku.stock_meters < 0.1 ? 'אזל במלאי' : addingToCart ? 'מוסיף...' : (
                  <>
                    הוסף לעגלה <ShoppingCart size={24} />
                  </>
                )}
              </AddToCartButton>
            )}
          </div>
          {cartError && <div style={{ color: 'var(--danger-color)' }}>{cartError}</div>}
        </div>
      </div>

      {/* Related Models (Same Category) */}
      {relatedModels.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>דגמים נוספים ב{productModel.type_name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {relatedModels.map(model => (
              <ProductCard key={model.id} productModel={model} />
            ))}
          </div>
        </div>
      )}

      {/* Random Suggestions */}
      {randomModels.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>אולי תאהב גם...</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {randomModels.map(model => (
              <ProductCard key={model.id} productModel={model} />
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && selectedSku?.image_urls && selectedSku.image_urls.length > 0 && (
        <ImageLightbox 
          images={selectedSku.image_urls}
          initialIndex={currentImageIndex}
          alt={selectedSku.color_name} 
          onClose={() => setLightboxOpen(false)} 
        />
      )}
    </div>
  );
};

export default ProductDetailView;
