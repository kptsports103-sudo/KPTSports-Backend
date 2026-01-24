const express = require('express');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login successful', user: { id: '1', email: req.body.email }, token: 'mock-token' });
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

module.exports = app;