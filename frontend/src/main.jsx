import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './styles/theme.css';
import App from './App.jsx';
import { store } from './store/slices';
import { initFrontendMonitoring } from './monitoring/sentry';
import ThemeProvider from './theme/ThemeProvider';
import { applyThemeToDocument, getBootstrapTheme } from './theme/theme';

try {
  const user = localStorage.getItem('user');
  if (user === 'undefined' || user === null) {
    localStorage.removeItem('user');
  }
} catch (error) {
  localStorage.removeItem('user');
}

applyThemeToDocument(getBootstrapTheme());
void initFrontendMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
