import React from 'react';
import PropTypes from 'prop-types';

// Avatar.js
export const Avatar = ({ children, className }) => {
  return <div className={`avatar ${className}`}>{children}</div>;
};

export const AvatarFallback = ({ children, className }) => {
  return <div className={`avatar-fallback ${className}`}>{children}</div>;
};

export const AvatarImage = ({ src, alt, className }) => {
  return <img src={src} alt={alt} className={`avatar-image ${className}`} />;
};

// PropTypes for all Avatar components
Avatar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AvatarFallback.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AvatarImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
};