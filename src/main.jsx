import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { AppProvider } from './context/AppContext'; // 1. Importa el proveedor

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <AppProvider> {/* 2. Envuelve la aplicación */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  //</React.StrictMode>,
);