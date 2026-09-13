const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.qepaaxzprqkpclgqwjwb:ACJRHQ%243%23sT7J%2Fg@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

const newCustomers = [
  ['CUST_00301', 'กฤษฎา วงศ์สว่าง', 'kritsada.w@example.com', 'a1b2c3d4e5f6g7h8'],
  ['CUST_00302', 'ณัฐวุฒิ รักไทย', 'nattawut.r@example.com', 'b2c3d4e5f6g7h8i9'],
  ['CUST_00303', 'ดาริกา สินชัย', 'darika.s@example.com', 'c3d4e5f6g7h8i9j0'],
  ['CUST_00304', 'พงศกร สุขใจ', 'pongsakorn.s@example.com', 'd4e5f6g7h8i9j0k1'],
  ['CUST_00305', 'วิภาดา มณีรัตน์', 'wipada.m@example.com', 'e5f6g7h8i9j0k1l2'],
  ['CUST_00306', 'ศุภโชค อรุณสวัสดิ์', 'supachok.a@example.com', 'f6g7h8i9j0k1l2m3'],
  ['CUST_00307', 'อนันต์ บุญมี', 'anan.b@example.com', 'g7h8i9j0k1l2m3n4'],
  ['CUST_00308', 'สุดารัตน์ พรประเสริฐ', 'sudarat.p@example.com', 'h8i9j0k1l2m3n4o5'],
  ['CUST_00309', 'ธนทัต แสงทอง', 'thanatat.s@example.com', 'i9j0k1l2m3n4o5p6'],
  ['CUST_00310', 'มณีรัตน์ ยอดเยี่ยม', 'maneerat.y@example.com', 'j0k1l2m3n4o5p6q7'],
];

async function addCustomers() {
  await client.connect();
  try {
    let values = [];
    let params = [];
    let paramIdx = 1;
    newCustomers.forEach(cust => {
      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
      params.push(...cust);
    });
    
    const query = `INSERT INTO customers (customer_id, name, email, password_hash) VALUES ${values.join(', ')}`;
    await client.query(query, params);
    
    console.log('✅ Inserted 10 new customers successfully!');
  } catch (e) {
    console.error('❌ Error inserting customers:', e);
  } finally {
    await client.end();
  }
}

addCustomers();
