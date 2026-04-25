import React from 'react';

const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const dialogStyle = {
    backgroundColor: 'var(--surface)',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '90%',
    border: '1px solid var(--border)',
    boxShadow: '0 10px 25px -5 rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  };

  const messageStyle = {
    color: 'var(--text)',
    fontSize: '16px',
    marginBottom: '24px',
    lineHeight: 1.5,
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  };

  const buttonBaseStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    border: 'none',
  };

  const cancelButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: 'var(--surface2)',
    color: 'var(--text)',
  };

  const confirmButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: 'var(--danger)',
    color: '#fff',
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={messageStyle}>{message}</div>
        <div style={buttonContainerStyle}>
          <button
            style={cancelButtonStyle}
            onClick={onCancel}
            onMouseDown={(e) => e.preventDefault()}
          >
            Cancel
          </button>
          <button
            style={confirmButtonStyle}
            onClick={onConfirm}
            onMouseDown={(e) => e.preventDefault()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
