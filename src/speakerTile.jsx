import { useEffect, useState } from "react";
import * as React from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import ShuffleOnIcon from "@mui/icons-material/ShuffleOn";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import RepeatOneOnIcon from "@mui/icons-material/RepeatOneOn";
import PauseIcon from "@mui/icons-material/Pause";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";

function SpeakerTile() {
  const [spotifyConnected, setspotifyConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState();
  const [value, setValue] = React.useState(30);
  const [shuffle, setShuffle] = useState(true);

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

  function msToTime(ms) {
    if (!ms || ms < 0) return "0:00";

    let totalSeconds = Math.floor(ms / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  const maxTime = async (maxTimeMs) => {
    return msToTime(currentlyPlaying?.item?.duration_ms);
  };

  const getCurrentPlaying = async () => {
    try {
      console.log("Fetching current track...");
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
      console.log("Raw getCurrentTrack response:", data);

      if (!data || Object.keys(data).length === 0) {
        console.warn(
          "No currently playing data received - may need active device"
        );
        return;
      }

      setValue(data.progress_ms || 0);
      setCurrentlyPlaying(data);

      // Update shuffle state if available
      if (data.shuffle_state !== undefined) {
        setShuffle(data.shuffle_state);
      }

      console.log("Updated currently playing state:", data?.is_playing);
      console.log("Shuffle state:", data?.shuffle_state);
    } catch (error) {
      console.error("Error fetching currently playing", error);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const toggleShuffle = async () => {
    const state = !shuffle;

    try {
      const response = await fetch(
        `https://localhost:3002/api/spotify/toggleShuffle?state=${shuffle}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (shuffle) {
        setShuffle(false);
      } else {
        setShuffle(true);
      }
      console.log(shuffle);
    } catch (error) {
      console.error("Error toggling shuffle:", error);
    }
  };

  const pauseUnpause = async () => {
    try {
      const isCurrentlyPlaying = currentlyPlaying?.is_playing;
      const endpoint = isCurrentlyPlaying ? "pause" : "play";

      console.log(`Attempting to ${endpoint} playback...`);

      const response = await fetch(
        `https://localhost:3002/api/spotify/${endpoint}Playback`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error ${endpoint}ing playback:`, errorData);
        throw new Error(
          `Error ${endpoint}ing playback: ${response.status} - ${errorData}`
        );
      }

      const responseData = await response.json();

      // Wait a moment then refresh the current playing state
      setTimeout(() => {
        console.log("Refreshing currently playing data...");
        getCurrentPlaying();
      }, 1000); // Increased timeout to 1 second
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const skipToNext = async () => {
    try {
      const response = await fetch(
        "https://localhost:3002/api/spotify/skipToNext",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
      }

      setTimeout(() => {
        console.log("Refreshing currently playing data...");
        getCurrentPlaying();
      }, 1000); // Increased timeout to 1 second
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const skipToPrevious = async () => {
    try {
      const response = await fetch(
        "https://localhost:3002/api/spotify/skipToPrevious",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
      }

      setTimeout(() => {
        console.log("Refreshing currently playing data...");
        getCurrentPlaying();
      }, 1000); // Increased timeout to 1 second
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  //Use effects
  useEffect(() => {
    if (
      !spotifyConnected ||
      !currentlyPlaying ||
      currentlyPlaying?.is_playing === false
    )
      return;

    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev + 1000 >= currentlyPlaying.item.duration_ms) {
          return currentlyPlaying.item.duration_ms;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [spotifyConnected, currentlyPlaying]);

  useEffect(() => {
    checkSpotifyStatus();
    getCurrentPlaying();
    handleChange();

    // Check status periodically
    const spotifyStatusInterval = setInterval(checkSpotifyStatus, 30000); // Check every 30 seconds
    const getCurrentPlayingInterval = setInterval(getCurrentPlaying, 30000);

    return () => {
      clearInterval(spotifyStatusInterval);
      clearInterval(getCurrentPlayingInterval);
    };
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
          <img
            className="player-img"
            src={currentlyPlaying?.item?.album?.images?.[1]?.url}
          ></img>
          <div className="player-song-name">{currentlyPlaying?.item?.name}</div>
          <div className="player-song-artist">
            {currentlyPlaying?.item?.artists
              ?.map((artist) => artist.name)
              .join(", ")}
          </div>
          <div className="player">
            <button className="player-shuffle-button" onClick={toggleShuffle}>
              {currentlyPlaying?.shuffle_state ?? !shuffle ? (
                <ShuffleOnIcon sx={{ fontSize: 30, color: "green" }} />
              ) : (
                <ShuffleIcon sx={{ fontSize: 30, color: "black" }} />
              )}
            </button>
            <button className="player-prev-button" onClick={skipToPrevious}>
              <FastRewindIcon sx={{ fontSize: 30, color: "black" }} />
            </button>
            {currentlyPlaying?.is_playing ? (
              <button className="player-pause-button" onClick={pauseUnpause}>
                <PauseIcon sx={{ fontSize: 30, color: "black" }} />
              </button>
            ) : (
              <button className="player-pause-button" onClick={pauseUnpause}>
                <PlayArrowIcon sx={{ fontSize: 30, color: "black" }} />
              </button>
            )}
            <button className="player-forward-button" onClick={skipToNext}>
              <FastForwardIcon sx={{ fontSize: 30, color: "black" }} />
            </button>
            <button className="player-repeat-button">
              <RepeatIcon sx={{ fontSize: 30, color: "black" }} />
            </button>
            <div className="player-elapsed-time">{msToTime(value)}</div>
            <div className="player-remaining-time">
              {msToTime((currentlyPlaying?.item?.duration_ms ?? 0) - value)}
            </div>
          </div>
          <button className="player-time">
            <Box sx={{ width: 220 }}>
              <Stack
                spacing={2}
                direction="row"
                sx={{ alignItems: "center", mb: 1 }}
              >
                <Slider
                  aria-label="medium"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => msToTime(value)}
                  value={value ?? 0}
                  max={currentlyPlaying?.item?.duration_ms ?? 100}
                  onChange={handleChange}
                />
              </Stack>
            </Box>
          </button>
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
