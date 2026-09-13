const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');

const client = new Client({
  // URL Encoded password to handle special characters like # and /
  connectionString: 'postgresql://postgres.qepaaxzprqkpclgqwjwb:ACJRHQ%243%23sT7J%2Fg@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const dataDir = path.join(__dirname, '../data');

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255),
      password_hash VARCHAR(255)
    );
    CREATE TABLE IF NOT EXISTS products (
      product_id VARCHAR(50) PRIMARY KEY,
      product_name VARCHAR(255),
      current_price NUMERIC,
      stock_quantity INT
    );
    CREATE TABLE IF NOT EXISTS orders (
      order_id VARCHAR(50) PRIMARY KEY,
      order_date TIMESTAMP,
      customer_id VARCHAR(50) REFERENCES customers(customer_id),
      payment_status VARCHAR(50)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      item_id INT PRIMARY KEY,
      order_id VARCHAR(50) REFERENCES orders(order_id),
      product_id VARCHAR(50) REFERENCES products(product_id),
      quantity INT,
      price_at_purchase NUMERIC
    );
  `);
  console.log("Tables created successfully");

  async function loadCSV(filename, tableName, columns, rowMapper) {
    console.log(`Loading ${filename} into ${tableName}...`);
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(path.join(dataDir, filename))
        .pipe(csv())
        .on('data', (data) => results.push(rowMapper(data)))
        .on('end', async () => {
          try {
             await client.query("BEGIN");
             const batchSize = 1000;
             for (let i = 0; i < results.length; i += batchSize) {
                const batch = results.slice(i, i + batchSize);
                const flatData = [];
                let paramIndex = 1;
                const placeholders = batch.map(row => {
                  const rowPlaceholders = row.map(() => `$${paramIndex++}`).join(', ');
                  flatData.push(...row);
                  return `(${rowPlaceholders})`;
                }).join(', ');
                const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
                await client.query(insertQuery, flatData);
             }
             await client.query("COMMIT");
             console.log(`✅ Loaded ${results.length} rows into ${tableName}`);
             resolve();
          } catch(e) {
             await client.query("ROLLBACK");
             reject(e);
          }
        });
    });
  }

  try {
    await client.query('TRUNCATE order_items, orders, products, customers CASCADE');

    await loadCSV('customers.csv', 'customers', ['customer_id', 'name', 'email', 'password_hash'],
      r => [r.customer_id, r.name, r.email, r.password_hash]
    );

    await loadCSV('products.csv', 'products', ['product_id', 'product_name', 'current_price', 'stock_quantity'],
      r => [r.product_id, r.product_name, parseFloat(r.current_price), parseInt(r.stock_quantity)]
    );

    await loadCSV('orders.csv', 'orders', ['order_id', 'order_date', 'customer_id', 'payment_status'],
      r => [r.order_id, r.order_date, r.customer_id, r.payment_status]
    );

    await loadCSV('order_items.csv', 'order_items', ['item_id', 'order_id', 'product_id', 'quantity', 'price_at_purchase'],
      r => [parseInt(r.item_id), r.order_id, r.product_id, parseInt(r.quantity), parseFloat(r.price_at_purchase)]
    );
  } catch (err) {
    console.error("Error loading data:", err);
  } finally {
    await client.end();
  }
}

run();
