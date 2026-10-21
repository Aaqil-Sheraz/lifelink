require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const User = require('./models/User');
const SOSRequest = require('./models/SOSRequest');
const { roomName } = require('./utils/rooms');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const origins = (process.env.CLIENT_URL || '*').split(',').map((s) => s.trim());
const corsOrigin = origins.includes('*') ? true : origins;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });
app.set('io', io);

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donors', require('./routes/donorRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Only logged-in users may open a socket connection. The room is derived from the
// verified user's profile (not from client input), so a client can't spy on other rooms.
io.use(async (socket, next) => {
  try {
    const decoded = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('no user');
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const { locality, bloodGroup } = socket.user;
  socket.join(roomName(locality, bloodGroup));
  console.log(`[socket] ${socket.user.name} connected, joined room "${roomName(locality, bloodGroup)}"`);
  socket.emit('socket:ready', { room: roomName(locality, bloodGroup) });
});

app.use(notFound);
app.use(errorHandler);

// Mark SOS requests as expired every 5 minutes
const expireStale = () =>
  SOSRequest.updateMany(
    { status: 'active', expiresAt: { $lte: new Date() } },
    { status: 'expired' }
  ).catch((e) => console.error('Expiry job failed:', e.message));

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  expireStale();
  setInterval(expireStale, 5 * 60 * 1000);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
