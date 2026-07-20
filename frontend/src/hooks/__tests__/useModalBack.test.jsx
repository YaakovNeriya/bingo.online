import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModalBack } from '../useModalBack';

describe('useModalBack', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes state to history when modal opens', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const onClose = vi.fn();

    const { rerender } = renderHook(
      ({ isOpen }) => useModalBack(isOpen, onClose, 'test_modal'),
      { initialProps: { isOpen: false } }
    );

    expect(pushStateSpy).not.toHaveBeenCalled();

    rerender({ isOpen: true });

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ modalId: 'test_modal' }),
      ''
    );
  });

  it('calls onClose when popstate event fires (user presses back)', () => {
    const onClose = vi.fn();

    renderHook(() => useModalBack(true, onClose, 'test_modal'));

    // Trigger popstate event (simulating native back button)
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
