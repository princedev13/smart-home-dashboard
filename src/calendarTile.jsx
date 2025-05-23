import { useEffect, useState } from "react";

function CalendarTile() {
  const [events, setEvents] = useState("");
  const [date, setDate] = useState("");
  const [weekDates, setWeekDates] = useState({});

  useEffect(() => {
    fetch("http://localhost:3002/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setEvents(data);
      })
      .catch((err) => console.error("Error fetching events:", err));

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

    const today = new Date();
    const currentDayIndex = today.getDay()
    const startOfWeek = new Date(today);
    const newWeekDates = {};

    startOfWeek.setDate(today.getDate() - currentDayIndex) // go back to sunday

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dayName = d.toLocaleDateString("en-US", {weekday: "long"});
      const dayNum = d.getDate();
      newWeekDates[dayName] = dayNum; 
    }

    setWeekDates(newWeekDates);
    updateDate();
  }, []);




  return (
    <>
      <div className="calendar-tile">
        <div className="calendar-date">{date}</div>
        <div className="calendar-weekday-box">
          <div className="calendar-weekday-sun">
            <div className="calendar-weekday-title">Sun</div>
            <div className="calendar-weekday-date">{weekDates["Sunday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-mon">
            <div className="calendar-weekday-title">Mon</div>
            <div className="calendar-weekday-date">{weekDates["Monday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-tue">
            <div className="calendar-weekday-title">Tue</div>
            <div className="calendar-weekday-date">{weekDates["Tuesday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-wed">
            <div className="calendar-weekday-title">Wed</div>
            <div className="calendar-weekday-date">{weekDates["Wednesday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-thu">
            <div className="calendar-weekday-title">Thu</div>
            <div className="calendar-weekday-date">{weekDates["Thursday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-fri">
            <div className="calendar-weekday-title">Fri</div>
            <div className="calendar-weekday-date">{weekDates["Friday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
          <div className="calendar-weekday-sat">
            <div className="calendar-weekday-title">Sat</div>
            <div className="calendar-weekday-date">{weekDates["Saturday"]}</div>
            <div className="calendar-weekday-notice"></div>
          </div>
        </div>

        <div className="calendar-today">
          <div className="calendar-today-event">
            <div className="calendar-event-title">test event</div>
            <div className="calendar-event-time">9:00am</div>
          </div>

          <div className="calendar-today-event">
            <div className="calendar-event-title">test event</div>
            <div className="calendar-event-time">4:30pm - 12:00am</div>
          </div>
        </div>

        <div className="calendar-upcoming-text">Upcoming</div>
        <div className="calendar-upcoming-events">
          <div className="calendar-event-title">test event</div>
          <div className="calendar-event-time">10:00 - 2:00</div>
        </div>
      </div>
    </>
  );

}

export default CalendarTile;
