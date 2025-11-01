import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, getYear, getMonth, setMonth, setYear } from 'date-fns';
import {
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaCog,
  FaBell,
  FaTh
} from 'react-icons/fa';

import './CalendarHeader.css';

/**
 * CalendarHeader Component
 * Displays navigation controls, view switcher, and date selectors
 */
const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onToday,
  onMenuToggle,
  onDateChange,
  isSidebarOpen = true,
  onSearchChange
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  /**
   * Get formatted title based on current view
   */
  const getHeaderTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  /**
   * Handle month selection change
   */
  const handleMonthChange = useCallback((e) => {
    const month = parseInt(e.target.value);
    const newDate = setMonth(currentDate, month);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [currentDate, onDateChange]);

  /**
   * Handle year selection change
   */
  const handleYearChange = useCallback((e) => {
    const year = parseInt(e.target.value);
    const newDate = setYear(currentDate, year);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [currentDate, onDateChange]);

  /**
   * Handle day selection change
   */
  const handleDayChange = useCallback((e) => {
    const dateStr = e.target.value;
    const newDate = new Date(dateStr);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [onDateChange]);

  // Memoize years and months arrays for performance
  const currentYear = useMemo(() => getYear(currentDate), [currentDate]);
  const years = useMemo(() => {
    const yearList = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      yearList.push(i);
    }
    return yearList;
  }, [currentYear]);

  // Months array
  const months = useMemo(() => [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ], []);

  /**
   * Get current week start date for week view
   */
  const getCurrentWeekStart = useMemo(() => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    return format(weekStart, 'yyyy-MM-dd');
  }, [currentDate]);

  /**
   * Handle week date change
   */
  const handleWeekChange = useCallback((e) => {
    const selectedDate = new Date(e.target.value);
    // Set to start of week (Sunday)
    selectedDate.setDate(selectedDate.getDate() - selectedDate.getDay());
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  }, [onDateChange]);

  return (
    <header className="calendar-header">
      <div className="header-left">
        {/* Menu Icon */}
        <button 
          className={`menu-icon-button ${!isSidebarOpen ? 'sidebar-minimized' : ''}`}
          onClick={onMenuToggle}
          aria-label={!isSidebarOpen ? 'Expand sidebar' : 'Minimize sidebar'}
          aria-expanded={isSidebarOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#5f6368"/>
          </svg>
        </button>

        <div className="logo-section">
          <svg className="google-calendar-icon" viewBox="0 0 24 24" width="40" height="40">
            <path fill="#4285f4" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5zm7 7H7v-2h5v2zm5-4H7v2h10v-2z"/>
          </svg>
          <span className="logo-text">Calendar</span>
        </div>

        {/* Navigation Controls - Moved to left after logo */}
        <div className="navigation-controls">
          <button 
            className="nav-button icon-button" 
            onClick={() => onNavigate('prev')}
            aria-label="Previous"
          >
            <FaChevronLeft />
          </button>
          <button 
            className="nav-button today-button" 
            onClick={onToday}
          >
            Today
          </button>
          <button 
            className="nav-button icon-button" 
            onClick={() => onNavigate('next')}
            aria-label="Next"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Date Title - Inline with navigation */}
        <div className="view-title-container">
          {view === 'month' ? (
            <div className="date-selectors">
              <select 
                className="month-select"
                value={getMonth(currentDate)}
                onChange={handleMonthChange}
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              <select 
                className="year-select"
                value={currentYear}
                onChange={handleYearChange}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          ) : view === 'week' ? (
            <div className="date-selectors">
              <input
                type="date"
                className="week-select"
                value={getCurrentWeekStart}
                onChange={handleWeekChange}
              />
            </div>
          ) : view === 'day' ? (
            <div className="date-selectors">
              <input
                type="date"
                className="day-select"
                value={format(currentDate, 'yyyy-MM-dd')}
                onChange={handleDayChange}
              />
            </div>
          ) : (
            <div className="view-title">{getHeaderTitle()}</div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* View Switcher */}
        <div className="view-switcher">
          <button
            className={`view-button ${view === 'month' ? 'active' : ''}`}
            onClick={() => onViewChange('month')}
          >
            Month
          </button>
          <button
            className={`view-button ${view === 'week' ? 'active' : ''}`}
            onClick={() => onViewChange('week')}
          >
            Week
          </button>
          <button
            className={`view-button ${view === 'day' ? 'active' : ''}`}
            onClick={() => onViewChange('day')}
          >
            Day
          </button>
        </div>
        
        {/* Search Bar - Moved to right */}
        <div className={`search-container ${isSearchOpen ? 'open' : ''}`}>
          {isSearchOpen ? (
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search events"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (onSearchChange) {
                    onSearchChange(value);
                  }
                }}
                autoFocus
                onBlur={() => {
                  if (!searchQuery) {
                    setIsSearchOpen(false);
                  }
                }}
                aria-label="Search events"
              />
              {searchQuery && (
                <button 
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    if (onSearchChange) {
                      onSearchChange('');
                    }
                  }}
                  aria-label="Clear search"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#5f6368"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button 
              className="search-button"
              onClick={() => {
                setIsSearchOpen(true);
                // Focus input after state update
                setTimeout(() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }, 0);
              }}
              aria-label="Search"
            >
              <FaSearch />
            </button>
          )}
        </div>

        {/* Menu Bar Icons */}
        <div className="menu-bar-icons">
          <button className="menu-bar-icon" title="Settings">
            <FaCog />
          </button>
          <button className="menu-bar-icon" title="Notifications">
            <FaBell />
          </button>
          <button className="menu-bar-icon apps-icon" title="Google Apps">
            <FaTh />
          </button>
          <button className="menu-bar-icon profile-icon" title="Google Account">
            <div className="profile-avatar">A</div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default React.memo(CalendarHeader);

