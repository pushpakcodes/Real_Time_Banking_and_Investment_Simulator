const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finsim');
    console.log('MongoDB Connected');
    
    const user = await User.findOne({ email: 'pushpakj7@gmail.com' });
    if (user) {
      console.log('User found:', user);
      // Optional: Delete the user to allow re-registration since their initialization might be incomplete
      // await User.deleteOne({ _id: user._id });
      // console.log('User deleted to allow re-registration');
    } else {
      console.log('User not found');
    }
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUser();
