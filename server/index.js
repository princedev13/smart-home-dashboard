const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { google } = require("googleapis");
const url = require('url');

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
    access_type:'offline',
    prompt: 'consent',
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
    console.log('Error:' + q.error)
  } else {
    //Get access and refresh tokens

    let { tokens } = await client.getToken({
      code: q.code,
      redirect_uri: keys.redirect_uris[0]
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
