import mongoose from 'mongoose';

const termsConditionsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Terms & Conditions content is required']
    }
  },
  {
    timestamps: true
  }
);

const TermsConditions = mongoose.model('TermsConditions', termsConditionsSchema);

export default TermsConditions;