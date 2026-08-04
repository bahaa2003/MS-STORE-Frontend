import React from 'react';
import { LogIn } from 'lucide-react';

const PublicLoginButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="public-login-button group"
  >
    <span className="public-login-button__content">
      <span className="public-login-button__icon" aria-hidden="true">
        <LogIn className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span>{children}</span>
    </span>
  </button>
);

export default PublicLoginButton;
