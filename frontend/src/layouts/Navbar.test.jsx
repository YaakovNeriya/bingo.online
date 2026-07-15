import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../features/auth/AuthContext';
import { CartContext } from '../features/cart/CartContext';
import Navbar from './Navbar';

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
    
    // Check if the greeting text is present and acts as a link to profile
    const nameLinks = screen.getAllByRole('link', { name: /Yaakov/i });
    expect(nameLinks.length).toBeGreaterThan(0);
    
    // Check if cart count bubble is rendered with the correct count
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check if the greeting text is present (might be multiple due to mobile/desktop menus)
    const greetings = screen.getAllByText(/שלום,\s*Yaakov/i);
    expect(greetings.length).toBeGreaterThan(0);
    
    // Check logout button
    const logoutBtn = screen.getByTitle('התנתק');
    expect(logoutBtn).toBeInTheDocument();
  });
});
