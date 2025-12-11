import mongoose from 'mongoose';
import User from './src/models/Users';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log('Connected to DB');
    const trainers = await User.find({ role: 'trainer' });
    console.log('Trainers found:', trainers.length);
    trainers.forEach(t => console.log('-', t.name, '(', t.username, ')'));
    
    const allUsers = await User.find({});
    console.log('Total users:', allUsers.length);
    allUsers.forEach(u => console.log('User:', u.name, 'Role:', u.role));
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
