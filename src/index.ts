import express from 'express';
import path from 'path';
import { servers } from './config';
import { startPolling } from './services/statusPoller';
import statusRouter from './api/status';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use("/api/status", statusRouter);
app.use(express.static(path.join(__dirname, '../public')));

startPolling(servers);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monitoring API running on http://localhost:${PORT}`);
});