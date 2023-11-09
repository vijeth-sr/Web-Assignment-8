const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const port = 5000;
console.log("Testing");

const app = express();
app.use(express.json());


const atlasUri = "mongodb+srv://vijeths:AXZqEhbILG14Bh3E@cluster0.h9ppyhg.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(atlasUri)
  .then(() => {
    app.listen(port,()=>{console.log('MongoDB connected...');
  });
})
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define a user schema and model
const userSchema = new mongoose.Schema({
  fullName: String,
  email: {
    type: String,
    unique: true, // ensures email is unique 
  },
  password: String,
});



const User = mongoose.model('User', userSchema);

// POST /user/create endpoint
app.post('/user/create', [
  body('fullName').isLength({ min: 3 }).withMessage('Full name must be at least 3 characters long'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isStrongPassword().withMessage('Password must be strong')
], async (req, res) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check for existing user
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(400).json({ errors: [{ msg: 'Email already in use' }] });
  }

  // Hashing password
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  // Create and save the user
  const user = new User({
    fullName: req.body.fullName,
    email: req.body.email,
    password: hashedPassword,
  });

  try {
    await user.save();
    res.status(201).send({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).send({ errors: [{ msg: 'There was a problem saving the user' }] });
  }
});



// PUT /user/edit endpoint
app.put('/user/edit', [
  body('email').isEmail().withMessage('Invalid email address format').normalizeEmail(),
  body('fullName').isLength({ min: 3 }).withMessage('Full name must be at least 3 characters long'),
  body('password').isStrongPassword().withMessage('Password must be strong')
], async (req, res) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Extract email, full name, and password from the request body
  const { email, fullName, password } = req.body;

  try {
    // Look for the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Update the user's full name and password
    user.fullName = fullName;
    user.password = await bcrypt.hash(password, 10); // hash the new password
    
    // Save the updated user information
    await user.save();
    
    // Respond with a success message
    res.status(200).send({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Error updating user' });
  }
});


// DELETE /user/delete endpoint
app.delete('/user/delete', [
  body('email').isEmail().withMessage('Invalid email address format').normalizeEmail(),
], async (req, res) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Extract email from the request body
  const { email } = req.body;

  try {
    // Look for the user by email and delete
    const user = await User.findOneAndDelete({ email: email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Respond with a success message
    res.status(200).send({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).send({ message: 'Error deleting user' });
  }
});

// GET /user/getall endpoint to retrieve all users
app.get('/user/getall', async (req, res) => {
  try {
    // Retrieve all users' information from the database
    const users = await User.find({}, 'fullName email password -_id'); // Selects only the fullName, email, and password fields, excludes the _id field
    // Send the users information in response
    res.status(200).json(users);
  } catch (err) {
    // If an error occurs, send an error message in response
    res.status(500).json({ message: 'Error retrieving users', error: err });
  }
});


