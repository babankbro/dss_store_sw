import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const ALLOWED_COLUMNS: Record<string, string[]> = {
  customers: ['customer_id', 'name', 'email', 'password_hash'],
  products: ['product_id', 'product_name', 'current_price', 'stock_quantity'],
  orders: ['order_id', 'order_date', 'customer_id', 'payment_status'],
  order_items: ['item_id', 'order_id', 'product_id', 'quantity', 'price_at_purchase']
};

// คอลัมน์ที่เป็นตัวเลข จะต้องค้นหาแบบ Exact Match (.eq) แทนที่จะใช้ Like (.ilike)
const NUMERIC_COLUMNS = ['item_id', 'quantity', 'current_price', 'stock_quantity', 'price_at_purchase'];

export async function POST(request: Request) {
  try {
    const { table, filters } = await request.json();
    
    // ป้องกัน SQL Injection สำหรับชื่อตาราง
    if (!ALLOWED_COLUMNS[table]) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // สร้าง Supabase Client สำหรับฝั่ง Server
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const allowedCols = ALLOWED_COLUMNS[table];

    // เริ่มสร้างคำสั่ง Query พร้อมกับการขอจำนวน Count แบบ Exact
    let query = supabase.from(table).select('*', { count: 'exact' });

    // สร้างเงื่อนไขการค้นหาแบบ Dynamic ด้วย Supabase SDK
    for (const [key, value] of Object.entries(filters)) {
      if (value && allowedCols.includes(key)) {
        if (NUMERIC_COLUMNS.includes(key)) {
          // ถ้าเป็นตัวเลข ให้เทียบค่าตรงๆ
          query = query.eq(key, value);
        } else {
          // ถ้าเป็นข้อความ ให้ค้นหาแบบมีคำนั้นอยู่บางส่วน (Case-insensitive)
          query = query.ilike(key, `%${value}%`);
        }
      }
    }

    // จำกัดผลลัพธ์ที่ 100 แถว และรัน Query
    const { data, count, error } = await query.limit(100);

    if (error) {
      throw error;
    }

    return NextResponse.json({ rows: data || [], totalCount: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
