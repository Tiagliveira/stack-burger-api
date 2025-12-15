import cors from 'cors';
import express from 'express';
import fileRoutesConfig from './config/fileRoutes.cjs';
import 'dotenv/config';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGINS,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/product-file', fileRoutesConfig);
app.use('/category-file', fileRoutesConfig);

export default app;
