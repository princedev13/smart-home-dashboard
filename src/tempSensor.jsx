import { useEffect, useState } from "react";

function TempSensor() {
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    const fetchTempSensor = async () => {
      try {
        const res = await fetch("http://localhost:3002/api/tempsensor");
        const data = await res.json();
        setSensorData(data);
      } catch (err) {
        console.error("error fetching sensor data", err);
      }

    };

    //call temp sensor once immediately
    fetchTempSensor();

    //set up interval
    const interval = setInterval(fetchTempSensor, 120000);

    //clean up interval when component unmounts
    return () => clearInterval(interval);

  }, []);

  return (
    <>
      <div className="tempsensor">
        <div className="room-temp">Room Temperature</div>
      {sensorData ? (
        <div className="temp">{sensorData.temperature_f} F</div>
      ) : (
        <div className="temp">Loading...</div>
      )}

      </div>
    </>
  );
}

export default TempSensor;
