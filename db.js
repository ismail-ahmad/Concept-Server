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
        try{
            const refreshToken = jwt.sign(
                {
                    userID: '78686099-906f-494a-a6f9-f278422d8fea',
                    role: 'master_admin',
                    tokenVersion: 1,
                    access: []
                },
                process.env.REFRESH_JWT_SECRET,
                {
                    expiresIn: '30d'
                }
            );
            const dbRes = await pool.query(
                `SELECT refresh_token, session_id FROM user_sessions WHERE is_revoke = false AND user_id = $1`,
                [`78686099-906f-494a-a6f9-f278422d8fea`]
            );
            if(dbRes.rowCount === 0){
                console.log("count is zero!");
            } else{
                // console.log(dbRes.rows)
            }

            let RF = null;
                    for (const entry of dbRes.rows) {
                        const match = await bcrypt.compare(refreshToken, entry.refresh_token);
                        if (match) {
                            RF = entry;
                            break;
                        }
                    }
            
                    if (!RF) {
                        console.log({ status: 'Invalid refresh token' });
                    }
                    // console.log(RF);

                    const decoded = jwt.decode(refreshToken);
                    const userID = decoded.userID;
                    console.log(userID);
            
        }catch(err){
            console.log(err);
        }
})();