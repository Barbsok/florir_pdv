import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

export const isDatabaseConfigured = () => !!process.env.DATABASE_URL;

export const sql = (isDatabaseConfigured()
  ? postgres(process.env.DATABASE_URL!)
  : null) as ReturnType<typeof postgres>;
