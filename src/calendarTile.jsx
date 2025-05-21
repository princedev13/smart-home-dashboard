import { useEffect, useState } from "react";

function CalendarTile() {
  const [events, setEvents] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/calendar")
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
        <div className="date"></div>
        <div className="calendar-box"></div>
      </div>
    </>
  );
}

export default CalendarTile;
