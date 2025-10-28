import React from 'react';
import { logoBase64 } from '../data/logo';

const Logo: React.FC<{ className?: string }> = ({ className = "h-12" }) => {
  return (
    <img src={logoBase64} alt="Nuba Flower Tours Logo" className={className} />
  );
};

export default Logo;
