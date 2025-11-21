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
                let userID = '78686099-906f-494a-a6f9-f278422d8fea';
                let dbEntry;
                let dbRes = await pool.query(
                    `SELECT session_id, refresh_token FROM user_sessions WHERE is_revoke = $1 AND user_id = $2`, [false, userID]
                );
                if(dbRes.rowCount === 0){
                    console.log('0 Row Count!');
                }
                console.log(dbRes);
                let payload = {
                    userID: userID,
                    role: 'master_admin',
                    tokenVersion: '1',
                    access: []
                }
                let refreshToken = jwt.sign(payload,'b3921e778e48769751e5146cbd9bfd2ee3b41dda22f690dea835362d5203945a', {
                    expiresIn: '30d'
                });
                let hash = await bcrypt.hash(refreshToken, 12);
                console.log(hash);
                for(const entry of dbRes.rows){
                    let match = bcrypt.compare(refreshToken, entry.refresh_token)
                    if(match){
                        dbEntry = entry;
                        break;
                    }
                }
                const isRevoke = false;
                // console.log(dbEntry.refresh_token, dbEntry.session_id);

                    const dbQuery = await pool.query(
                        `UPDATE user_sessions SET is_revoke = true WHERE refresh_token = $1 AND user_id = $2 AND session_id = $3`
                        ,[dbEntry.refresh_token, userID, dbEntry.session_id]
                    );
            
                if(!isRevoke){
                    const dbUser = await pool.query(
                        `SELECT * FROM users WHERE id = $1`, [userID]
                    );
            
                    console.log(dbUser);
                }
})();