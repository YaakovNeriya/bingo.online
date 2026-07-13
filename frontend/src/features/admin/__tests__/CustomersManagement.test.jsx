import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomersManagement from '../views/CustomersManagement';
import client from '../../../api/client';

// Mock the API client
vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}));

// Mock the printUtils
vi.mock('../../../utils/printUtils', () => ({
  generatePrintHtml: vi.fn()
}));

const mockRegions = [
  { id: 1, name: 'Center' },
  { id: 2, name: 'North' }
];

describe('CustomersManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays regions on mount', async () => {
    client.get.mockResolvedValueOnce({ data: mockRegions });
    
    render(<CustomersManagement />);
    
    // Check if regions are displayed
    await waitFor(() => {
      expect(screen.getByText('Center')).toBeInTheDocument();
      expect(screen.getByText('North')).toBeInTheDocument();
    });
  });

  it('fetches region customers when a region is clicked', async () => {
    client.get.mockResolvedValueOnce({ data: mockRegions }); // Initial fetchRegions
    
    render(<CustomersManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Center')).toBeInTheDocument();
    });

    const mockCustomers = [
      { id: 101, first_name: 'John', last_name: 'Doe', phone: '0501234567', total_cart_price: 500, order_count: 2, email: 'john@doe.com' }
    ];
    
    // Mock the fetchRegionCustomers call
    client.get.mockResolvedValueOnce({ data: mockCustomers });

    // Click the region to expand (it's the button near the text, we can use test-id or find button)
    const toggleButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-chevron-down'));
    if (toggleButton) {
      fireEvent.click(toggleButton);
    } else {
      // fallback
      fireEvent.click(screen.getByText('Center'));
    }

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('0501234567')).toBeInTheDocument();
    });
  });
});
