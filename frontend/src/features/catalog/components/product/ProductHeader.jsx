import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import ShareWidget from '../../../../components/ui/ShareWidget';

const ProductHeader = ({ productModel, selectedSku, user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>
          {productModel.name}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
          {productModel.type_name}
        </p>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-color)', marginTop: 0 }}>
          גובה בד: <strong>{productModel.fabric_height}</strong> מטר
        </p>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {user?.is_superuser && selectedSku && (
          <button 
            onClick={() => navigate('/bingo-sys-manager-hq', { state: { editSkuId: selectedSku.id } })}
            style={{
              background: 'rgba(255, 0, 0, 0.61)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="ערוך דגם"
          >
            <Edit2 size={25} />
          </button>
        )}
        <ShareWidget url={`${window.location.origin}/api/v1/share/product/${productModel.id}`} title={`בינגו בדים - ${productModel.name}`} />
      </div>
    </div>
  );
};

export default ProductHeader;
