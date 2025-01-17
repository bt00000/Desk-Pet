require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5001; // Backend server port

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Allow React requests

// MongoDB connection
mongoose.connect('mongodb://localhost/myapp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 1 },
  password: { type: String, required: true, minlength: 3 },
  rewards: { type: [String], default: [] }, // List of claimed rewards
});

const User = mongoose.model('User', userSchema);

// Environment secret for JWT
const secret = process.env.SECRET || 'defaultsecret';

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the DeskPet API!');
});

// Registration route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 1) {
    return res.status(400).json({ message: 'Username must be at least 1 characters long' });
  }

  if (password.length < 3) {
    return res.status(400).json({ message: 'Password must be at least 3 characters long' });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(200).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Token without expiration
  const token = jwt.sign({ id: user._id }, secret);
  res.status(200).json({ token });
});


// Fetch rewards route
app.get('/rewards', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ rewards: user.rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim reward route
app.post('/claim-reward', async (req, res) => {
  const { reward } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.rewards.includes(reward)) {
      return res.status(400).json({ error: `${reward} already claimed` });
    }

    user.rewards.push(reward);
    await user.save();
    res.status(200).json({ message: `${reward} claimed successfully`, rewards: user.rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset reward route
app.post('/reset-reward', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.rewards = user.rewards.filter((reward) => reward !== 'Computer'); // Reset specific reward
    await user.save();
    res.status(200).json({ message: 'Reward reset successfully', rewards: user.rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
