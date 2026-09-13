'use client';

import { useState, useEffect } from 'react';

const TABLE_SCHEMAS: Record<string, string[]> = {
  customers: ['customer_id', 'name', 'email', 'password_hash'],
  products: ['product_id', 'product_name', 'current_price', 'stock_quantity'],
  orders: ['order_id', 'order_date', 'customer_id', 'payment_status'],
  order_items: ['item_id', 'order_id', 'product_id', 'quantity', 'price_at_purchase']
};

export default function Home() {
  const [table, setTable] = useState('customers');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const columns = TABLE_SCHEMAS[table];

  const handleFilterChange = (col: string, val: string) => {
    setFilters(prev => ({ ...prev, [col]: val }));
  };

  const search = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, filters })
      });
      const json = await res.json();
      if (res.ok) {
        setData(json.rows);
        setCount(json.totalCount);
      } else {
        setError(json.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ดึงข้อมูลใหม่ทุกครั้งที่เปลี่ยนตาราง
  useEffect(() => {
    setFilters({});
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-blue-700">Database Search Explorer</h1>
        <p className="text-gray-500">ระบบจำลองการสืบค้นข้อมูลจากฐานข้อมูล OLTP แบบไดนามิก</p>

        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-blue-500">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกตาราง (Select Table)</label>
              <select 
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 outline-none font-medium"
              >
                <option value="customers">Customers (ลูกค้า)</option>
                <option value="products">Products (สินค้า)</option>
                <option value="orders">Orders (ใบสั่งซื้อ)</option>
                <option value="order_items">Order Items (รายละเอียดบิล)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map(col => (
              <div key={col}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{col}</label>
                <input
                  type="text"
                  value={filters[col] || ''}
                  onChange={(e) => handleFilterChange(col, e.target.value)}
                  placeholder={`ค้นหา ${col}...`}
                  className="w-full p-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-gray-50 focus:bg-white"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t pt-4">
            <button 
              onClick={search}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded shadow disabled:opacity-50 transition-colors"
            >
              {loading ? 'กำลังค้นหา...' : 'ค้นหาข้อมูล'}
            </button>
            <div className="text-gray-600 font-medium mt-4 sm:mt-0 text-center sm:text-right">
              พบข้อมูลทั้งหมด:<br />
              <span className="text-3xl text-blue-600 font-bold">{Number(count).toLocaleString()}</span> รายการ
            </div>
          </div>
          
          {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
           <div className="bg-gray-100 px-6 py-3 border-b">
             <h2 className="text-lg font-bold text-gray-700">ผลลัพธ์การค้นหา</h2>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50 text-gray-700 text-sm">
                   {columns.map(col => <th key={col} className="p-4 border-b whitespace-nowrap">{col}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {data.length > 0 ? (
                   data.map((row, i) => (
                     <tr key={i} className="hover:bg-gray-100 border-b last:border-0 text-sm transition-colors">
                       {columns.map(col => {
                         let val = row[col];
                         // จัด Format วันที่ถ้าเป็น Date Object
                         if (val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
                           val = new Date(val).toLocaleString();
                         }
                         return (
                           <td key={col} className="p-4 text-gray-700 whitespace-nowrap">
                             {String(val ?? '-')}
                           </td>
                         )
                       })}
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={columns.length} className="p-12 text-center text-gray-400">
                       {!loading && 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข'}
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
             {count > 100 && (
                <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 border-t">
                  *เพื่อประสิทธิภาพของเบราว์เซอร์ ระบบแสดงผลลัพธ์สูงสุด 100 รายการแรกเท่านั้น
                </div>
             )}
           </div>
        </div>

      </div>
    </main>
  );
}
