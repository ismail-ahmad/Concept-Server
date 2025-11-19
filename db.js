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
            const dbRes = await pool.query(
                `SELECT refresh_token, session_id FROM user_sessions WHERE is_revoke = false AND user_id = $1`,
                [`78686099-906f-494a-a6f9-f278422d8fea`]
            );
            if(dbRes.rowCount === 0){
                console.log("count is zero!");
            } else{
                console.log(dbRes.rows);
            }
            
        }catch(err){
            console.log(err);
        }
})();