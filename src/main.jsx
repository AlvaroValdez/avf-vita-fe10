import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/main.scss';
import { AppProvider } from './context/AppContext'; // 1. Importa el proveedor

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
  <AppProvider> {/* 2. Envuelve la aplicación */}
    <HashRouter>
      <App />
    </HashRouter>
  </AppProvider>
  //</React.StrictMode>,
);