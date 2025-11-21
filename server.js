const express = require('express');
const app = express();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const decode = require('jwt-decode');

const bcrypt = require('bcrypt');
require('dotenv').config();

const port = process.env.PORT || 3000;
const ACTIVE_JWT_SECRET = process.env.ACTIVE_JWT_SECRET;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;
app.use(express.json());
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.get('/', (req, res) => {
    res.status(200).send('<h1>Server is up and running!</h1>');
});

const authMiddleware = (req, res, next) => {
    //I want to try here so that every request that passes through goes through this for token verification
    let authHeader = req.headers.authorization;
    let activeToken = authHeader.split(' ')[1];
    //verify the activetoken received
    let verified;
    try{
        verified = jwt.verify(activeToken, ACTIVE_JWT_SECRET);
    } catch(err){
        return res.status(403).json({message: 'active token expired!'});
    }
    console.log(verified);
    next();
}

app.post('/signin', async (req, res) => {
    const creds = req.body;
    const { email, password } = creds;
    if(!email || !password) {
        return res.status(401).json({response: 'Missing Credentials!'});
    }
    //Database checkup
    try{
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if(!user) {
            return res.status(401).json({status: 'Invalid Email or Password!'})
        }
        const match = await bcrypt.compare(password, user.password);
        if(match) {
            //sign jwt for both refreshtoken and active token and send in the response to the app to be stored and send in next request
            const payload = {
                userID: user.id,
                role: user.role,
                tokenVersion: user.token_version,
                access: user.access
            }; //access will be included when other screens would be ready!

            const expiredAt = new Date( Date.now() + 30 * 24 * 60 * 60 * 1000);
            const activeToken = jwt.sign(payload, ACTIVE_JWT_SECRET, {expiresIn: '15s'});
            const refreshToken = jwt.sign(payload, REFRESH_JWT_SECRET, {expiresIn: '30d'});
            const refreshTokenHash = await bcrypt.hash(refreshToken, 12);


            const session = await pool.query(`
                INSERT INTO user_sessions(user_id, refresh_token, expired_at)
                VALUES(
                  $1, $2, $3
                );
                `, [user.id,
                  refreshTokenHash,
                  expiredAt]);
                  console.log(session);
            return res.status(200).json({status: 'signin', activeToken, refreshToken});
        }
            return res.status(401).json({status: 'Invalid Email or Password!'});
    } catch(err) {
        console.log(`Error: ${err.message}`);
        return res.status(505).json({error: 'server error during signin!'});
    }
});

//sign-out
app.post('/signout', async (req, res) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.json({message: 'no authorization header exist!'});
    }
    const refreshToken = req.headers.authorization.split(' ')[1];
    let verified;
    try{
        verified = jwt.verify(refreshToken, REFRESH_JWT_SECRET)
    } catch(err){
        return res.status(401).json({ message: 'refresh token expired!' });
    }
    
    const decoded = jwt.decode(refreshToken);
    const userID = decoded.userID;
    
    try{
        const dbRes = await pool.query(
            `SELECT refresh_token, session_id FROM user_sessions WHERE is_revoke = false AND user_id = $1`,
            [userID]
        );
        
        if(dbRes.rowCount === 0){
            return res.json({message: 'no token found!'})
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
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        
            
        const session = RF.session_id;
        await pool.query(
            `UPDATE user_sessions SET is_revoke = true, expired_at = NOW() WHERE session_id = $1 AND user_id = $2`,
            [session, userID]
        );
        return res.json({message: 'sign out successful!'});
    }catch(err){
        return res.json(err);
    }

});


app.post('/auth', authMiddleware, (req, res, ) => {
    return res.status(200).json({message: 'active token verified!'});
});

app.post('/refresh-token', async(req, res) => {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader.split(" ")[1];
    let decoded = jwt.decode(refreshToken);
    let userID = decoded.userID;
    let dbEntry = null;
    let dbRes = await pool.query(
        `SELECT session_id, refresh_token FROM user_sessions WHERE is_revoke = $1 AND user_id = $2`, [false, userID]
    );
    if(dbRes.rowCount === 0){
        return res.status(404);
    }
    for(const entry of dbRes.rows){
        let match = jwt.compare(refreshToken, entry.refresh_token)
        if(match){
            dbEntry = entry;
            break;
        }
    }
    let verified;
    let isRevoke = dbEntry.is_revoke;
    try{
        verified = jwt.verify(refreshToken, REFRESH_JWT_SECRET);
    } catch(err){
        const dbQuery = await pool.query(
            `UPDATE user_sessions SET is_revoke = true WHERE refresh_token = $1 AND user_id = $2 AND session_id = $3`
            ,[dbEntry.refresh_token, userID, dbEntry.session_id]
        );
        return res.status(403);
    }

    if(verified && isRevoke){
        res.status(403).json({message: 'Token was revoked!'});
    }

    if(verified && !isRevoke){
        const dbUser = await pool.query(
            `SELECT * FROM users WHERE user_id = $1`, [userID]
        );
        const payload = {
            userID: dbUser.user_id,
            role: dbUser.role,
            tokenVersion: dbUser.tokenVersion,
            access: dbUser.access
        }
        const activeJwt = jwt.sign(payload, ACTIVE_JWT_SECRET, {expiresIn: '15s'});

        res.status(200).json({activeJwt});
    }
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});