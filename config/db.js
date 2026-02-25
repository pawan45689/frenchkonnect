import mongoose from "mongoose";
import dns from 'dns';

// Set DNS to Google's public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGO_URL, options);
    
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\n💡 Try these fixes:');
      console.error('   1. Change MONGO_URL to standard connection (not srv+mongodb)');
      console.error('   2. Check MongoDB Atlas Network Access');
      console.error('   3. Flush DNS: ipconfig /flushdns\n');
    }
    
    process.exit(1);
  }
};

export default connectDB;