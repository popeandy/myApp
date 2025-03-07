import React from 'react';
import PropTypes from 'prop-types';

export const Card = ({ children, className }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className }) => {
  return <div className={`card-content ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className }) => {
  return <div className={`card-header ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className }) => {
  return <h2 className={`card-title ${className}`}>{children}</h2>;
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};