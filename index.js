const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 6000;


// middleware
app.use(cors());
app.use(express.json())


app.get('/', (req, res) => {
    res.send('DNS Manager Server is running')
})

app.listen(port, () => {
    console.log(`DNS manager running on ${port}`);
})