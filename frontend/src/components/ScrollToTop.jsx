import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const action = useNavigationType();

  useLayoutEffect(() => {
    // Only scroll to top if we are navigating forward (clicking a link)
    // If action is 'POP', it means the user clicked the browser's Back/Forward button,
    // so we let the browser handle restoring the scroll position naturally.
    if (action !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, action]);

  return null;
};

export default ScrollToTop;
