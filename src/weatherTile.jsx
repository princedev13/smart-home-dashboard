import { useEffect, useState } from "react";

function WeatherTile() {
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    fetch("https://localhost:3002/api/weather")
      .then((response) => response.json())
      .then((data) => {
        setWeatherData(data);
      })
      .catch((error) => {
        console.error("error fetching weather data", error);
      });
  }, []);

  return (
    <div>
      {weatherData ? (
        <div className="weather-tile">
          <h2 className="weather-tile-title">Weather</h2>
          <h4 className="weather-tile-icon">
            <img src={weatherData.current.condition.icon} />
          </h4>
          <h4 className="weather-tile-temp">{weatherData.current.temp_f}°F</h4>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default WeatherTile;
