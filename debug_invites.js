import mongoose from 'mongoose';
import Membership from './server/src/models/Membership.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function checkInvites() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const invites = await Membership.find({ inviteStatus: 'pending' }).populate('userId', 'email');
    console.log('Pending Invites:', JSON.stringify(invites, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInvites();
