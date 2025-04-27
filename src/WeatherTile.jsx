import { useEffect, useState } from 'react';
const WEATHER_API_KEY = import.meta.env.WEATHER_API_SECRET;

function WeatherTile () {
    const [data, setData] = useState(null);

    function getWeather () {
        useEffect(() => {
        fetch('http://api.weatherapi.com/v1/current.json?key=WEATHER_API_KEY&q=Orlando')
            .then(data => {
                console.log(data)
            })
            .catch(error => {
                console.error('error fetching data', error);
            });
        })

    }

    return (

        <>
        
            <div class="weather-tile">
                <h2>Temperature</h2>
                <h2>icon</h2>
                <h4>temp</h4>
            </div>
        
        </>

    );

}

export default WeatherTile