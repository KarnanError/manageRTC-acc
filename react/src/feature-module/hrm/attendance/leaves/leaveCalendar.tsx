import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../../core/common/collapse-header/collapse-header";
import CommonSelect from "../../../../core/common/commonSelect";
import Footer from "../../../../core/common/footer";
import { useAuth } from "../../../../hooks/useAuth";
import { useLeaveREST, type Leave } from "../../../../hooks/useLeaveREST";
import { all_routes } from "../../../router/all_routes";

// Extend dayjs with plugins
dayjs.extend(isBetween);

interface LeaveEvent {
  leave: Leave;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const LeaveCalendar = () => {
  const { leaves, loading, fetchLeaves, fetchMyLeaves, leaveTypeDisplayMap } = useLeaveREST();
  const { role, userId } = useAuth();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch leaves on mount
  useEffect(() => {
    // Fetch based on role - managers see team leaves, employees see their own
    if (role === 'manager' || role === 'hr' || role === 'admin' || role === 'superadmin') {
      fetchLeaves({ limit: 1000 });
    } else {
      fetchMyLeaves({ limit: 1000 });
    }
  }, []);

  // Leave type colors
  const getLeaveTypeColor = (leaveType: string): { bg: string; border: string; text: string } => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      sick: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },          // Blue
      casual: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },      // Purple
      earned: { bg: '#e8f5e9', border: '#4caf50', text: '#388e3c' },      // Green
      maternity: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },  // Pink
      paternity: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },   // Light Blue
      bereavement: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' }, // Orange
      compensatory: { bg: '#fff8e1', border: '#ffc107', text: '#f57c00' }, // Amber
      unpaid: { bg: '#ffebee', border: '#f44336', text: '#c62828' },     // Red
      special: { bg: '#f3e5f5', border: '#673ab7', text: '#512da8' },     // Indigo
    };
    return colors[leaveType] || { bg: '#f5f5f5', border: '#999', text: '#333' };
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    if (status === 'approved') return '✓';
    if (status === 'rejected') return '✗';
    if (status === 'pending') return '?';
    if (status === 'cancelled') return '○';
    if (status === 'on-hold') return '!';
    return '?';
  };

  // Get calendar days for the current month view
  const getCalendarDays = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');

    // Get days from previous month to fill first week
    const startDayOfWeek = startOfMonth.day(); // 0 = Sunday
    const calendarStart = startOfMonth.subtract(startDayOfWeek, 'day');

    // Get all days to display
    const days: Date[] = [];
    let current = calendarStart;

    // Add 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(current.toDate());
      current = current.add(1, 'day');
    }

    return days;
  };

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date): LeaveEvent[] => {
    const dateStart = dayjs(date).startOf('day');
    const dateEnd = dayjs(date).endOf('day');

    return leaves
      .filter(leave => {
        // Filter by type if selected
        if (filterType !== 'all' && leave.leaveType !== filterType) return false;
        // Filter by status if selected
        if (filterStatus !== 'all' && leave.status !== filterStatus) return false;

        // Check if leave overlaps with this date
        const leaveStart = dayjs(leave.startDate);
        const leaveEnd = dayjs(leave.endDate);

        return dateStart.isSame(leaveEnd, 'day') ||
               dateStart.isBefore(leaveEnd) && dateEnd.isAfter(leaveStart) ||
               dateStart.isAfter(leaveStart) && dateStart.isBefore(leaveEnd);
      })
      .map(leave => {
        const colors = getLeaveTypeColor(leave.leaveType);
        return {
          leave,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
        };
      });
  };

  // Get leave summary for a date
  const getDateSummary = (date: Date): { count: number; types: string[] } => {
    const events = getLeavesForDate(date);
    const uniqueTypes = [...new Set(events.map(e => e.leave.leaveType))];

    return {
      count: events.length,
      types: uniqueTypes.map(t => leaveTypeDisplayMap[t] || t)
    };
  };

  // Navigate between months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return prev.subtract(1, 'month');
      } else {
        return prev.add(1, 'month');
      }
    });
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs());
  };

  const calendarDays = getCalendarDays();
  const currentMonthStart = currentDate.startOf('month');

  // Filter options
  const leaveTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'sick', label: 'Medical Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'earned', label: 'Annual Leave' },
    { value: 'maternity', label: 'Maternity' },
    { value: 'paternity', label: 'Paternity' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Leave Calendar</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">HRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Leave Calendar
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-3">
                <CommonSelect
                  className="select"
                  options={leaveTypeOptions}
                  onChange={(option) => setFilterType(option.value)}
                />
              </div>
              <div className="me-3">
                <CommonSelect
                  className="select"
                  options={statusOptions}
                  onChange={(option) => setFilterStatus(option.value)}
                />
              </div>
              <button
                className="btn btn-white me-2"
                onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
              >
                <i className={`ti ${viewMode === 'month' ? 'ti-calendar' : 'ti-list'} me-1`} />
                {viewMode === 'month' ? 'Month View' : 'Week View'}
              </button>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          {/* Calendar Header */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-white me-2"
                    onClick={() => navigateMonth('prev')}
                  >
                    <i className="ti ti-chevron-left" />
                  </button>
                  <h4 className="mb-0 me-3">
                    {currentDate.format('MMMM YYYY')}
                  </h4>
                  <button
                    className="btn btn-white me-2"
                    onClick={() => navigateMonth('next')}
                  >
                    <i className="ti ti-chevron-right" />
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={goToToday}
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Month Calendar */}
          {viewMode === 'month' ? (
            <div className="card">
              <div className="card-body p-0">
                {/* Weekday Headers */}
                <div className="calendar-header">
                  <div className="weekday">Sun</div>
                  <div className="weekday">Mon</div>
                  <div className="weekday">Tue</div>
                  <div className="weekday">Wed</div>
                  <div className="weekday">Thu</div>
                  <div className="weekday">Fri</div>
                  <div className="weekday">Sat</div>
                </div>

                {/* Calendar Grid */}
                <div className="calendar-grid">
                  {calendarDays.map((date, index) => {
                    const dateObj = dayjs(date);
                    const isCurrentMonth = dateObj.isSame(currentDate, 'month');
                    const isToday = dateObj.isSame(dayjs(), 'day');
                    const isSelected = dateObj.isSame(selectedDate, 'day');
                    const isWeekend = dateObj.day() === 0 || dateObj.day() === 6;

                    const events = getLeavesForDate(date);
                    const summary = getDateSummary(date);

                    return (
                      <div
                        key={index}
                        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isWeekend ? 'weekend' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => setSelectedDate(dateObj)}
                      >
                        <div className="date-number">
                          {dateObj.format('D')}
                        </div>

                        {/* Events/Summary */}
                        {summary.count > 0 && (
                          <div className="day-summary">
                            <div className="summary-badge">
                              {summary.count} leave{summary.count > 1 ? 's' : ''}
                            </div>
                            {summary.types.slice(0, 2).map((type, idx) => (
                              <div key={idx} className="event-type-chip">
                                {type.substring(0, 8)}...
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Event dots */}
                        <div className="event-dots">
                          {events.slice(0, 4).map((event, idx) => (
                            <div
                              key={idx}
                              className="event-dot"
                              title={`${leaveTypeDisplayMap[event.leave.leaveType] || event.leave.leaveType} - ${event.leave.status}`}
                              style={{
                                backgroundColor: event.backgroundColor,
                                borderColor: event.borderColor,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="calendar-footer p-3 border-top">
                  <div className="d-flex flex-wrap gap-3">
                    {Object.keys(leaveTypeDisplayMap).map((type) => {
                      const colors = getLeaveTypeColor(type);
                      return (
                        <div key={type} className="legend-item">
                          <div
                            className="legend-dot"
                            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                          />
                          <span className="legend-text">{leaveTypeDisplayMap[type] || type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Week View */
            <div className="card">
              <div className="card-body p-0">
                <div className="week-view">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = currentDate.startOf('week').add(i, 'day');
                    const isToday = date.isSame(dayjs(), 'day');
                    const events = getLeavesForDate(date.toDate());

                    return (
                      <div
                        key={i}
                        className={`week-day-column ${isToday ? 'today' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="week-day-header">
                          <div className="day-name">{date.format('ddd')}</div>
                          <div className="day-number">{date.format('D')}</div>
                        </div>
                        <div className="week-day-content">
                          {events.map((event) => (
                            <div
                              key={event.leave._id}
                              className="week-event"
                              style={{
                                backgroundColor: event.backgroundColor,
                                borderColor: event.borderColor,
                                color: event.textColor,
                              }}
                            >
                              <div className="event-type">
                                {leaveTypeDisplayMap[event.leave.leaveType]?.substring(0, 15) || event.leave.leaveType}
                              </div>
                              <div className="event-details">
                                <div className="event-employee">
                                  {event.leave.employeeName || 'Employee'}
                                </div>
                                <div className="event-status">
                                  {getStatusStyle(event.leave.status)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="card mt-3">
              <div className="card-header">
                <h5 className="mb-0">
                  {selectedDate.format('dddd, MMMM D, YYYY')}
                  {selectedDate.isSame(dayjs(), 'day') && ' (Today)'}
                </h5>
              </div>
              <div className="card-body">
                {(() => {
                  const events = getLeavesForDate(selectedDate.toDate());

                  if (events.length === 0) {
                    return (
                      <p className="text-muted text-center mb-0">
                        No leaves scheduled for this date
                      </p>
                    );
                  }

                  return (
                    <div className="row">
                      {events.map((event) => (
                        <div key={event.leave._id} className="col-md-6 mb-3">
                          <div
                            className="card border"
                            style={{
                              borderLeft: `4px solid ${event.borderColor}`,
                              backgroundColor: event.backgroundColor,
                            }}
                          >
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-1">
                                    {leaveTypeDisplayMap[event.leave.leaveType] || event.leave.leaveType}
                                  </h6>
                                  <p className="mb-0">
                                    <strong>{event.leave.employeeName || 'Employee'}</strong>
                                  </p>
                                </div>
                                <span className={`badge ${
                                  event.leave.status === 'approved' ? 'bg-success' :
                                  event.leave.status === 'rejected' ? 'bg-danger' :
                                  event.leave.status === 'pending' ? 'bg-warning' :
                                  'bg-secondary'
                                }`}>
                                  {event.leave.status.charAt(0).toUpperCase() + event.leave.status.slice(1)}
                                </span>
                              </div>
                              <div className="mb-2">
                                <small className="text-muted">
                                  <i className="ti ti-calendar me-1" />
                                  {dayjs(event.leave.startDate).format('DD MMM YYYY')} - {dayjs(event.leave.endDate).format('DD MMM YYYY')}
                                  ({event.leave.duration} day{event.leave.duration > 1 ? 's' : ''})
                                </small>
                              </div>
                              {event.leave.reason && (
                                <div className="text-muted small">
                                  <i>"{event.leave.reason}"</i>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <style>{`
        .calendar-header {
          display: flex;
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
        }

        .weekday {
          flex: 1;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          color: #495057;
          border-right: 1px solid #dee2e6;
        }

        .weekday:last-child {
          border-right: none;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid #dee2e6;
          border-top: none;
        }

        .calendar-day {
          min-height: 100px;
          padding: 8px;
          border-right: 1px solid #dee2e6;
          border-bottom: 1px solid #dee2e6;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .calendar-day:hover {
          background-color: #f8f9fa;
        }

        .calendar-day.other-month {
          background-color: #fafafa;
          color: #adb5bd;
        }

        .calendar-day.weekend {
          background-color: #fafafa;
        }

        .calendar-day.selected {
          background-color: #e3f2fd !important;
          border: 2px solid #2196f3 !important;
        }

        .calendar-day.today {
          background-color: #fff8e1 !important;
        }

        .date-number {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .day-summary {
          margin-top: 4px;
        }

        .summary-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          background-color: #6c757d;
          color: white;
          text-align: center;
          margin-bottom: 4px;
        }

        .event-type-chip {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 4px;
          background-color: #495057;
          color: white;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-dots {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }

        .event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid;
        }

        .calendar-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          font-size: 12px;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 6px;
        }

        .week-view {
          display: flex;
          min-height: 500px;
          border: 1px solid #dee2e6;
        }

        .week-day-column {
          flex: 1;
          border-right: 1px solid #dee2e6;
          min-height: 400px;
          cursor: pointer;
        }

        .week-day-column:last-child {
          border-right: none;
        }

        .week-day-column.today {
          background-color: #fff8e1;
        }

        .week-day-header {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }

        .day-name {
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .day-number {
          font-size: 18px;
          color: #495057;
        }

        .week-day-content {
          padding: 8px;
        }

        .week-event {
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .week-event:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .event-type {
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: capitalize;
        }

        .event-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .event-employee {
          font-size: 10px;
          opacity: 0.9;
        }

        .event-status {
          font-size: 14px;
          font-weight: bold;
        }
      `}</style>
    </>
  );
};

export default LeaveCalendar;
