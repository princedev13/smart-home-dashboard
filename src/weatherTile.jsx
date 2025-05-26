import { useEffect, useState } from "react";

function WeatherTile() {
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("http://localhost:3002/api/weather");
        const data = await res.json();
        setWeatherData(data);
      } catch (error) {
        console.error("error fetching weather data", error);
      }
    };

    fetchWeather();
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
        <div className="weather-tile">
          <p>error</p>
        </div>
      )}
    </div>
  );
}

export default WeatherTile;
