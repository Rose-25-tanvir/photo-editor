import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use explicit file extension to resolve ambiguity between App.tsx and the empty app.tsx.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);