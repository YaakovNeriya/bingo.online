import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import { CartContext } from '../../features/cart/CartContext';
import App from '../../App';

// Mock matchMedia and resize
beforeAll(() => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock client to avoid real requests
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} })
  }
}));

describe('App Layout Component', () => {
  const mockAuthContext = { user: null, logout: vi.fn() };
  const mockCartContext = { cartCount: 0 };

  it('renders application without crashing on mobile width (375px)', () => {
    // Assert window width is properly mocked
    expect(window.innerWidth).toBe(375);

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={mockAuthContext}>
          <CartContext.Provider value={mockCartContext}>
            <App />
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Verify Navbar is rendered
    expect(screen.getByAltText('בינגו בדים')).toBeInTheDocument();
  });
});
