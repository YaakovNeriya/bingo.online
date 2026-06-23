import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';
import { CartContext } from '../../features/cart/CartContext';
import Navbar from '../Navbar';

// Mock dependencies
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn(() => vi.fn()),
}));

describe('Navbar Component - Mobile Focus', () => {
  const mockAuthContext = {
    user: { first_name: 'Yaakov', is_superuser: false },
    logout: vi.fn()
  };
  
  const mockCartContext = {
    cartCount: 3
  };

  it('renders Navbar correctly with user and cart', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <CartContext.Provider value={mockCartContext}>
            <Navbar />
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    // Check if the logo is present
    const logo = screen.getByAltText('בינגו בדים');
    expect(logo).toBeInTheDocument();
    
    // Check if the greeting text is present and acts as a link to cart
    const nameLink = screen.getByRole('link', { name: /Yaakov/i });
    expect(nameLink).toBeInTheDocument();
    
    // Check if cart count bubble is inside the name link
    expect(nameLink.textContent).toContain('3');
    
    // Check if the greeting text is present
    expect(screen.getByText('שלום')).toBeInTheDocument();
    expect(screen.getByText('Yaakov')).toBeInTheDocument();
    
    // Check logout button
    const logoutBtn = screen.getByTitle('התנתק');
    expect(logoutBtn).toBeInTheDocument();
  });
});
