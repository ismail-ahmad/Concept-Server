const express = require('express');
const app = express();
const { Pool, Result } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const port = process.env.PORT || 3000;
app.use(express.static('public'));
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
    const {email, password} = creds;
    if(!email || !password) {
        return res.status(401).json({response: 'Missing Credentials!'});
    }
    //I want to query here to the postgresql if it contains this email, if so return the row
    try{
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if(!user) {
            return res.status(401).json({status: 'User not found!'})
        }
        if(password === user.password) {
            return res.status(200).json({status: 'ok'});
        }
            return res.status(401).json({status: 'Wrong Credentials!'});
    } catch(err) {
        console.log(`${err.statusCode}, Error Message: ${err}`);
        return res.status(500).json({error: 'server error during signin!'});
    }
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});