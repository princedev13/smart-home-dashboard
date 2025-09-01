require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { google } = require("googleapis");
const crypto = require("crypto");
const WEATHER_API_KEY = process.env.WEATHER_API_SECRET;
const NEWS_API_KEY = process.env.NEWS_API_SECRET;
const SPOTIFY_API_KEY = process.env.SPOTIFY_API_SECRET;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;


const app = express();

app.use(cors());
app.use(
  session({
    secret: crypto.randomBytes(16).toString("hex"),
    resave: false,
    saveUninitialized: false,
  })
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

const spotifyScope =
  "user-read-private user-read-email user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-playback-position user-read-recently-played";

app.listen(3002, () => {
  console.log("Server listening on port 3002");
});

//gets path of token and credentials
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function getOAuthKeys() {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  return credentials.web;
}

//reads previously authorized credentials from save file
async function loadSavedCredentialsIfExist() {
  try {
    const tokenContent = await fs.readFile(TOKEN_PATH);
    const savedCredentials = JSON.parse(tokenContent);
    return google.auth.fromJSON(savedCredentials);
  } catch (error) {
    console.error("Error reading token.json:", error);
  }

  //defines oauth client

  try {
    const keys = await getOAuthKeys();

    const client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );

    return client;
  } catch (error) {
    console.error("Error loading credentials.json:", error);
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
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

app.get("/api/auth", async (req, res) => {
  const keys = await getOAuthKeys();

  const client = await loadSavedCredentialsIfExist();
  if (!client) return res.status(401).json({ error: "authorize failed" });

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

  const client = await loadSavedCredentialsIfExist();
  if (!client) return res.status(401).json({ error: "authorize failed" });

  let q = url.parse(req.url, true).query;

  if (q.error) {
    console.log("Error:" + q.error);
  } else {
    //Get access and refresh tokens

    let { tokens } = await client.getToken({
      code: q.code,
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
  if (!client) return res.status(401).json({ error: "authorize failed" });

  try {
    const events = await listEvents(client);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/weather", async (req, res) => {
  try {
    const response = await fetch(
      "http://api.weatherapi.com/v1/current.json?key=" +
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
    const response = await fetch("http://192.168.1.24:5000/api/tempsensor");
    const responseJson = await response.json();
    res.json(responseJson);
  } catch (err) {
    console.error("Error fetching temp sensor data", err);
  }
});

app.get("/api/spotify/auth", async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.state = state;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: spotifyScope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
  });

  res.redirect(
    "https://accounts.spotify.com/api/authorize?" + params.toString()
  );
});

app.get("/api/spotify/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const paramsBody = new URLSearchParams({
    code: code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const params = new URLSearchParams({
    error: "state_mismatch",
  });

  if (state !== req.session.state) {
    res.redirect("/#" + params);
  } else {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_API_KEY).toString(
              "base64"
            ),
        },
        body: paramsBody.toString(),
      });

      const data = await response.json();
      console.log("Spotify token response:", data);

      res.json(data);
    } catch (error) {
      console.error("Error fetching spotify auth token", error);
      return res.status(500).json({ error: "Failed to exchange token" });
    }
  }
});
