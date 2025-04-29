import { useEffect, useState } from 'react';
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_SECRET;

function WeatherTile () {
    const [weatherData, setWeatherData] = useState(null);

    useEffect(() => {
        
            fetch('http://api.weatherapi.com/v1/current.json?key=' + WEATHER_API_KEY + '&q=Orlando')
                .then(response => response.json())
                .then(data => {
                    setWeatherData(data)
                })
                .catch(error => {
                    console.error('error fetching data', error);
                }, []);
    })

    return (

        <div>

            {weatherData ? (
                
                <div class="weather-tile-container">
                    <div class="weather-tile">
                        <h2 class="weather-tile-title">Temperature</h2>
                        <h4 class="weather-tile-icon"><img src={weatherData.current.condition.icon}/></h4>
                        <h4 class="weather-tile-temp">{weatherData.current.temp_f}°F</h4>
                    </div>
                </div>

            ): (
                
                <p>Loading...</p>
            
            )}

        </div>

    );

}

export default WeatherTile