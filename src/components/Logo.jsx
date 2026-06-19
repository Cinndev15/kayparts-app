import React from 'react';
import logoImg from '../assets/kayparts.png';

const Logo = ({ height = 50, className = '' }) => {
  return (
    <img
      src={logoImg}
      alt="Kayparts Logo"
      className={className}
      style={{
        height: `${height}px`,
        width: 'auto',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    />
  );
};

export default Logo;

