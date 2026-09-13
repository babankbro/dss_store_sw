import { Pool } from 'pg';

let pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:15432/dss_db',
  });
}
pool = global.pool;

export default pool;
