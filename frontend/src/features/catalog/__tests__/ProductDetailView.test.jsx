import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetailView from '../views/ProductDetailView';
import client from '../../../api/client';
import { AuthContext } from '../../auth/AuthContext';
import { CartContext } from '../../cart/CartContext';

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock child components that are not under test
vi.mock('../ProductCard', () => ({
  default: ({ productModel }) => <div data-testid="related-product">{productModel.name}</div>
}));
vi.mock('../../../components/ui/ImageCarousel', () => ({
  default: () => <div data-testid="image-carousel">Carousel Mock</div>
}));
vi.mock('../../../components/ui/ImageLightbox', () => ({
  default: () => <div data-testid="image-lightbox">Lightbox Mock</div>
}));
vi.mock('../../../components/ui/AddToCartButton', () => ({
  default: ({ onClick, disabled, children }) => (
    <button data-testid="add-to-cart-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));
vi.mock('../../../components/ui/FabricLengthSlider', () => ({
  default: ({ value }) => (
    <div data-testid="fabric-slider">Slider Value: {value}</div>
  )
}));

const mockCatalog = [
  {
    id: 1,
    name: 'Winter Collection',
    product_models: [
      {
        id: 101,
        name: 'Cotton Flex',
        base_price: 15.5,
        fabric_height: 1.5,
        color_skus: [
          { id: 1001, color_name: 'Red', stock_meters: 50, specific_price: null, image_urls: [] },
          { id: 1002, color_name: 'Blue', stock_meters: 0, specific_price: 20.0, image_urls: [] }
        ]
      },
      {
        id: 102,
        name: 'Wool Base',
        base_price: 30.0,
        fabric_height: 1.4,
        color_skus: []
      }
    ]
  }
];

const mockSettings = {
  minimum_order_length: '2.5'
};

const renderWithContext = (component, user = { name: 'Test User' }, fetchCartCount = vi.fn()) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      <CartContext.Provider value={{ fetchCartCount }}>
        <MemoryRouter initialEntries={['/product/101']}>
          <Routes>
            <Route path="/product/:modelId" element={component} />
          </Routes>
        </MemoryRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

describe('ProductDetailView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.scrollTo
    window.scrollTo = vi.fn();

    // Default successful responses
    client.get.mockImplementation((url) => {
      if (url === '/products/catalog') return Promise.resolve({ data: mockCatalog });
      if (url === '/products/public/settings') return Promise.resolve({ data: mockSettings });
      return Promise.resolve({ data: {} });
    });
    client.post.mockResolvedValue({ data: { success: true } });
  });

  it('renders product details and handles settings', async () => {
    renderWithContext(<ProductDetailView />);

    // Wait for the product name to appear
    await waitFor(() => {
      expect(screen.getAllByText('Cotton Flex').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Winter Collection').length).toBeGreaterThan(0);
    });

    // Initial color selection is Red (first SKU)
    expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
    expect(screen.getByText(/במלאי:/)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Red stock

    // Base price should be 15.5
    expect(screen.getByText(/15\.5/)).toBeInTheDocument();

    // Minimum order length from settings should be respected (2.5)
    expect(screen.getByText('Slider Value: 2.5')).toBeInTheDocument();
  });

});
