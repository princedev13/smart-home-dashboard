import { useEffect, useState } from "react";

function SpeakerTile() {

  const [player, setplayer] = useState(null);

  useEffect(() => {

    const fetchPlayer = async () => {

      try {

        const response = await fetch("http://localhost:3002/api/spotify/current_track")
        const data = await response.json();
        setplayer(data);
        console.log(data);

      } catch (err) {
        console.error("error fetching player", err)
      }

    }
  
    fetchPlayer()

  }, [])


  return (
    <>
      <div className="speaker-tile">
        <div className="speaker-title">Speaker</div>
      </div>
    </>
  );


}

export default SpeakerTile;
