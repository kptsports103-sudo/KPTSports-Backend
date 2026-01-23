const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

app.get('/api/home', (req, res) => {
  res.json({ ok: true, message: 'Backend is working!' });
});

module.exports = app;