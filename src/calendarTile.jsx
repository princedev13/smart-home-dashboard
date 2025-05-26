import { useEffect, useState } from "react";

function CalendarTile() {
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState("");
  const [weekDates, setWeekDates] = useState({});
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

    const processEvents = (events, forDate = new Date()) => {
    const todaysList = [];
    let upcoming = null;

    for (const event of events) {
      const rawDate = event.start.date || event.start.dateTime;
      const eventDate = new Date(rawDate);

      const isSameDay =
        eventDate.getFullYear() === forDate.getFullYear() &&
        eventDate.getMonth() === forDate.getMonth() &&
        eventDate.getDate() === forDate.getDate();

      if (isSameDay && todaysList.length < 4) {
        todaysList.push({
          desc: event.summary,
          time: rawDate.includes("T") ? rawDate.substring(11, 16) : "All Day",
        });
      } else if (eventDate > forDate && !upcoming) {
        upcoming = {
          desc: event.summary,
          time: rawDate.includes("T") ? rawDate.substring(11, 16) : "All Day",
          date: eventDate.toDateString(),
        };
      }
    }

    setTodaysEvents(todaysList);
    setUpcomingEvents(upcoming);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:3002/api/calendar");
        const data = await res.json();
        console.log(data);
        setEvents(data);
        processEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };

    const updateDate = () => {
      const now = new Date().toLocaleDateString([], {
        timeZone: "America/New_York",
        calendar: "gregory",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setDate(now);
    };

    const buildWeekDates = () => {
      const today = new Date();
      const currentDayIndex = today.getDay();
      const startOfWeek = new Date(today);
      const newWeekDates = {};

      startOfWeek.setDate(today.getDate() - currentDayIndex); // go back to sunday

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        const iso = d.toLocaleDateString("en-ca").split("T")[0];
        newWeekDates[dayName] = iso;
      }

      setWeekDates(newWeekDates);
    };

    fetchEvents();
    buildWeekDates();
    updateDate();
  }, []);

  useEffect(() => {

    if (selectedDate) {
      processEvents(events, new Date(selectedDate))
    }
    
  }, [selectedDate])

  return (
    <>
      <div className="calendar-tile">
        <div className="calendar-date">{selectedDate}</div>
        <div className="calendar-weekday-box">
          {Object.entries(weekDates).map(([dayName, iso], i) => {
            const hasEvent = events.some((event) => {
              const rawDate = event.start.date || event.start.dateTime;
              const eventDate = new Date(rawDate);
              const eventDay = eventDate.toISOString().split("T")[0];

              return eventDay === iso;
            });

            return (
              <div key={i} onClick={() => setSelectedDate(iso)} className={`calendar-weekday-${dayName.trim().slice(0, 3)}`}>
                <div className="calendar-weekday-title">
                  {dayName.slice(0, 3)}
                </div>
                { selectedDate === iso ? (
                  <div className="highlight-day" >
                    <div className="calendar-weekday-date">{iso.slice(8, 10)}</div>
                  </div>
                  ) : (
                  <div className="calendar-weekday-date">{iso.slice(8, 10)}</div>
                  )
                }
                {hasEvent && <div className="calendar-weekday-notice"></div>}
              </div>
            );
          })}
        </div>

        <div className="calendar-today">
          {todaysEvents.length > 0 ? (
            todaysEvents.map((event, i) => (
              <div key={i} className="calendar-today-event">
                <div className="calendar-event-title">{event.desc}</div>
                <div className="calendar-event-time">{event.time}</div>
              </div>
            ))
          ) : (
            <div className="calendar-today-no-events">Nothing Planned</div>
          )}
        </div>

          {todaysEvents.length < 2 && upcomingEvents ? (

            <>
              <div className="calendar-upcoming-events"></div>
              <div className="calendar-upcoming-text">Upcoming</div>
              <div className="calendar-event-title">{upcomingEvents.desc}</div>
              <div className="calendar-event-time">{upcomingEvents.date}</div>
            </>
          ) : (
            null
            )}
        </div>
    </>
  );
}

export default CalendarTile;
