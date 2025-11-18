const express = require('express');
const app = express();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

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
        if(match) { //later use bcrypt to compare credentials
            //sign jwt for both refreshtoken and active token and send in the response to the app to be stored and send in next request
            const payload = {
                userID: user.id,
                role: user.role,
                tokenVersion: user.token_version,
                access: user.access
            }; //access will be included when other screens would be ready!

            const expiredAt = new Date( Date.now() + 30 * 24 * 60 * 60 * 1000);
            const activeToken = jwt.sign(payload, ACTIVE_JWT_SECRET, {expiresIn: '15m'});
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
        return res.status(500).json({error: 'server error during signin!'});
    }
});


app.post('/auth', (req, res) => {
    //verify the tokens received
    //if not verified, send 401 to the app
});

app.post('/refresh-token', (req, res) => {
    //refresh token would be checked here
    //if refresh token is valid, it would generate a new activeToken that the app can use to send with each next request
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});