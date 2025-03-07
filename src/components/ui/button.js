import React from 'react';
import PropTypes from 'prop-types';

export const Button = ({ children, onClick, className, variant }) => {
  return (
    <button className={`button ${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.string,
};