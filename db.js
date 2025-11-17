const express = require('express');
const app = express();
const { Pool } = require('pg');
require('dotenv').config();
app.use(express.json());
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async() => {
    try{
        const request = await pool.query(`
          CREATE TABLE user_sessions(
            session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            refresh_token TEXT NOT NULL,
            is_revoke BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            expired_at TIMESTAMPTZ
          );
        `);
        console.log("successful table creation!");
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
})();

// users
// CREATE TABLE users(
//   name TEXT NOT NULL,
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   email TEXT NOT NULL,
//   password TEXT NOT NULL,
//   token_version INTEGER NOT NULL,
//   role TEXT NOT NULL,
//   access JSONB DEFAULT '[]'::JSONB
// );


// user_sessions
// CREATE TABLE user_sessions(
//             session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//             user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//             refresh_token TEXT NOT NULL,
//             is_revoke BOOLEAN DEFAULT FALSE NOT NULL,
//             created_at TIMEZONE DEFAULT CURRENT_TIMEZONE,
//             expired_at TIMEZONE,
//           );