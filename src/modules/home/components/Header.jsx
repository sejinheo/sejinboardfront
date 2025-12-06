import { useState, useEffect, useRef } from 'react';
import { tokenUtils } from '../../../utils/token';
import { authApi } from '../../../services/api/auth';
import ConfirmModal from '../../../components/ConfirmModal';
import '../styles/Header.css';

function Header({ onSearch, searchQuery = '' }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {

    const checkAuth = () => {
      const token = tokenUtils.getAccessToken();
      setIsLoggedIn(!!token);
      if (!token) {
        setShowProfileMenu(false);
      }
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === null) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showNotificationModal) {
        setShowNotificationModal(false);
      }
    };

    if (showNotificationModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showNotificationModal]);

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {

      await authApi.logout();
    } catch (error) {
      console.error('로그아웃 에러:', error);

    } finally {

      tokenUtils.clearAll();
      setIsLoggedIn(false);
      setIsLoggingOut(false);
      
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {

        window.location.reload();
      }
    }
  };

  const handleMyArticles = () => {
    setShowProfileMenu(false);

    window.location.href = '/?myArticles=true';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  const handleCloseNotificationModal = () => {
    setShowNotificationModal(false);
  };

  const handleSearchIconClick = () => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {

      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {

      setSearchInput('');
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);

    if (onSearch) {
      if (e.target.value.trim()) {
        onSearch(e.target.value.trim());
      } else {
        onSearch('');
      }
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setShowSearchBar(true);
      setSearchInput(searchQuery);
    }
  }, [searchQuery]);

  return (
    <header className="header">
      <div className="header-container">
        <div 
          className="logo"
          onClick={() => {
            window.location.href = '/';
          }}
        >
              SJ_Board
        </div>
        <div className="header-actions">
          <button 
            className="icon-button"
            onClick={handleNotificationClick}
            title="알림"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button 
            className="icon-button"
            onClick={handleSearchIconClick}
            title="검색"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          {isLoggedIn ? (
            <>
              <button 
                className="write-button"
                onClick={() => {
                  window.location.href = '/write';
                }}
              >
                새 글 작성
              </button>
              <div className="profile-menu-container" ref={profileMenuRef}>
                <div 
                  className="user-avatar"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <button 
                      className="profile-menu-item"
                      onClick={handleMyArticles}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                      내 게시글 조회
                    </button>
                    <button 
                      className="profile-menu-item"
                      onClick={handleLogoutClick}
                      disabled={isLoggingOut}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button 
              className="login-button"
              onClick={handleLogin}
            >
              로그인
            </button>
          )}
        </div>
      </div>
      {showSearchBar && (
        <div className="search-bar-container">
          <form className="search-bar-form" onSubmit={handleSearchSubmit}>
            <div className="search-bar-wrapper">
              <svg 
                className="search-icon" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="검색어를 입력하세요"
                value={searchInput}
                onChange={handleSearchInputChange}
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-button"
                  onClick={() => {
                    setSearchInput('');
                    if (onSearch) {
                      onSearch('');
                    }
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {showNotificationModal && (
        <div className="modal-overlay" onClick={handleCloseNotificationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <button className="modal-close" onClick={handleCloseNotificationModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <h3 className="modal-title">알림 안내</h3>
              <p className="modal-message">
                하나의 게시글에 10000개의 좋아요를 받으면 특별한 알림이 갑니다!
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={handleCloseNotificationModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        type="warning"
      />
    </header>
  );
}

export default Header;
