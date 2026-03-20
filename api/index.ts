import serverless from 'serverless-http';
import { app } from '../server.js'; // Need to export app from server.ts

export default serverless(app);
