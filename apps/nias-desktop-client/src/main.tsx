import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/base.css';
import './assets/common.css';
import './assets/login.css';
import './assets/modal.css';
import './assets/header.css';
import './assets/sidebar.css';
import './assets/main-layout.css';
import './assets/definition-pages.css';
import './assets/definition-modals.css';
import './assets/item-modals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);