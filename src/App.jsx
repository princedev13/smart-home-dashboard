import "./app.css";
import WeatherTile from "./weatherTile.jsx";
import NewsTile from "./newsTile.jsx";
import SpeakerTile from "./speakerTile.jsx";
import DateTime from "./dateTime";
import CalendarTile from "./calendarTile.jsx";
import TempSensor from "./tempSensor.jsx";

function App() {
  return (
    <>
      <div className="dashboard-wrapper">
        <WeatherTile />
        <NewsTile />
        <SpeakerTile />
        <DateTime />
        <CalendarTile />
        <TempSensor />
      </div>
    </>
  );
}

export default App;
