import React, { useEffect, useState, useId } from 'react';

const ThemeToggle = ({ style }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const toggleId = useId();
  const themeId = `theme-${toggleId}`;

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    setTheme(e.target.checked ? 'dark' : 'light');
  };

  return (
    <label htmlFor={themeId} className="theme" style={{ ...style, fontSize: '14.5px', cursor: 'pointer' }} dir="ltr">
      <span className="theme__toggle-wrap">
        <input 
          id={themeId} 
          className="theme__toggle" 
          type="checkbox" 
          role="switch" 
          name={themeId} 
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
