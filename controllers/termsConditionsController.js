import TermsConditions from '../models/TermsConditions.js';

export const getTermsConditions = async (req, res) => {
  try {
    let terms = await TermsConditions.findOne();

    if (!terms) {
      terms = new TermsConditions({
        description: '<h2>Terms & Conditions</h2><p>Add your terms & conditions content here...</p>'
      });
      await terms.save();
    }

    res.status(200).json({
      success: true,
      data: terms
    });

  } catch (error) {
    console.error('Get Terms & Conditions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms & conditions'
    });
  }
};

export const updateTermsConditions = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Terms & Conditions content is required'
      });
    }

    let terms = await TermsConditions.findOne();

    if (!terms) {
      terms = new TermsConditions({ description });
    } else {
      terms.description = description;
    }

    await terms.save();

    res.status(200).json({
      success: true,
      message: 'Terms & Conditions updated successfully',
      data: terms
    });

  } catch (error) {
    console.error('Update Terms & Conditions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update terms & conditions',
      error: error.message
    });
  }
};