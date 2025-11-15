const express = require('express');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.status(200).send('<h1>hello world!</h1>');
});

app.listen(port, () => {
    console.log(`server is listening at ${port}`);
});