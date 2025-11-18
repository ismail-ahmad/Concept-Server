const express = require('express');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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
        const request = await pool.query(
            `DELETE FROM user_sessions`
        );
        console.log(request.rows[0].password);
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
})();