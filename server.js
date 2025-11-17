const express = require('express');
const app = express();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt'); //it will be used later to compare saved password hashes and current password
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
            return res.status(401).json({status: 'User not found!'})
        }
        if(password === user.password) { //later use bcrypt to compare credentials
            //sign jwt for both refreshtoken and active token and send in the response to the app to be stored and send in next request
            const payload = {
                user: user.email,
                name: user.name,
                role: user.role,
                tokenVersion: user.tokenversion
            };
            const activeToken = jwt.sign(payload, ACTIVE_JWT_SECRET, {expiresIn: '15m'});
            const refreshToken = jwt.sign(payload, REFRESH_JWT_SECRET, {expiresIn: '30d'});
            return res.status(200).json({status: 'signin', activeToken, refreshToken});
        }
            return res.status(401).json({status: 'Wrong Credentials!'});
    } catch(err) {
        console.log(`Error Message: ${err}`);
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