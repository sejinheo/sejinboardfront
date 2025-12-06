import { useState, useEffect } from 'react';
import AlertModal from '../../../components/AlertModal';
import '../styles/FilterNav.css';

function FilterNav({ showMyArticles = false, activeFilter: externalActiveFilter, onFilterChange }) {
  const [internalActiveFilter, setInternalActiveFilter] = useState('트렌딩');
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  
  const activeFilter = externalActiveFilter !== undefined ? externalActiveFilter : internalActiveFilter;
  const setActiveFilter = (filter) => {
    if (externalActiveFilter === undefined) {
      setInternalActiveFilter(filter);
    }
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  const filters = ['트렌딩', '추천', '최신', '피드'];

  useEffect(() => {
    if (showMyArticles) {
      if (externalActiveFilter === undefined) {
        setInternalActiveFilter('');
      }
      if (onFilterChange) {
        onFilterChange('');
      }
    } else if (!activeFilter) {
      if (externalActiveFilter === undefined) {
        setInternalActiveFilter('트렌딩');
      }
      if (onFilterChange) {
        onFilterChange('트렌딩');
      }
    }
  }, [showMyArticles, externalActiveFilter, activeFilter, onFilterChange]);

  if (showMyArticles) {
    return null;
  }

  return (
    <nav className="filter-nav">
      <div className="filter-nav-container">
        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="filter-options">
          <select className="time-filter">
            <option>이번 주</option>
            <option>이번 달</option>
            <option>올해</option>
          </select>
          <button 
            className="more-options"
            onClick={() => {
              setAlertModal({ isOpen: true, message: '신고하지 마세요!\n근찬쌤의 수행평가 웹사이트입니다.', type: 'info' });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
        message={alertModal.message}
        type={alertModal.type}
      />
    </nav>
  );
}

export default FilterNav;
