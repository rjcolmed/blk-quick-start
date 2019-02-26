require('dotenv').config()
const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');

// Localhost port
const port = '3000';

// Environment variables
const {
  client_id,
  access_control_sub_key,
  device_id,
  redirect_uri,
  refresh_uri,
  client_secret,
} = process.env;

// Endpoints, scope, misc variables
const baseAuthUri = 'https://auth.buildinglink.com/connect/authorize';
const tokenEndpoint = 'https://auth.buildinglink.com/connect/token';
const url = 'https://api.buildinglink.com/AccessControl/PropEmp/v1/Residents';
const scope = encodeURIComponent('api_identity offline_access access_control_write');

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
    redirect_uri,
    refresh_uri,
    client_id,
  });
});

app.get('/callback', (req, res) => {
  const { code } = req.query;

  const data = qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id,
    client_secret,
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

    const headers = {
      'Accept': 'application/json',
      'Ocp-Apim-Subscription-Key': access_control_sub_key,
      'Authorization': `Bearer ${access_token}`
    };

    const params = {
      "device-id": device_id
    };

    return axios({
      method: 'get',
      url,
      headers,
      params,
    })
    .then(response => {
      const residents  = response.data.value;
      
      res.render('index', {
        residents,
        access_token,
        refresh_token,
        baseAuthUri,
        scope,
        redirect_uri,
        refresh_uri,
        client_id,
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
    redirect_uri,
    client_id,
    client_secret,
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

    const headers = {
      'Accept': 'application/json',
      'Ocp-Apim-Subscription-Key': access_control_sub_key,
      'Authorization': `Bearer ${access_token}`
    };

    const params = {
      "device-id": device_id
    };

    return axios({
      method: 'get',
      url,
      headers,
      params,
    })
    .then(response => {
      const residents = response.data.value;

      res.render('index', {
        residents,
        access_token,
        refresh_token,
        baseAuthUri,
        scope,
        redirect_uri,
        refresh_uri,
        client_id,
      });
    })
    .catch(err => console.log(`Hey! An error occurred. Check it outj: ${err}`));
  })
});

app.listen(port, () => console.log(`Listening on port ${port}`));