import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Quick Commerce Backend is running!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
