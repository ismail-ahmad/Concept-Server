const express = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('<h1>Server is up and running!</h1>');
});
app.post('/signin', (req, res) => {
    const creds = req.body;
    if(creds && creds.email === 'ismailahmad0505@gmail.com' && creds.password === 'helloworld') {
        return res.json({status: 200});
    }
    return res.status(401).json({error: 'Invalid Credentials'});
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});