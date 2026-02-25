import mongoose from 'mongoose';

const dropIndex = async () => {
  try {
    await mongoose.connect('mongodb+srv://pawan:pawan@cluster0.ycluh.mongodb.net/college?retryWrites=true&w=majority&appName=Cluster0');
    
    console.log(' Connected to MongoDB');
    
    // Drop the old index
    const result = await mongoose.connection.db.collection('users').dropIndex('googleId_1');
    
    console.log('googleId_1 index dropped successfully');
    console.log(' Restart your server to create new sparse index');
    
    process.exit(0);
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log(' Index already dropped or does not exist');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
};

dropIndex();