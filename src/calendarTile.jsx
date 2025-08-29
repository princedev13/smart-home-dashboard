import { useEffect, useState } from "react";

function CalendarTile() {
  const [events, setEvents] = useState("");

  useEffect(() => {

    fetch("http://localhost:3002/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setEvents(data);
      })
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

  return (
    <>


      <div className="calendar-tile">
        <div className="calendar-weekdays">
          <div className="day">
            <div className="day-name">sun</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">mon</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">tue</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">wed</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">thu</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">fri</div>
            <div className="day-number">28</div>
          </div>
          <div className="day">
            <div className="day-name">sat</div>
            <div className="day-number">28</div>
          </div>
        </div>
        <div className="calendar-events-box">
          <div className="calendar-date">Today - 8/29</div>
          <div className="calendar-todays-events">
            <div className="todays-event">event 1</div>
            <div className="todays-event">event 2</div>
          </div>

          <div className="calendar-upcoming-events">
            <div className="calendar-upcoming-events-text">Upcoming Events</div>
            <div className="upcoming-event">events 1</div>
          </div>
        </div>
      </div>

      
    </>
  );
}

export default CalendarTile;
