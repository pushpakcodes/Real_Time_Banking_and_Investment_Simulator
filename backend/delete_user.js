const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const deleteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finsim');
    console.log('Connected to DB:', mongoose.connection.name);
    
    const users = await User.find({});
    console.log('All users:', users);

    const email = 'pushpakj7@gmail.com';
    const user = await User.findOne({ email });
    
    if (user) {
      await User.deleteOne({ _id: user._id });
      console.log(`User ${email} deleted successfully.`);
    } else {
      console.log(`User ${email} not found.`);
    }
    
    // Also delete testuser if exists
    await User.deleteOne({ email: 'test@test.com' });
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

deleteUser();
