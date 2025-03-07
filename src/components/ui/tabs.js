import React from 'react';
import PropTypes from 'prop-types';

export const Tabs = ({ children, className }) => {
  return <div className={`tabs ${className}`}>{children}</div>;
};

export const TabsContent = ({ children, className }) => {
  return <div className={`tabs-content ${className}`}>{children}</div>;
};

export const TabsList = ({ children, className }) => {
  return <div className={`tabs-list ${className}`}>{children}</div>;
};

export const TabsTrigger = ({ children, className }) => {
  return <div className={`tabs-trigger ${className}`}>{children}</div>;
};

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};