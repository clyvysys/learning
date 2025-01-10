// server.js

// 1. Import config (which loads .env and exports SECRET_KEY, MONGO_URI, PORT, etc.)
const { MONGO_URI, PORT } = require('./config/config');

// 2. Import other dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

// 3. Connect to MongoDB (using the URI from config)
connectDB(MONGO_URI);

// 4. Initialize Express
const app = express();

// 5. Apply global middlewares
app.use(cors());
app.use(bodyParser.json());

// 6. Register your routes
//    - Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

//    - Certificate routes
const certificateRoutes = require('./routes/certificate.routes');
app.use('/api/certificates', certificateRoutes);

// 7. Simple test route
app.get('/', (req, res) => {
  res.send('Hello from the Clyvysys Certificates backend!');
});

// 8. Start the server using the PORT from config (or default 5000)
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
