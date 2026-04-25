const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./routes/auth');
const treesRoutes = require('./routes/trees');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/trees', treesRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
