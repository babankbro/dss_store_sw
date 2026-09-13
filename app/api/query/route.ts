import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const ALLOWED_COLUMNS: Record<string, string[]> = {
  customers: ['customer_id', 'name', 'email', 'password_hash'],
  products: ['product_id', 'product_name', 'current_price', 'stock_quantity'],
  orders: ['order_id', 'order_date', 'customer_id', 'payment_status'],
  order_items: ['item_id', 'order_id', 'product_id', 'quantity', 'price_at_purchase']
};

export async function POST(request: Request) {
  try {
    const { table, filters } = await request.json();
    
    // ป้องกัน SQL Injection สำหรับชื่อตาราง
    if (!ALLOWED_COLUMNS[table]) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    const allowedCols = ALLOWED_COLUMNS[table];

    // สร้าง Where Clause แบบ Dynamic
    for (const [key, value] of Object.entries(filters)) {
      if (value && allowedCols.includes(key)) {
        whereClauses.push(`CAST(${key} AS TEXT) ILIKE $${paramIndex}`);
        queryParams.push(`%${value}%`);
        paramIndex++;
      }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // คิวรีเพื่อนับจำนวนทั้งหมดที่ตรงเงื่อนไข
    const countQuery = `SELECT COUNT(*) FROM ${table} ${whereString}`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = countResult.rows[0].count;

    // คิวรีเพื่อดึงข้อมูล (จำกัด 100 แถวแรกเพื่อป้องกันหน้าเว็บค้าง)
    const dataQuery = `SELECT * FROM ${table} ${whereString} LIMIT 100`;
    const dataResult = await pool.query(dataQuery, queryParams);

    return NextResponse.json({ rows: dataResult.rows, totalCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
