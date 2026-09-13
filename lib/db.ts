import { Pool } from 'pg';

// กำหนด type ให้กับตัวแปร global เพื่อป้องกัน Error จาก TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __pool: Pool | undefined;
}

// แนะนำให้ดึงจาก Environment Variable บน Vercel ถ้ามี
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:15432/dss_db';

let pool: Pool;

// ตรวจสอบว่าถ้าอยู่ในโหมด production ให้สร้าง Pool ใหม่เลย
// แต่ถ้าเป็น dev mode ให้ใช้จาก global เพื่อป้องกันการสร้าง Connection ซ้ำซ้อนตอน Hot Reload
if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
  });
} else {
  if (!global.__pool) {
    global.__pool = new Pool({
      connectionString,
    });
  }
  pool = global.__pool;
}

export default pool;
