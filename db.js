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
        let password = await bcrypt.hash('qwerty12345', 12);
        const request = await pool.query(
            `INSERT INTO users(name, email, password, token_version ,role)
            VALUES($1, $2, $3, $4, $5)`,
            ['ismail ahmad', 'ismailahmad0505@gmail.com', password, 1, 'master_admin']
        );
        console.log(request.rows[0].password);
    } catch(err) {
        console.log(`Error: ${err.message}`);
    }
})();