const express = require('express');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); //it will be used later to compare saved password hashes and current password
require('dotenv').config();

const port = process.env.PORT || 3000;
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
            return res.status(200).json({status: 'signin'});
        }
            return res.status(401).json({status: 'Wrong Credentials!'});
    } catch(err) {
        console.log(`Error Message: ${err}`);
        return res.status(500).json({error: 'server error during signin!'});
    }
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});