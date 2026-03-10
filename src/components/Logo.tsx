import React from 'react';

interface LogoProps {
  variant: 'horizontal' | 'vertical';
  darkBackground?: boolean;
  className?: string;
}

const logoFiles = {
  horizontal: '/logotipo-alencar-empreendimentos-horizontal.webp',
  vertical: '/logotipo-alencar-empreendimentos-vertical.webp',
};

export const Logo: React.FC<LogoProps> = ({ variant, darkBackground = true, className = '' }) => {
  return (
    <img
      src={logoFiles[variant]}
      alt="Alencar Empreendimentos"
      className={`object-contain ${className}`}
      style={darkBackground ? undefined : { filter: 'brightness(0.15)' }}
    />
  );
};
