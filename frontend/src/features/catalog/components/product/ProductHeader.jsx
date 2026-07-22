import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import ShareWidget from '../../../../components/ui/ShareWidget';

const ProductHeader = ({ productModel, selectedSku, user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.85rem)', marginBottom: '0.35rem', color: 'var(--primary-color)', lineHeight: '1.25', wordBreak: 'break-word' }}>
          {productModel.name}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
          {productModel.type_name}
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginTop: 0 }}>
          גובה בד: <strong>{productModel.fabric_height}</strong> מטר
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
        {user?.is_superuser && selectedSku && (
          <button 
            onClick={() => navigate('/bingo-sys-manager-hq', { state: { editSkuId: selectedSku.id } })}
            style={{
              background: 'rgba(255, 0, 0, 0.61)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer'
            }}
            title="ערוך דגם"
          >
            <Edit2 size={20} color="#fff" />
          </button>
        )}
        <ShareWidget url={`${window.location.origin}/api/v1/share/product/${productModel.id}`} title={`בינגו בדים - ${productModel.name}`} />
      </div>
    </div>
  );
};

export default ProductHeader;
