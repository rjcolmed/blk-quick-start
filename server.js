require('dotenv').config()
const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');

// Localhost port
const port = '3000';

// Environment variables
const {
  CLIENT_ID,
  ACCESS_CONTROL_SUB_KEY,
  DEVICE_ID,
  REDIRECT_URI,
  SECRET,
} = process.env;

// Endpoints and scope
const baseAuthUri = 'https://auth.buildinglink.com/connect/authorize';
const scope = encodeURIComponent('api_identity offline_access access_control_write');
const tokenEndpoint = 'https://auth.buildinglink.com/connect/token';
const requestUri = 'https://api.buildinglink.com/AccessControl/PropEmp/v1/Residents';

// Express set-up
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/public`));

// Application routes
app.get('/', (_req, res) => {
  res.render('index', {
    residents: null,
    access_token: null,
    refresh_token: null,
    baseAuthUri,
    scope,
    REDIRECT_URI,
    CLIENT_ID,
  });
});

app.get('/callback', (req, res) => {

  const data = qs.stringify({
    grant_type: 'authorization_code',
    code: req.query.code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: SECRET
  });

  axios.post(
    tokenEndpoint,
    data,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  .then(tokenResponse => {
    const { access_token, refresh_token } = tokenResponse.data;

    const requestHeaders = {
      'Accept': 'application/json',
      'Ocp-Apim-Subscription-Key': ACCESS_CONTROL_SUB_KEY,
      'Authorization': `Bearer ${access_token}`
    };

    const requestParams = {
      "device-id": DEVICE_ID
    };

    return axios({
      method: 'get',
      url: requestUri,
      headers: requestHeaders,
      params: requestParams
    })
    .then(response => {
      const residents = response.data.value;

      res.render('index', {
        residents: residents,
        access_token,
        refresh_token,
      });
    })
    .catch(err => console.log(`Hey! An error occurred. Check it outj: ${err}`));

  })
  .catch(err => console.log(`Hey! An error occurred. Check it out: ${err}`));
});

app.get('/refresh', (req, res) => {
  const { refresh_token } = req.query;

  const data = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: SECRET
  });

  axios.post(
    tokenEndpoint,
    data,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  .then(tokenResponse => {
    const { access_token, refresh_token } = tokenResponse.data;

    const requestHeaders = {
      'Accept': 'application/json',
      'Ocp-Apim-Subscription-Key': ACCESS_CONTROL_SUB_KEY,
      'Authorization': `Bearer ${access_token}`
    };

    const requestParams = {
      "device-id": DEVICE_ID
    };

    return axios({
      method: 'get',
      url: requestUri,
      headers: requestHeaders,
      params: requestParams
    })
    .then(response => {
      const residents = response.data.value;

      res.render('index', {
        residents: residents,
        access_token,
        refresh_token,
      });
    })
    .catch(err => console.log(`Hey! An error occurred. Check it outj: ${err}`));
  })
});

app.listen(port, () => console.log(`Listening on port ${port}`));