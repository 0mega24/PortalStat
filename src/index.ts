import express from 'express';
import path from 'path';
import { servers } from './config';
import { startPolling } from './services/statusPoller';
import { startContainerStatsStreams } from './services/docker';
import pingRouter from './api/ping';
import statusRouter from './api/status';
import resourceRouter from './api/resources';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use("/api", pingRouter);
app.use("/api/status", statusRouter);
app.use("/api/resources", resourceRouter);
app.use(express.static(path.join(__dirname, '../public')));

startPolling(servers);
startContainerStatsStreams(servers);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monitoring API running on http://localhost:${PORT}`);
});
