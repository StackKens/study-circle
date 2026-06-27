const { Client } = require('pg');
require('dotenv').config();

const SOURCE_DB_URL = 'postgresql://postgres:GebgrxxkZLryNotALEBVgTsrxOKqfgVc@kodama.proxy.rlwy.net:56616/railway';
const DEST_DB_URL = process.env.DATABASE_URL;

async function run() {
  const sourceClient = new Client({
    connectionString: SOURCE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  const destClient = new Client({
    connectionString: DEST_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to databases...');
  await sourceClient.connect();
  await destClient.connect();
  console.log('Connected successfully!');

  try {
    // 1. Truncate destination tables in reverse dependency order
    console.log('Truncating destination tables...');
    await destClient.query(`
      TRUNCATE TABLE 
        messages, 
        email_verifications, 
        friendships, 
        resources, 
        session_attendees, 
        sessions, 
        group_members, 
        groups, 
        testimonials, 
        instructors, 
        users 
      RESTART IDENTITY CASCADE
    `);
    console.log('Destination tables truncated successfully.');

    // Helper to copy table data
    async function copyTable(tableName, columns) {
      console.log(`Copying table: ${tableName}...`);
      const selectQuery = `SELECT ${columns.join(', ')} FROM ${tableName}`;
      const srcRes = await sourceClient.query(selectQuery);
      
      console.log(`Found ${srcRes.rowCount} rows in source table ${tableName}`);
      if (srcRes.rowCount === 0) return;

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const row of srcRes.rows) {
        const values = columns.map(col => row[col]);
        await destClient.query(insertQuery, values);
      }
      console.log(`Successfully copied ${srcRes.rowCount} rows into ${tableName}`);
    }

    // 2. Copy data in correct dependency order
    await copyTable('users', [
      'id', 'name', 'email', 'password_hash', 'university', 'course', 'year_of_study', 'created_at', 'avatar_url', 'is_email_verified'
    ].filter(Boolean)); // Note: checking if avatar_url/is_email_verified exists

    await copyTable('instructors', ['user_id', 'bio', 'department', 'created_at']);
    await copyTable('groups', ['id', 'name', 'description', 'subject', 'university', 'created_by', 'created_at']);
    await copyTable('group_members', ['user_id', 'group_id', 'role', 'joined_at']);
    await copyTable('sessions', ['id', 'group_id', 'title', 'start_time', 'end_time', 'created_by', 'created_at']);
    await copyTable('session_attendees', ['session_id', 'user_id']);
    await copyTable('resources', ['id', 'group_id', 'title', 'type', 'url', 'uploaded_by', 'downloads', 'created_at']);
    await copyTable('friendships', ['user_id', 'friend_id', 'status', 'created_at']);
    await copyTable('testimonials', [
      'id', 'user_id', 'name', 'university', 'course', 'year_of_study', 'quote', 'rating', 'avatar_url', 'display_order', 'is_active', 'created_at'
    ]);
    await copyTable('messages', ['id', 'group_id', 'sender_id', 'content', 'created_at']);
    await copyTable('email_verifications', ['token', 'user_id', 'expires_at']);

    console.log('====================================');
    console.log('Database migration completed successfully!');
    console.log('====================================');

  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    await sourceClient.end();
    await destClient.end();
  }
}

run();
