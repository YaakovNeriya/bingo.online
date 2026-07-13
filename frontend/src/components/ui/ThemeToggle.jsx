import React, { useEffect, useState } from 'react';

const ThemeToggle = ({ style }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  };

  return (
    <label htmlFor="theme" className="theme" style={{ ...style, fontSize: '16px', cursor: 'pointer' }} dir="ltr">
      <span className="theme__toggle-wrap">
        <input 
          id="theme" 
          className="theme__toggle" 
          type="checkbox" 
          role="switch" 
          name="theme" 
          value="dark"
          checked={theme === 'dark'}
          onChange={toggleTheme}
          style={{ cursor: 'pointer' }}
        />
        <span className="theme__icon">
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
          <span className="theme__icon-part"></span>
        </span>
      </span>
    </label>
  );
};

export default ThemeToggle;
