const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const app = express();
app.use(cors());

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

app
  .listen(3002, () => {
    console.log("Server listening on port 3002");
  })

//gets path of token and credentials
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

//reads previously authorized credentials from save file
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (error) {
    console.log(error);
  }
}

//translates credentials in a way thats compatible w/ GoogleAuth.fromJSON
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

//load or request or authorization to call APIs
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }

  return client;
}

// Gets 7 days of events from calendar

async function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
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
  const auth = await authorize();
  if (!auth) return res.status(401).json({ error: "authorize failed" });

  try {
    const events = await listEvents(auth);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

