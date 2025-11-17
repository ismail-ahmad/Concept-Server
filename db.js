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
          //
        `);
        console.log("successful Update!");
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
})();