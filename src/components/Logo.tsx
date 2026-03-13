import React from 'react';

interface LogoProps {
  variant: 'horizontal' | 'vertical' | 'horizontal-no-slogan';
  darkBackground?: boolean;
  className?: string;
}

const logoFiles = {
  horizontal: '/logotipo-alencar-empreendimentos-horizontal.webp',
  vertical: '/logotipo-alencar-empreendimentos-vertical.webp',
  'horizontal-no-slogan': '/logotipo-alencar-empreendimentos-horizontal-semslogan.webp',
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
