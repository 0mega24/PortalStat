import express from 'express';
import path from 'path';
import { servers } from './config';
import { startPolling as startStatusPolling } from './services/statusPoller';
import { startPolling as startRconPolling } from './services/rconPoller';
import { startContainerStatsStreams } from './services/dockerStats';
import pingRouter from './api/ping';
import statusRouter from './api/status';
import resourceRouter from './api/resources';
import cacheRouter from './api/cache';
import testRouter from './routes/status';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use("/api", pingRouter);
app.use("/api/status", statusRouter);
app.use("/api/resources", resourceRouter);
app.use("/api", cacheRouter);
app.use("/api", testRouter);
app.use(express.static(path.join(__dirname, '../public')));

startStatusPolling(servers);
startRconPolling(servers);
startContainerStatsStreams(servers);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monitoring API running on http://localhost:${PORT}`);
});
