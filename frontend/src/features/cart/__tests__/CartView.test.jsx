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
        image_urls: ["red.jpg"],
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
      if (url === '/orders/active') return Promise.resolve({ data: { id: -1, items: [] } });
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
      if (url === '/orders/active') return Promise.resolve({ data: { id: -1, items: [] } });
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
      if (url === '/orders/active') return Promise.resolve({ data: { id: -1, items: [] } });
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

  it('handles unchecking an active order item correctly and updates local storage', async () => {
    // 1. Mock the API
    let fetchCount = 0;
    client.get.mockImplementation((url) => {
      if (url === '/products/public/settings') return Promise.resolve({ data: { minimum_order_length: "1.0" } });
      if (url === '/orders/cart') {
        fetchCount++;
        if (fetchCount > 1) {
          // Second fetch (after toggle) should return the new cart item
          return Promise.resolve({ data: { items: [{ ...mockCart.items[0], id: 999 }] } });
        }
        return Promise.resolve({ data: { items: [] } });
      }
      if (url === '/orders/active') {
        if (fetchCount > 1) {
          return Promise.resolve({ data: { id: 99, items: [] } });
        }
        return Promise.resolve({ data: { id: 99, items: [ mockCart.items[0] ] } });
      }
      return Promise.resolve({ data: {} });
    });
    
    // Mock the POST remove call to return the new ID 999
    client.post.mockResolvedValueOnce({ data: { status: 'success', new_cart_item_id: 999 } });

    renderWithContext(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Premium Cotton')).toBeInTheDocument();
    });

    // Find the checkbox for the order item
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    const checkbox = checkboxes[0];
    
    // Initially checked
    expect(checkbox.checked).toBe(true);

    // Click to uncheck
    fireEvent.click(checkbox);

    // Verify API call was made to remove it
    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/orders/active/items/1/remove');
    });
    
    // Verify local storage is correctly updated to false for the new cart item ID
    await waitFor(() => {
      const stored = localStorage.getItem('cart_selected_items');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed['cart_999']).toBe(false);
    });
  });

  it('handles deadline UI locking correctly', async () => {
    // 1. Mock API
    client.get.mockImplementation((url) => {
      if (url === '/products/public/settings') return Promise.resolve({ data: { minimum_order_length: "1.0" } });
      if (url === '/orders/cart') return Promise.resolve({ data: mockCart });
      if (url === '/orders/active') return Promise.resolve({ data: { id: -1, items: [] } });
      return Promise.resolve({ data: {} });
    });

    // 2. Set deadline in the past
    const pastDeadlineDate = new Date();
    pastDeadlineDate.setDate(pastDeadlineDate.getDate() - 1);
    const userWithPastDeadline = {
      id: 1,
      email: "deadline@bingo.online",
      applicable_deadline: pastDeadlineDate.toISOString()
    };

    renderWithContext(<CartView />, userWithPastDeadline);

    await waitFor(() => {
      expect(screen.getByText('Premium Cotton')).toBeInTheDocument();
    });

    // 3. Verify Error Banner
    expect(screen.getByText(/חלון ההזמנות נסגר/)).toBeInTheDocument();

    // 4. Verify Checkbox is disabled
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeDisabled();

    // 5. Verify Trash is disabled
    const trashButton = screen.getByTitle('הסר מהעגלה');
    expect(trashButton).toBeDisabled();

    // 6. Verify Edit button is disabled
    const editButton = screen.getByTitle('ערוך פריט');
    expect(editButton).toBeDisabled();

    // 7. Verify Send Order button is disabled
    const sendOrderButton = screen.getByText('בטל והחזר לעגלה');
    expect(sendOrderButton).toBeDisabled();
  });
});
