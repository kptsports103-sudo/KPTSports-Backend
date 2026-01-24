const app = require('../src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 KPT Sports Backend running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api/v1`);
});

module.exports = app;