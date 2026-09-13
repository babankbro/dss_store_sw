const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:15432/dss_db'
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL");

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

  async function loadCSV(filename, tableName, insertQuery, rowMapper) {
    console.log(`Loading ${filename} into ${tableName}...`);
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(path.join(dataDir, filename))
        .pipe(csv())
        .on('data', (data) => results.push(rowMapper(data)))
        .on('end', async () => {
          try {
             // Basic batch insert
             await client.query("BEGIN");
             for(const row of results) {
                await client.query(insertQuery, row);
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

    await loadCSV('customers.csv', 'customers',
      'INSERT INTO customers (customer_id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      r => [r.customer_id, r.name, r.email, r.password_hash]
    );

    await loadCSV('products.csv', 'products',
      'INSERT INTO products (product_id, product_name, current_price, stock_quantity) VALUES ($1, $2, $3, $4)',
      r => [r.product_id, r.product_name, parseFloat(r.current_price), parseInt(r.stock_quantity)]
    );

    await loadCSV('orders.csv', 'orders',
      'INSERT INTO orders (order_id, order_date, customer_id, payment_status) VALUES ($1, $2, $3, $4)',
      r => [r.order_id, r.order_date, r.customer_id, r.payment_status]
    );

    await loadCSV('order_items.csv', 'order_items',
      'INSERT INTO order_items (item_id, order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
      r => [parseInt(r.item_id), r.order_id, r.product_id, parseInt(r.quantity), parseFloat(r.price_at_purchase)]
    );
  } catch (err) {
    console.error("Error loading data:", err);
  } finally {
    await client.end();
  }
}

run();
