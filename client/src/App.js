import React, { useState, useEffect, useCallback } from 'react';

// Components
import Sidebar from './components/Sidebar';
import CalendarHeader from './components/CalendarHeader';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import EventModal from './components/EventModal';
import Notification from './components/Notification';

// Services
import { eventService } from './services/api';

// Utils
import {
  getMonthStart,
  getMonthEnd,
  getWeekStart,
  getWeekEnd,
  getDayStart,
  getDayEnd
} from './utils/dateUtils';

// Styles
import './App.css';

/**
 * Main App Component
 * Manages calendar state, events, and view switching
 */
function App() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all fetched events
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);

  /**
   * Show notification
   */
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  /**
   * Hide notification
   */
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * Fetch events for the current view's date range
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let startDate, endDate;

      switch (view) {
        case 'month':
          startDate = getMonthStart(currentDate);
          endDate = getMonthEnd(currentDate);
          break;
        case 'week':
          startDate = getWeekStart(currentDate);
          endDate = getWeekEnd(currentDate);
          break;
        case 'day':
          startDate = getDayStart(currentDate);
          endDate = getDayEnd(currentDate);
          break;
        default:
          startDate = getMonthStart(currentDate);
          endDate = getMonthEnd(currentDate);
      }

      const fetchedEvents = await eventService.getEvents(startDate, endDate);
      setAllEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('Failed to load events. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, showNotification]);

  // Fetch events when date or view changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /**
   * Filter events based on search query
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setEvents(allEvents);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allEvents.filter(event => {
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      
      return title.includes(query) || 
             description.includes(query) || 
             location.includes(query);
    });
    
    setEvents(filtered);
  }, [searchQuery, allEvents]);

  /**
   * Create a new event
   */
  const handleCreateEvent = useCallback(async (eventData) => {
    try {
      await eventService.createEvent(eventData);
      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
      showNotification('Event created successfully!', 'success');
    } catch (error) {
      console.error('Error creating event:', error);
      showNotification(error.message || 'Failed to create event. Please try again.', 'error');
      throw error;
    }
  }, [fetchEvents, showNotification]);

  /**
   * Update an existing event
   */
  const handleUpdateEvent = useCallback(async (id, eventData) => {
    try {
      await eventService.updateEvent(id, eventData);
      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
      showNotification('Event updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating event:', error);
      showNotification(error.message || 'Failed to update event. Please try again.', 'error');
      throw error;
    }
  }, [fetchEvents, showNotification]);

  /**
   * Delete an event
   */
  const handleDeleteEvent = useCallback(async (id) => {
    try {
      await eventService.deleteEvent(id);
      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
      showNotification('Event deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification(error.message || 'Failed to delete event. Please try again.', 'error');
      throw error;
    }
  }, [fetchEvents, showNotification]);

  /**
   * Handle date click - opens modal to create new event
   */
  const handleDateClick = useCallback((date) => {
    setSelectedEvent(null);
    setIsModalOpen(true);

    // Set default time to clicked date/time
    const defaultStart = new Date(date);
    const defaultEnd = new Date(date);
    defaultEnd.setHours(defaultStart.getHours() + 1);

    setSelectedEvent({
      startTime: defaultStart.toISOString(),
      endTime: defaultEnd.toISOString(),
      allDay: false,
    });
  }, []);

  /**
   * Handle event click - opens modal to edit event
   */
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  /**
   * Close modal and reset selected event
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  /**
   * Navigate to previous/next period based on current view
   */
  const navigateDate = useCallback((direction) => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          return newDate;
        });
        break;
      case 'week':
        setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          return newDate;
        });
        break;
      case 'day':
        setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          return newDate;
        });
        break;
      default:
        break;
    }
  }, [view]);

  /**
   * Navigate to today's date
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * Handle date selection from sidebar mini calendar
   */
  const handleSidebarDateClick = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  /**
   * Toggle sidebar minimized state
   */
  const handleMenuToggle = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen]);

  return (
    <div className="app">
      <Sidebar
        currentDate={currentDate}
        onDateClick={handleSidebarDateClick}
        onCreateEvent={() => {
          setSelectedEvent(null);
          setIsModalOpen(true);
        }}
        onDateChange={setCurrentDate}
        isMinimized={!isSidebarOpen}
      />
      
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-minimized'}`}>
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onNavigate={navigateDate}
          onToday={goToToday}
          onCreateEvent={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          onMenuToggle={handleMenuToggle}
          onDateChange={setCurrentDate}
          isSidebarOpen={isSidebarOpen}
          onSearchChange={setSearchQuery}
        />
        
        <div className="calendar-container">
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              loading={loading}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              loading={loading}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              loading={loading}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onSave={selectedEvent?.id || selectedEvent?._id ? 
            (data) => handleUpdateEvent(selectedEvent.id || selectedEvent._id, data) : 
            handleCreateEvent
          }
          onDelete={selectedEvent?.id || selectedEvent?._id ? 
            () => handleDeleteEvent(selectedEvent.id || selectedEvent._id) : 
            null
          }
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </div>
  );
}

export default App;

