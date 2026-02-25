import mongoose from 'mongoose';

const privacyPolicySchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Privacy policy content is required']
    }
  },
  {
    timestamps: true
  }
);

const PrivacyPolicy = mongoose.model('PrivacyPolicy', privacyPolicySchema);

export default PrivacyPolicy;