import { useEffect, useState } from "react";

function DateTime() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date().toLocaleTimeString([], {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTime(now);
    };

    const updateDate = () => {
      const now = new Date().toLocaleDateString([], {
        timeZone: "America/New_York",
        calendar: "gregory",
        month: "long",
        day: "numeric",
        year: "2-digit",
      });
      setDate(now);
    };

    updateDate();
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="date-time-tile">
        <h1 className="time">{time}</h1>
        <h2 className="date">{date}</h2>
      </div>
    </>
  );
}

export default DateTime;
