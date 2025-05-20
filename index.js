const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Product = require('./models/product');
const User = require('./models/user'); // Import the User model

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public')); // Assuming you'll put your HTML in a 'public' folder
// Database connection 
mongoose.connect('mongodb://localhost:27017/mydatabase') 
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use(express.json()); 

// Product Routes (You can keep these or modify as needed)
app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body); 
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ... other product routes ...

// User Signup Route
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // 2. Hash the password
        const saltRounds = 10; 
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Create a new user document
        const newUser = new User({
            username,
            email,
            password: hashedPassword, 
        });

        // 4. Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// ... (You can add more routes for login, user profile, etc. here) ...

app.get('/', (req, res) => {
    res.send('Hello from Express.js!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});