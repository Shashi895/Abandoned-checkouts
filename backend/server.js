import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { handleGoKwikWebhook } from './controllers/gokwikWebhookController.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// GoKwik Webhook
app.post('/gokwik-webhook', handleGoKwikWebhook);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
