import sys

def main():
    with open('frontend/src/features/cart/CartView.jsx', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if "<div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', position: 'relative' }}>" in line:
            if start_idx == -1:
                start_idx = i
        if ");" in line and start_idx != -1 and i > start_idx:
            # We want to replace everything inside the return ()
            # wait, the end is:
            #                     </div>
            #                   </div>
            #                 );
            pass

    # Easier: just split by the exact string
    with open('frontend/src/features/cart/CartView.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
        
    target_str = """                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', position: 'relative' }}>
                    
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ position: 'absolute', top: 0, left: 0, background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                      title="הסר מהעגלה"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button 
                      onClick={() => openEditModal(item)}
                      style={{ position: 'absolute', top: '40px', left: 0, background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                      title="ערוך פריט"
                    >
                      <Edit2 size={14} />
                    </button>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {item.color_sku.image_url ? (
                          <img src={item.color_sku.image_url} alt={item.color_sku.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>🧵</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>{item.color_sku.product_model.name}</h3>
                        <div style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>צבע: {item.color_sku.color_name}</div>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>מק"ט: {item.color_sku.sku || 'ללא'}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>אורך לחתיכה: <strong>{item.length_meters}מ'</strong></div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 'bold', marginTop: '0.25rem' }}>כמות:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', borderRadius: '20px', padding: '0.25rem', width: 'fit-content' }}>
                          <button onClick={() => handleUpdateUnits(item.id, item.units - 1)} disabled={item.units <= 1} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: item.units <= 1 ? 'not-allowed' : 'pointer' }}><Minus size={14}/></button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.units}</span>
                          <button onClick={() => handleUpdateUnits(item.id, item.units + 1)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14}/></button>
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>₪{pricePerMeter} למטר</div>
                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a' }}>₪{rowTotal}</div>
                      </div>
                    </div>
                  </div>"""
    
    replacement_str = """                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {item.color_sku.image_url ? (
                            <img src={item.color_sku.image_url} alt={item.color_sku.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '2rem' }}>🧵</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>{item.color_sku.product_model.name}</h3>
                          <div style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>צבע: {item.color_sku.color_name}</div>
                          <div style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>מק"ט: {item.color_sku.sku || 'ללא'}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => openEditModal(item)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                          title="ערוך פריט"
                        >
                          <Edit2 size={20} className="hover-lift" />
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                          title="הסר מהעגלה"
                        >
                          <Trash2 size={20} className="hover-lift" />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{item.length_meters} מ'</span>
                        <span style={{ margin: '0 0.5rem' }}>×</span>
                        <span>{item.units} יח'</span>
                        <span style={{ margin: '0 0.5rem' }}>×</span>
                        <span>₪{parseFloat(pricePerMeter).toFixed(2)}/מ'</span>
                        <span style={{ margin: '0 0.5rem' }}>=</span>
                        <strong style={{ color: 'var(--text-color)', fontSize: '1.2rem', marginRight: '0.25rem' }}>₪{rowTotal}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', borderRadius: '20px', padding: '0.25rem', width: 'fit-content' }}>
                        <button onClick={() => handleUpdateUnits(item.id, item.units - 1)} disabled={item.units <= 1} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: item.units <= 1 ? 'not-allowed' : 'pointer' }}><Minus size={14}/></button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.units}</span>
                        <button onClick={() => handleUpdateUnits(item.id, item.units + 1)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>"""

    if target_str in content:
        content = content.replace(target_str, replacement_str)
        with open('frontend/src/features/cart/CartView.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully updated CartView.jsx")
    else:
        print("Target string not found!")

if __name__ == '__main__':
    main()
