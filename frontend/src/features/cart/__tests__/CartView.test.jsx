import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CartView from '../views/CartView';
import client from '../../../api/client';
import { AuthContext } from '../../auth/AuthContext';
import { CartContext } from '../CartContext';

// Mock the API client
vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

const mockCart = {
  items: [
    {
      id: 1,
      units: 2,
      length_meters: "5.5",
      status: "pending",
      color_sku: {
        sku: "12345",
        color_name: "Red",
        image_url: "red.jpg",
        product_model: { id: 10, name: "Premium Cotton", fabric_height: "1.5", base_price: "20.00" }
      }
    }
  ]
};

const renderWithContext = (component, user = null) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      <CartContext.Provider value={{ fetchCartCount: vi.fn() }}>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

describe('CartView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    client.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithContext(<CartView />);
    expect(screen.getByText('טוען...')).toBeInTheDocument();
  });

  it('fetches and displays cart items', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/public/settings') return Promise.resolve({ data: { minimum_order_length: "1.0" } });
      if (url === '/orders/cart') return Promise.resolve({ data: mockCart });
      return Promise.resolve({ data: {} });
    });

    renderWithContext(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Premium Cotton')).toBeInTheDocument();
      expect(screen.getByText(/12345/)).toBeInTheDocument();
      expect(screen.getByText(/Red/)).toBeInTheDocument();
    });
  });

  it('opens edit modal and saves changes', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/public/settings') return Promise.resolve({ data: { minimum_order_length: "1.0" } });
      if (url === '/orders/cart') return Promise.resolve({ data: mockCart });
      return Promise.resolve({ data: {} });
    });
    client.patch.mockResolvedValueOnce({ data: {} });

    renderWithContext(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Premium Cotton')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('ערוך פריט');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('עריכת פריט בעגלה')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('שמור שינויים');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(client.patch).toHaveBeenCalledWith('/orders/cart/items/1', { units: 2, length_meters: 5.5 });
    });
  });

  it('deletes an item when trash is clicked twice', async () => {
    client.get.mockImplementation((url) => {
      if (url === '/products/public/settings') return Promise.resolve({ data: { minimum_order_length: "1.0" } });
      if (url === '/orders/cart') return Promise.resolve({ data: mockCart });
      return Promise.resolve({ data: {} });
    });
    client.delete.mockResolvedValueOnce({ data: {} });

    renderWithContext(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Premium Cotton')).toBeInTheDocument();
    });

    const trashButton = screen.getByTitle('הסר מהעגלה');
    
    // First click (confirm)
    fireEvent.click(trashButton);
    expect(client.delete).not.toHaveBeenCalled();

    // Second click (execute)
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(client.delete).toHaveBeenCalledWith('/orders/cart/items/1');
    });
  });
});
