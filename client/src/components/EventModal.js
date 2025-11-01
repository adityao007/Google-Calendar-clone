import React, { useState, useEffect, useRef } from 'react';
import { parseISO, format, addDays, addHours, startOfDay, isToday, isTomorrow, isSameDay } from 'date-fns';
import { 
  FaTimes, 
  FaTrash, 
  FaMapMarkerAlt, 
  FaAlignLeft, 
  FaClock,
  FaCalendarAlt,
  FaPalette,
  FaRedo,
  FaCalendarCheck,
  FaChevronRight
} from 'react-icons/fa';

import './EventModal.css';

/**
 * EventModal Component
 * Modal for creating and editing calendar events
 */
const EventModal = ({ event, onClose, onSave, onDelete }) => {
  const isEditing = event?.id || event?._id;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from event prop or defaults
  const getInitialFormData = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);

    return {
      title: event?.title || '',
      description: event?.description || '',
      startTime: event?.startTime
        ? format(parseISO(event.startTime), "yyyy-MM-dd'T'HH:mm")
        : format(now, "yyyy-MM-dd'T'HH:mm"),
      endTime: event?.endTime
        ? format(parseISO(event.endTime), "yyyy-MM-dd'T'HH:mm")
        : format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
      allDay: event?.allDay || false,
      color: event?.color || '#4285f4',
      location: event?.location || '',
      recurring: event?.recurring || 'none',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  // Update form data when event prop changes
  useEffect(() => {
    const newFormData = getInitialFormData();
    setFormData(newFormData);
    
    // Calculate duration
    if (event?.startTime && event?.endTime) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setDurationHours(diffHours);
      setDurationMinutes(diffMinutes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?._id]);

  // Update end time when duration changes (only if duration was changed manually)
  useEffect(() => {
    if (!formData.startTime || !formData.endTime) return;
    
    const start = new Date(formData.startTime);
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    end.setMinutes(start.getMinutes() + durationMinutes);
    
    // Only update if the calculated end time differs significantly from current end time
    // This prevents infinite loops and respects manual adjustments
    const currentEnd = new Date(formData.endTime);
    const expectedEnd = new Date(end);
    const diffMinutes = Math.abs((currentEnd - expectedEnd) / (1000 * 60));
    
    // If difference is more than 1 minute, update (user likely changed duration)
    if (diffMinutes > 1) {
      setFormData(prev => ({
        ...prev,
        endTime: format(end, formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationHours, durationMinutes]);

  // Focus title input when modal opens
  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !showDeleteConfirm) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showDeleteConfirm]);

  // Available event colors
  const colors = [
    { name: 'Blue', value: '#4285f4' },
    { name: 'Green', value: '#34a853' },
    { name: 'Yellow', value: '#fbbc04' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Red', value: '#ea4335' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Teal', value: '#009688' },
  ];

  /**
   * Quick time options
   */
  const quickTimeOptions = [
    { label: '30 minutes', hours: 0, minutes: 30 },
    { label: '1 hour', hours: 1, minutes: 0 },
    { label: '2 hours', hours: 2, minutes: 0 },
    { label: 'Half day', hours: 4, minutes: 0 },
    { label: 'Full day', hours: 8, minutes: 0 },
  ];

  /**
   * Quick date options
   */
  const quickDateOptions = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'In 2 days', days: 2 },
    { label: 'In 3 days', days: 3 },
    { label: 'Next week', days: 7 },
  ];

  /**
   * Time presets
   */
  const timePresets = [
    { label: '9:00 AM', hours: 9, minutes: 0 },
    { label: '10:00 AM', hours: 10, minutes: 0 },
    { label: '11:00 AM', hours: 11, minutes: 0 },
    { label: '12:00 PM', hours: 12, minutes: 0 },
    { label: '1:00 PM', hours: 13, minutes: 0 },
    { label: '2:00 PM', hours: 14, minutes: 0 },
    { label: '3:00 PM', hours: 15, minutes: 0 },
    { label: '4:00 PM', hours: 16, minutes: 0 },
    { label: '5:00 PM', hours: 17, minutes: 0 },
  ];

  /**
   * Handle quick date selection
   */
  const handleQuickDate = (days) => {
    const today = startOfDay(new Date());
    const selectedDate = addDays(today, days);
    
    setFormData(prev => {
      const currentStart = new Date(prev.startTime);
      const newStart = new Date(selectedDate);
      
      // Preserve time if not all-day
      if (!prev.allDay) {
        newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
      }
      
      const newStartTime = format(newStart, prev.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm");
      
      // Update end time to maintain duration
      const currentEnd = new Date(prev.endTime);
      const duration = currentEnd - currentStart;
      const newEnd = new Date(newStart.getTime() + duration);
      const newEndTime = format(newEnd, prev.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm");
      
      return {
        ...prev,
        startTime: newStartTime,
        endTime: newEndTime,
      };
    });
  };

  /**
   * Handle time preset selection
   */
  const handleTimePreset = (hours, minutes, isStart = true) => {
    setFormData(prev => {
      const date = new Date(isStart ? prev.startTime : prev.endTime);
      date.setHours(hours, minutes, 0, 0);
      
      const newTime = format(date, "yyyy-MM-dd'T'HH:mm");
      
      if (isStart) {
        // Update start time and maintain end time if duration is positive
        const currentEnd = new Date(prev.endTime);
        const newStart = new Date(date);
        
        // Ensure end time is after start time
        if (currentEnd <= newStart) {
          const defaultEnd = new Date(newStart);
          defaultEnd.setHours(newStart.getHours() + 1);
          return {
            ...prev,
            startTime: newTime,
            endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
          };
        }
        
        return {
          ...prev,
          startTime: newTime,
        };
      } else {
        // Update end time
        const currentStart = new Date(prev.startTime);
        if (date <= currentStart) {
          // If end time is before start, set it to 1 hour after start
          const defaultEnd = new Date(currentStart);
          defaultEnd.setHours(currentStart.getHours() + 1);
          return {
            ...prev,
            endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
          };
        }
        
        return {
          ...prev,
          endTime: newTime,
        };
      }
    });
  };

  /**
   * Get formatted date display
   */
  const getDateDisplay = (dateStr, isAllDay) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    
    if (isAllDay) {
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'EEEE, MMMM d, yyyy');
    }
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'EEEE, MMM d, yyyy at h:mm a');
  };

  /**
   * Handle quick time selection
   */
  const handleQuickTime = (hours, minutes) => {
    setDurationHours(hours);
    setDurationMinutes(minutes);
  };

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear validation errors
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Handle allDay toggle - convert date format accordingly
    if (name === 'allDay' && checked !== formData.allDay) {
      const newAllDay = checked;
      setFormData(prev => {
        let newStartTime = prev.startTime;
        let newEndTime = prev.endTime;
        
        if (newAllDay) {
          // Convert datetime-local to date format
          newStartTime = prev.startTime.includes('T') ? prev.startTime.split('T')[0] : prev.startTime;
          newEndTime = prev.endTime.includes('T') ? prev.endTime.split('T')[0] : prev.endTime;
        } else {
          // Convert date to datetime-local format
          if (!prev.startTime.includes('T')) {
            newStartTime = prev.startTime + 'T09:00';
          }
          if (!prev.endTime.includes('T')) {
            newEndTime = prev.endTime + 'T10:00';
          }
        }
        
        return {
          ...prev,
          allDay: newAllDay,
          startTime: newStartTime,
          endTime: newEndTime
        };
      });
      return;
    }
    
    // Handle start time change - update duration
    if (name === 'startTime') {
      setFormData(prev => {
        const newStart = new Date(value);
        const currentEnd = new Date(prev.endTime);
        const diffMs = currentEnd - newStart;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDurationHours(Math.max(0, diffHours));
        setDurationMinutes(Math.max(0, diffMinutes));
        return { ...prev, [name]: value };
      });
      return;
    }
    
    // Handle end time change - update duration
    if (name === 'endTime') {
      setFormData(prev => {
        const start = new Date(prev.startTime);
        const end = new Date(value);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDurationHours(Math.max(0, diffHours));
        setDurationMinutes(Math.max(0, diffMinutes));
        return { ...prev, [name]: value };
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});
    const errors = {};

    // Validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }

    if (formData.title.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }

    if (formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    if (formData.location.length > 200) {
      errors.location = 'Location cannot exceed 200 characters';
    }

    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);

    if (isNaN(startDate.getTime())) {
      errors.startTime = 'Invalid start time';
    }

    if (isNaN(endDate.getTime())) {
      errors.endTime = 'Invalid end time';
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate <= startDate) {
      errors.endTime = 'End time must be after start time';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Handle all-day events - set time to start/end of day
      let startTime, endTime;
      if (formData.allDay) {
        const startDate = new Date(formData.startTime);
        startDate.setHours(0, 0, 0, 0);
        startTime = startDate.toISOString();
        
        const endDate = new Date(formData.endTime);
        endDate.setHours(23, 59, 59, 999);
        endTime = endDate.toISOString();
      } else {
        startTime = new Date(formData.startTime).toISOString();
        endTime = new Date(formData.endTime).toISOString();
      }
      
      await onSave({
        ...formData,
        startTime,
        endTime,
      });
    } catch (error) {
      console.error('Error saving event:', error);
      // Error will be handled by parent component's notification system
    }
  };

  /**
   * Show delete confirmation modal
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm and execute delete
   */
  const handleConfirmDelete = async () => {
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Error will be handled by parent component's notification system
      throw error; // Re-throw to let parent handle
    }
  };

  /**
   * Cancel delete confirmation
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        aria-label="Close modal"
      ></div>
      <div 
        className="event-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-title-wrapper">
              <div className="modal-icon">
                <FaCalendarAlt />
              </div>
              <div>
                <div className="modal-title" id="modal-title">
                  {isEditing ? 'Edit Event' : 'Create New Event'}
                </div>
                <div className="modal-subtitle">
                  {isEditing ? 'Update your event details' : 'Fill in the details to create your event'}
                </div>
              </div>
            </div>
            <button className="close-button" onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Title Section */}
          <div className="form-section">
            <div className="form-group title-group">
              <input
                ref={titleInputRef}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Add title"
                className={`title-input ${validationErrors.title ? 'error' : ''}`}
                required
                maxLength={200}
                aria-label="Event title"
                aria-required="true"
              />
              <div className="char-counter">
                {formData.title.length}/200
              </div>
              {validationErrors.title && (
                <div className="error-message">{validationErrors.title}</div>
              )}
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="form-section datetime-section">
            <div className="section-header">
              <FaCalendarAlt className="section-icon" />
              <span className="section-title">Date & Time</span>
            </div>
            
            {/* All Day Toggle */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                All day event
              </label>
            </div>

            {/* Quick Date Selection */}
            <div className="quick-date-section">
              <label className="input-label">
                <FaCalendarCheck className="label-icon" />
                Quick Select
              </label>
              <div className="quick-date-buttons">
                {quickDateOptions.map((option, idx) => {
                  const selectedDate = addDays(startOfDay(new Date()), option.days);
                  const currentStart = new Date(formData.startTime);
                  const isSelected = isSameDay(selectedDate, startOfDay(currentStart));
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`quick-date-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleQuickDate(option.days)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Date/Time */}
            <div className="datetime-group">
              <div className="datetime-header">
                <label className="input-label">
                  <FaChevronRight className="label-icon" />
                  Start
                </label>
                <div className="date-display">
                  {getDateDisplay(formData.startTime, formData.allDay)}
                </div>
              </div>
              
              <div className="datetime-controls">
                <div className="date-control">
                  <label className="control-label">Date</label>
                  <input
                    type="date"
                    name="startTime"
                    value={formData.allDay 
                      ? (formData.startTime.includes('T') ? formData.startTime.split('T')[0] : formData.startTime)
                      : (formData.startTime.includes('T') ? formData.startTime.split('T')[0] : formData.startTime)
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      const currentTime = formData.allDay ? '' : (formData.startTime.includes('T') ? formData.startTime.split('T')[1] : '09:00');
                      const newValue = formData.allDay ? dateValue : `${dateValue}T${currentTime}`;
                      handleChange({ target: { name: 'startTime', value: newValue } });
                    }}
                    className={`datetime-input ${validationErrors.startTime ? 'error' : ''}`}
                    required
                  />
                </div>
                
                {!formData.allDay && (
                  <>
                    <div className="time-control">
                      <label className="control-label">Time</label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime.includes('T') ? formData.startTime.split('T')[1] : ''}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          const currentDate = formData.startTime.includes('T') ? formData.startTime.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
                          const newValue = `${currentDate}T${timeValue}`;
                          handleChange({ target: { name: 'startTime', value: newValue } });
                        }}
                        className={`datetime-input ${validationErrors.startTime ? 'error' : ''}`}
                        required
                      />
                    </div>
                    
                    {/* Time Presets for Start */}
                    <div className="time-presets">
                      {timePresets.map((preset, idx) => {
                        const currentStart = new Date(formData.startTime);
                        const isSelected = currentStart.getHours() === preset.hours && currentStart.getMinutes() === preset.minutes;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`time-preset-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleTimePreset(preset.hours, preset.minutes, true)}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              
              {validationErrors.startTime && (
                <div className="error-message">{validationErrors.startTime}</div>
              )}
            </div>

            {/* End Date/Time */}
            <div className="datetime-group">
              <div className="datetime-header">
                <label className="input-label">
                  <FaClock className="label-icon" />
                  End
                </label>
                <div className="date-display">
                  {getDateDisplay(formData.endTime, formData.allDay)}
                </div>
              </div>
              
              <div className="datetime-controls">
                <div className="date-control">
                  <label className="control-label">Date</label>
                  <input
                    type="date"
                    name="endTime"
                    value={formData.allDay 
                      ? (formData.endTime.includes('T') ? formData.endTime.split('T')[0] : formData.endTime)
                      : (formData.endTime.includes('T') ? formData.endTime.split('T')[0] : formData.endTime)
                    }
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      const currentTime = formData.allDay ? '' : (formData.endTime.includes('T') ? formData.endTime.split('T')[1] : '10:00');
                      const newValue = formData.allDay ? dateValue : `${dateValue}T${currentTime}`;
                      handleChange({ target: { name: 'endTime', value: newValue } });
                    }}
                    className={`datetime-input ${validationErrors.endTime ? 'error' : ''}`}
                    required
                  />
                </div>
                
                {!formData.allDay && (
                  <>
                    <div className="time-control">
                      <label className="control-label">Time</label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime.includes('T') ? formData.endTime.split('T')[1] : ''}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          const currentDate = formData.endTime.includes('T') ? formData.endTime.split('T')[0] : format(new Date(), 'yyyy-MM-dd');
                          const newValue = `${currentDate}T${timeValue}`;
                          handleChange({ target: { name: 'endTime', value: newValue } });
                        }}
                        className={`datetime-input ${validationErrors.endTime ? 'error' : ''}`}
                        required
                      />
                    </div>
                    
                    {/* Time Presets for End */}
                    <div className="time-presets">
                      {timePresets.map((preset, idx) => {
                        const currentEnd = new Date(formData.endTime);
                        const isSelected = currentEnd.getHours() === preset.hours && currentEnd.getMinutes() === preset.minutes;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`time-preset-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleTimePreset(preset.hours, preset.minutes, false)}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              
              {validationErrors.endTime && (
                <div className="error-message">{validationErrors.endTime}</div>
              )}
            </div>

            {/* Duration Section (only for timed events) */}
            {!formData.allDay && (
              <div className="duration-section">
                <div className="duration-header">
                  <label className="input-label">Duration</label>
                  <div className="duration-display">
                    {durationHours > 0 && `${durationHours} hour${durationHours !== 1 ? 's' : ''}`}
                    {durationMinutes > 0 && ` ${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`}
                    {durationHours === 0 && durationMinutes === 0 && '0 minutes'}
                  </div>
                </div>
                
                <div className="duration-controls">
                  <div className="duration-input-group">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                      className="duration-input"
                    />
                    <span className="duration-label">hours</span>
                  </div>
                  <div className="duration-input-group">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                      className="duration-input"
                    />
                    <span className="duration-label">minutes</span>
                  </div>
                </div>
                <div className="quick-duration-buttons">
                  {quickTimeOptions.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-duration-btn"
                      onClick={() => handleQuickTime(option.hours, option.minutes)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="form-section">
            <div className="section-header">
              <FaMapMarkerAlt className="section-icon" />
              <span className="section-title">Location</span>
            </div>
            <div className="form-group">
              <div className="input-with-icon">
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Add location or video call link"
                  className={`text-input ${validationErrors.location ? 'error' : ''}`}
                  maxLength={200}
                  aria-label="Event location"
                />
              </div>
              <div className="char-counter">
                {formData.location.length}/200
              </div>
              {validationErrors.location && (
                <div className="error-message">{validationErrors.location}</div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="form-section">
            <div className="section-header">
              <FaAlignLeft className="section-icon" />
              <span className="section-title">Description</span>
            </div>
            <div className="form-group">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add description, agenda, or notes"
                className={`description-input ${validationErrors.description ? 'error' : ''}`}
                rows="5"
                maxLength={1000}
                aria-label="Event description"
              />
              <div className="char-counter">
                {formData.description.length}/1000
              </div>
              {validationErrors.description && (
                <div className="error-message">{validationErrors.description}</div>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="form-section">
            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>{showAdvanced ? 'Hide' : 'Show'} advanced options</span>
              <FaTimes className={showAdvanced ? 'rotated' : ''} />
            </button>

            {showAdvanced && (
              <div className="advanced-options">
                {/* Color Section */}
                <div className="form-group">
                  <label className="section-label">
                    <FaPalette className="section-icon" />
                    Color
                  </label>
                  <div className="color-picker">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        title={color.name}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Recurring Section */}
                <div className="form-group">
                  <label className="section-label">
                    <FaRedo className="section-icon" />
                    Repeat
                  </label>
                  <select
                    name="recurring"
                    value={formData.recurring}
                    onChange={handleChange}
                    className="recurring-select"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDeleteClick}
              >
                <FaTrash /> Delete
              </button>
            )}
            <div className="action-buttons">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                {isEditing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <>
          <div 
            className="modal-overlay" 
            onClick={handleCancelDelete} 
            style={{ zIndex: 1002 }}
            aria-label="Close delete confirmation"
          ></div>
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="confirm-modal-content">
              <h3 id="delete-title">Delete Event</h3>
              <p>Are you sure you want to delete this event?</p>
              <div className="confirm-modal-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="confirm-delete-button" 
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EventModal;

