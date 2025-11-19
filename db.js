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
            const setIsRevoke = await pool.query(
            `UPDATE user_sessions SET is_revoke = true, expired_at = NOW() WHERE session_id = $1 AND user_id = $2`,
            [`6ea74abb-23c2-431d-8e09-27c4a114a038`, `78686099-906f-494a-a6f9-f278422d8fea`]
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