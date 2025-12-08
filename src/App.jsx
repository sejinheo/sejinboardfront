import { useState, useEffect } from 'react';
import { HomePage, WritePage, ArticleDetailPage } from './modules/home';
import { LoginPage } from './modules/auth';
import { tokenUtils } from './utils/token';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = tokenUtils.getAccessToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/login') {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  const path = window.location.pathname;
  if (path === '/login') {
    return <LoginPage />;
  }
  
  if (path === '/write') {
    return <WritePage />;
  }

  if (path.startsWith('/edit/')) {
    return <WritePage />;
  }

  if (path.startsWith('/article/')) {
    return <ArticleDetailPage />;
  }

  return <HomePage />;
}

export default App;
