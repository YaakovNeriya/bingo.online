import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CatalogView from '../views/CatalogView';
import client from '../../../api/client';
import { AuthContext } from '../../auth/AuthContext';

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn()
  }
}));

// We mock ProductCard since we only care about CatalogView logic
vi.mock('../components/ProductCard', () => ({
  default: ({ productModel }) => <div data-testid="product-card">{productModel.name}</div>
}));

vi.mock('../../../components/ui/ImageCarousel', () => ({
  default: () => <div data-testid="image-carousel">Carousel Mock</div>
}));

const mockCatalog = [
  {
    id: 1,
    name: 'Winter Collection',
    product_models: [
      { id: 101, name: 'Cotton Flex' },
      { id: 102, name: 'Wool Base' }
    ]
  },
  {
    id: 2,
    name: 'Summer Collection',
    product_models: [
      { id: 201, name: 'Linen Breeze' }
    ]
  }
];

const mockSettings = {
  main_page_title: 'Custom Title',
  main_page_date: 'Summer 2026',
  about_text: 'Test about text'
};

const renderWithContext = (component, user = null) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('CatalogView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // IntersectionObserver is mocked globally in setupTests.js
  });

  it('renders loading skeletons initially', () => {
    client.get.mockImplementation(() => new Promise(() => {}));
    const { container } = renderWithContext(<CatalogView />);
    // Check if SkeletonCard is present (they have specific styling, but we'll check via container classes)
    expect(container.getElementsByClassName('skeleton-pulse').length).toBeGreaterThan(0);
  });

  it('renders standard header and products when no carousel images exist', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/catalog') return Promise.resolve({ data: mockCatalog });
      if (url === '/products/public/settings') return Promise.resolve({ data: mockSettings });
      return Promise.resolve({ data: {} });
    });

    renderWithContext(<CatalogView />);

    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Summer 2026')).toBeInTheDocument();
    });

    // Bubbles and Headers
    expect(screen.getAllByText('Winter Collection').length).toBe(2);
    
    // Products
    expect(screen.getAllByTestId('product-card')).toHaveLength(3);
    expect(screen.getByText('Cotton Flex')).toBeInTheDocument();
  });

  it('renders carousel when images exist', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/catalog') return Promise.resolve({ data: [] });
      if (url === '/products/public/settings') return Promise.resolve({ 
        data: { ...mockSettings, carousel_images: '["img1.jpg"]' } 
      });
      return Promise.resolve({ data: {} });
    });

    renderWithContext(<CatalogView />);

    await waitFor(() => {
      expect(screen.getByTestId('image-carousel')).toBeInTheDocument();
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });
  });

  it('shows admin shield for superuser', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/catalog') return Promise.resolve({ data: mockCatalog });
      if (url === '/products/public/settings') return Promise.resolve({ data: mockSettings });
      return Promise.resolve({ data: {} });
    });

    const user = { is_superuser: true };
    renderWithContext(<CatalogView />, user);

    await waitFor(() => {
      expect(screen.getByTitle('ניהול')).toBeInTheDocument();
    });
  });
});
