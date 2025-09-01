import { useEffect, useState } from "react";

function SpeakerTile() {

  useEffect(() => {
    
    window.location.href = "http://localhost:3002/api/spotify/auth"
    
  }, []);

  return (
    <>
      <div className="speaker-tile">
        <div className="speaker-title">Speaker</div>
      </div>
    </>
  );
}

export default SpeakerTile;
