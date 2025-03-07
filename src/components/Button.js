import React from 'react';

function Button({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white' }}>
      {children}
    </button>
  );
}

export default Button;