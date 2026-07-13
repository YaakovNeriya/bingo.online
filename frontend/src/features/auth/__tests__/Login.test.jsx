import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import Login from '../views/Login';

// Mock dependencies
vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: vi.fn(() => vi.fn()),
}));

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] })
  }
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Login Component', () => {
  const mockContext = {
    login: vi.fn(),
    register: vi.fn(),
    googleLogin: vi.fn(),
  };

  it('renders login form by default', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockContext}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    
    // Check if the component renders successfully
    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes.length).toBeGreaterThan(0);
  });
});
