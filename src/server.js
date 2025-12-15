import { Server } from 'socket.io';
import app from './app.js';
import routes from './routes.js';
import './database/index.js';
import 'dotenv/config';

import './jobs/AutoFinishOrders.js';

const port = process.env.APP_PORT;
const allowedOrigins = process.env.CORS_ORIGINS;
process.env.CORS_ORIGINS.split(',');

const server = app.listen(port, () => {
  console.log(`Application running on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use((request, _response, next) => {
  request.io = io;
  next();
});

app.use(routes);

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join_order_room', (orderId) => {
    socket.join(orderId);
  });
});
