const router = require('express').Router();
const Users = require('../models/users');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '../.env' });

router.post('/', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    const newUser = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone,
      level: 1,
    };

    await Users.create(newUser);

    res.status(201).json({ error: false, message: 'Add data successfully.' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  const loginIdentifier = req.body.identifier;

  try {
    const user = await Users.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    });

    if (user) {
      const passwordMatch = await bcrypt.compare(req.body.password, user.password);

      if (passwordMatch) {
        res.status(200).json({ error: false, message: 'User login sucessfully', data: user });
      } else {
        res.status(401).json({ error: true, message: 'Invalid password' });
      }
    } else {
      res.status(401).json({ error: true, message: 'Invalid email or username' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// router.get('/', async (req, res) => {
//   try {
//     let users = await Users.find();

//     res.status(200).json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: true, message: 'Internal Server Error' });
//   }
// });

router.delete('/:id', async (req, res) => {
  try {
    const user = await Users.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.status(200).json({ error: false, message: 'Delete user successfully.' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    let users = await Users.findById(req.params.id);

    const data = {
      name: req.body.name || users.name,
      Users: req.body.users || users.Users,
      timeStamp: getDate(),
    };

    users = await Users.findByIdAndUpdate(req.params.id, data, { new: true });

    res.status(201).json({ error: false, message: 'Edit data successfully.' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // Find user by id
    let users = await Users.findById(req.params.id);
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

module.exports = router;