import PrivacyPolicy from '../models/PrivacyPolicy.js';

// ==========================================
// GET PRIVACY POLICY (Single document)
// ==========================================
export const getPrivacyPolicy = async (req, res) => {
  try {
    let policy = await PrivacyPolicy.findOne();

    // If no policy exists, create default one
    if (!policy) {
      policy = new PrivacyPolicy({
        description: '<h2>Privacy Policy</h2><p>Add your privacy policy content here...</p>'
      });
      await policy.save();
    }

    res.status(200).json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Get Privacy Policy Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy policy'
    });
  }
};

// ==========================================
// UPDATE PRIVACY POLICY
// ==========================================
export const updatePrivacyPolicy = async (req, res) => {
  try {
    const { description } = req.body;

    // Validation
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Privacy policy content is required'
      });
    }

    // Get existing policy or create new
    let policy = await PrivacyPolicy.findOne();
    
    if (!policy) {
      policy = new PrivacyPolicy({ description });
    } else {
      policy.description = description;
    }

    await policy.save();

    res.status(200).json({
      success: true,
      message: 'Privacy policy updated successfully',
      data: policy
    });

  } catch (error) {
    console.error('Update Privacy Policy Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy policy',
      error: error.message
    });
  }
};

// ==========================================
// GET PRIVACY POLICY (For Frontend Display)
// ==========================================
export const getActivePrivacyPolicy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne();

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Get Privacy Policy Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy policy'
    });
  }
};