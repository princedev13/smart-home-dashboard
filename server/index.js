require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const process = require("process");
const { google } = require("googleapis");
const crypto = require("crypto");
const https = require("https");
const { error } = require("console");
const WEATHER_API_KEY = process.env.WEATHER_API_SECRET;
const NEWS_API_KEY = process.env.NEWS_API_SECRET;
const SPOTIFY_API_SECRET = process.env.SPOTIFY_API_SECRET;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "https://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Session ID: ${req.sessionID}`);
  next();
});

const options = {
  key: fs.readFileSync(path.join(__dirname, "../certs/Server.key")),
  cert: fs.readFileSync(path.join(__dirname, "../certs/Server.cert")),
};

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

const spotifyScope =
  "user-read-private user-read-email user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-playback-position user-read-recently-played";

https.createServer(options, app).listen(3002, () => {
  console.log("Server listening on port 3002");
});

//gets path of token and credentials
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function getOAuthKeys() {
  const content = await fsp.readFile(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  return credentials.web;
}

//reads previously authorized credentials from save file
async function loadSavedCredentialsIfExist() {
  try {
    const tokenContent = await fsp.readFile(TOKEN_PATH);
    const savedCredentials = JSON.parse(tokenContent);

    if (!savedCredentials.refresh_token) {
      console.error("token.json missing refresh_token");
      return null;
    }

    const keys = await getOAuthKeys();

    const client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );

    client.setCredentials({
      refresh_token: savedCredentials.refresh_token,
      access_token: savedCredentials.access_token,
    });

    return client;
  } catch (error) {
    console.error("Error reading token.json:", error);
    return null;
  }
}

//translates credentials in a way thats compatible w/ GoogleAuth.fromJSON
async function saveCredentials(client, tokens) {
  const keys = await getOAuthKeys();

  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: keys.client_id,
    client_secret: keys.client_secret,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
  });
  await fsp.writeFile(TOKEN_PATH, payload);
}

app.get("/api/auth", async (req, res) => {
  const keys = await getOAuthKeys();

  let client = await loadSavedCredentialsIfExist();
  if (!client) {
    client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );
  }

  //Generate URL
  const authorizationUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    redirect_uri: keys.redirect_uris[0],
    include_granted_scopes: true,
  });

  res.redirect(authorizationUrl);
});

// Recieve callback from google oauth2 server
app.get("/api/oauth2callback", async (req, res) => {
  const keys = await getOAuthKeys();

  let client = await loadSavedCredentialsIfExist();
  if (!client) {
    client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );
  }

  const code = req.query.code;
  if (!code) return res.status(400).send("Missing authorization code");

  const error = req.query.error;

  if (error) {
    console.log("Error:" + error);
  } else {
    //Get access and refresh tokens

    let { tokens } = await client.getToken({
      code,
      redirect_uri: keys.redirect_uris[0],
    });

    client.setCredentials(tokens);
    await saveCredentials(client, tokens);

    res.send("Authorization successful. Close Window");
  }
});

// Gets 7 days of events from calendar

async function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: 15,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  } else {
    return res.data.items || [];
  }
}

app.get("/api/calendar", async (req, res) => {
  const client = await loadSavedCredentialsIfExist();
  if (!client) {
    return res.status(401).json({
      error: "Not authenticated",
      authUrl: "https://localhost:3002/api/auth",
    });
  }

  try {
    const events = await listEvents(client);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events", error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: "Authentication expired or invalid",
        authUrl: "https://localhost:3002/api/auth",
      });
    }

    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/weather", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.weatherapi.com/v1/current.json?key=" +
        WEATHER_API_KEY +
        "&q=Orlando"
    );
    const responseJson = await response.json();
    res.json(responseJson);
  } catch (err) {
    console.error("Error fetching weather data", err);
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.thenewsapi.com/v1/news/top?" +
        NEWS_API_KEY +
        "&locale=us&limit=3"
    );
    const responseJson = await response.json();
    res.json(responseJson);
  } catch (err) {
    console.error("Error fetching news data", err);
  }
});

app.get("/api/tempsensor", async (req, res) => {
  try {
    const response = await fetch("https://192.168.1.24:5000/api/tempsensor");
    const responseJson = await response.json();
    res.json(responseJson);
  } catch (err) {
    console.error("Error fetching temp sensor data", err);
  }
});

app.get("/api/spotify/auth", async (req, res) => {
  console.log("Starting Spotify auth - Session ID:", req.sessionID);

  const state = crypto.randomBytes(16).toString("hex");
  req.session.state = state;

  // Force session save before redirect
  req.session.save((err) => {
    if (err) {
      console.error("Session save error:", err);
      return res.status(500).json({ error: "Session error" });
    }

    console.log("State saved to session:", state);
    console.log("Session after save:", req.session);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: spotifyScope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state,
    });

    res.redirect("https://accounts.spotify.com/authorize?" + params.toString());
  });
});

app.get("/api/spotify/callback", async (req, res) => {
  console.log("Spotify callback - Session ID:", req.sessionID);
  console.log("Session data:", req.session);

  const code = req.query.code || null;
  const state = req.query.state || null;

  console.log("Received state:", state);
  console.log("Session state:", req.session.state);

  if (!req.session.state) {
    console.error("No state in session");
    return res.status(400).send("Session error - no state found");
  }

  if (state !== req.session.state) {
    console.error("State mismatch");
    const params = new URLSearchParams({
      error: "state_mismatch",
    });
    return res.redirect("https://localhost:5173/#" + params.toString());
  }

  // Clear the state after validation
  delete req.session.state;

  const paramsBody = new URLSearchParams({
    code: code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_API_SECRET).toString(
            "base64"
          ),
      },
      body: paramsBody.toString(),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Spotify token error:", data);
      return res
        .status(400)
        .json({ error: data.error_description || data.error });
    }

    req.session.spotifyAuth = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: Date.now() + data.expires_in * 1000,
    };

    // Force session save before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Session save error" });
      }

      console.log("Spotify token stored successfully");
      console.log("Session ID after save:", req.sessionID);
      console.log("Session data after save:", req.session.spotifyAuth);

      res.redirect("https://localhost:5173");
    });
  } catch (error) {
    console.error("Error fetching spotify auth token", error);
    return res.status(500).json({ error: "Failed to exchange token" });
  }
});

app.get("/api/spotify/status", async (req, res) => {
  console.log("Session ID:", req.sessionID);
  console.log("Full Session:", req.session);
  console.log("Spotify Auth:", req.session.spotifyAuth);

  if (req.session.spotifyAuth && req.session.spotifyAuth.expires_at) {
    const spotifyAuthExpireCheck =
      Date.now() < req.session.spotifyAuth.expires_at;
    console.log(
      "Token expires at:",
      new Date(req.session.spotifyAuth.expires_at)
    );
    console.log("is the token valid?", spotifyAuthExpireCheck);

    if (spotifyAuthExpireCheck) {
      return res.json({ authenticated: true });
    }
  }

  res.json({ authenticated: false });
});

app.get("/api/spotify/getCurrentTrack", async (req, res) => {
  const spotifyAuth = req.session.spotifyAuth.access_token;

  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: "Bearer " + spotifyAuth,
        },
      }
    );

    const data = await response.json();
    res.json(data);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
});

app.put("/api/spotify/pausePlayback", async (req, res) => {
  const spotifyAuth = req.session.spotifyAuth.access_token;

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + spotifyAuth,
      },
    });

    // Spotify returns 204 No Content for successful play/pause requests
    if (response.status === 204 || response.status === 200) {
      res.status(200).json({ message: "Pause request sent" });
    } else {
      throw new Error(`Spotify API returned ${response.status}`);
    }
  } catch (error) {
    console.error("Error pausing track:", error);
    res.status(500).json({ error: "Failed to pause track" });
  }
});

app.put("/api/spotify/playPlayback", async (req, res) => {
  let spotifyAuth = req.session.spotifyAuth.access_token;

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + spotifyAuth,
      },
    });

    // Spotify returns 204 No Content for successful play/pause requests
    if (response.status === 204 || response.status === 200) {
      res.status(200).json({ message: "Play request sent" });
    } else {
      throw new Error(`Spotify API returned ${response.status}`);
    }
  } catch (error) {
    console.error("Error playing track:", error);
    res.status(500).json({ error: "Failed to play track" });
  }
});

app.post("/api/spotify/skipToNext", async (req, res) => {
  const spotifyAuth = req.session.spotifyAuth.access_token;

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + spotifyAuth,
      },
    });

    if (response.status === 204 || response.status === 200) {
      res.status(200).json({ message: "Play request sent" });
    } else {
      throw new Error(`Spotify API returned ${response.status}`);
    }
  } catch (error) {
    console.error("Error playing track:", error);
    res.status(500).json({ error: "Failed to play track" });
  }
});

app.post("/api/spotify/skipToPrevious", async (req, res) => {
  const spotifyAuth = req.session.spotifyAuth.access_token;

  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/previous",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + spotifyAuth,
        },
      }
    );

    if (response.status === 204 || response.status === 200) {
      res.status(200).json({ message: "Play request sent" });
    } else {
      throw new Error(`Spotify API returned ${response.status}`);
    }
  } catch (error) {
    console.error("Error previous track:", error);
    res.status(500).json({ error: "Failed to play track" });
  }
});

app.put("/api/spotify/toggleShuffle", async (req, res) => {
  const spotifyAuth = req.session.spotifyAuth.access_token;
  const { state } = req.query;

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + spotifyAuth,
        },
      }
    );

    if (response.status === 204 || response.status === 200) {
      res.status(200).json({ message: "Play request sent" });
    } else {
      throw new Error(`Spotify API returned ${response.status}`);
    }
  } catch (error) {
    console.error("Error toggling shuffle:", error);
    res.status(500).json({ error: "Failed to play track" });
  }
});
