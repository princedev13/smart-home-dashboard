import { useEffect, useState } from "react";

function SpeakerTile() {
  const [spotifyConnected, setspotifyConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState();

  const checkSpotifyStatus = async () => {
    try {
      const response = await fetch(
        "https://localhost:3002/api/spotify/status",
        {
          method: "GET",
          credentials: "include", // This is crucial for sending cookies
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Spotify status response:", data);

      setspotifyConnected(data.authenticated || false);
    } catch (err) {
      console.error("Error checking Spotify status:", err);
      setspotifyConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlaying = async () => {
    try {
      const response = await fetch(
        "https://localhost:3002/api/spotify/getCurrentTrack",
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching currently playing ${response.status}`);
      }

      const data = await response.json();
      setCurrentlyPlaying(data);
      console.log("Currently playing data:", data);
    } catch (error) {
      console.log("Error fetching currently playing", error);
    }
  };

  useEffect(() => {
    checkSpotifyStatus();
    getCurrentPlaying();

    // Optional: Check status periodically
    const interval = setInterval(checkSpotifyStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle the Spotify auth redirect
  const handleSpotifyConnect = () => {
    // Navigate to the auth endpoint on the same server
    window.location.href = "https://localhost:3002/api/spotify/auth";
  };

  if (loading) {
    return (
      <div className="speaker-tile">
        <div className="speaker-title">Speaker</div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="speaker-tile">
      <div className="speaker-title">Speaker</div>
      {!spotifyConnected ? (
        <button
          className="connect-spotify-button"
          onClick={handleSpotifyConnect}
          type="button"
        >
          Connect Spotify
        </button>
      ) : (
        <div className="spotify-status">
          <div>✅ Spotify Connected</div>
          <button
            onClick={checkSpotifyStatus}
            style={{ marginTop: "10px", fontSize: "12px" }}
          >
            Refresh Status
          </button>
        </div>
      )}

      {spotifyConnected ? (  
        <div className="spotify-player">
          <div className="player-song-name">{currentlyPlaying.item.name}</div>
          <div className="player-song-name"></div>
          <button className="player-prev-button"></button>
          <button className="player-pause-button"></button>
          <button className="player-forward-button"></button>
          <button className="player-time"></button>
        </div>
        ) : (
                  <div className="spotify-player">
          <div className="player-song-name"></div>
          <button className="player-prev-button"></button>
        </div>
        )}
    </div>
  );
}

export default SpeakerTile;
