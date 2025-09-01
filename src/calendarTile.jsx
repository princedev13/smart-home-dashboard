import { useEffect, useState } from "react";

function CalendarTile() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDaysArr = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  useEffect(() => {
    fetch("http://localhost:3002/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setEvents(data);
      })
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // 🔹 Find events for the currently selected day
  const todaysEvents = events.filter((event) => {
    if (event.start.date) {
      const [year, month, day] = event.start.date.split("-").map(Number);
      return (
        year === selectedDate.getFullYear() &&
        month - 1 === selectedDate.getMonth() &&
        day === selectedDate.getDate()
      );
    } else {
      const eventDateObj = new Date(event.start.dateTime);
      return (
        eventDateObj.getFullYear() === selectedDate.getFullYear() &&
        eventDateObj.getMonth() === selectedDate.getMonth() &&
        eventDateObj.getDate() === selectedDate.getDate()
      );
    }
  });

  // 🔹 Find the next upcoming event after the selected day
  const upcomingEvent = events
    .map((event) => {
      const eventDate = event.start.date || event.start.dateTime;
      return { ...event, dateObj: new Date(eventDate) };
    })
    .filter((event) => event.dateObj > selectedDate)
    .sort((a, b) => a.dateObj - b.dateObj)[0];

  return (
    <div className="calendar-tile">
      <div className="calendar-weekdays">
        {weekDates.map((date) => {
          const hasEvent = events.some((event) => {
            if (event.start.date) {
              const [year, month, day] = event.start.date
                .split("-")
                .map(Number);
              return (
                year === date.getFullYear() &&
                month - 1 === date.getMonth() &&
                day === date.getDate()
              );
            } else {
              const eventDateObj = new Date(event.start.dateTime);
              return (
                eventDateObj.getFullYear() === date.getFullYear() &&
                eventDateObj.getMonth() === date.getMonth() &&
                eventDateObj.getDate() === date.getDate()
              );
            }
          });

          const isSelected =
            date.toDateString() === selectedDate.toDateString();

          return (
            <div
              className={`day ${isSelected ? "selected" : ""}`}
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
            >
              {hasEvent && <div className="event-notice"></div>}
              <div className="day-name">{weekDaysArr[date.getDay()]}</div>
              <div className="day-number">{date.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div className="calendar-events-box">
        <div className="calendar-date">{selectedDate.toDateString()}</div>

        <div className="calendar-todays-events">
          {todaysEvents.length > 0 ? (
            todaysEvents.map((event, i) => (
              <div className="todays-event" key={i}>
                <div className="todays-event-title">{event.summary}</div>
                <div className="todays-event-time">
                  {event.start.dateTime
                    ? new Date(event.start.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "All day"}
                </div>
              </div>
            ))
          ) : (
            <div className="selected-no-events">No events</div>
          )}
        </div>

        <div className="calendar-upcoming-events">
          <div className="calendar-upcoming-events-text">Upcoming Events</div>
          {upcomingEvent ? (
            <div className="upcoming-event">
              <div className="upcoming-event-title">
                {upcomingEvent.summary}
              </div>
              <div className="upcoming-event-time">
                {upcomingEvent.dateObj.toLocaleDateString()}{" "}
                {upcomingEvent.start.dateTime
                  ? upcomingEvent.dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "All day"}
              </div>
            </div>
          ) : (
            <div className="upcoming-no-events">No upcoming events</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarTile;
