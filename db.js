const express = require('express');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const decode = require('jwt-decode')
require('dotenv').config();
app.use(express.json());
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async() => {
    const dbRes = await pool.query(
        `
        SELECT client_name, id FROM clients
        `);
    console.log(dbRes.rows);
})();

// UPDATE user_sessions 
//         SET is_revoke = true 
//         WHERE is_revoke = false;