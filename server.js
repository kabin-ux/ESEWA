import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/userRouter.js';
import connectToDB from './database/db.js';
import { PORT } from './config.js';

const app = express();

// Recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

connectToDB();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/payment-integration', userRouter);

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
