const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require('./swagger');
const path = require('path');

dotenv.config({ path: __dirname + '/.env' });
const PORT = process.env.PORT || 5000;

// Connect DB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('mongoDB is connected'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route
app.use('/trx', require('./routes/transactions'));
app.use('/user', require('./routes/users'));

app.listen(PORT, () => console.log('Server is running at ' + PORT));