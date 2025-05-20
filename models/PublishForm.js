const mongoose = require('mongoose');

const publishFormSchema = new mongoose.Schema({
  // Step 1: Contact Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  businessEmail: { type: String, required: true },
  personalEmail: { type: String, required: true },
  contactNumber: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },

  // Step 2: Company Information
  companyName: { type: String, required: true },
  companySize: { type: String, required: true },
  companyDescription: { type: String, required: true },

  // Step 3: Branding & Channel Details
  companyLogo: { type: String }, // Store file path or URL
  companyBanner: { type: String }, // Store file path or URL
  businessChannelName: { type: String, required: true },
  channelDescription: { type: String, required: true },

  // Step 4: Content Preferences
  primaryIndustry: { type: String, required: true },
  secondaryIndustry: { type: String, required: true },
  contentFocusArea: { type: String, required: true },
  targetAudience: { type: String, required: true },
  geographicFocus: { type: String, required: true },

  // Step 5: Content Details
  contentPostingFrequency: { type: String, required: true },
  typesOfContent: [{ type: String, required: true }],
  specialRequirements: { type: String },

  // Step 6: Final Details
  isExistingUser: { type: Boolean, required: true },
  additionalComments: { type: String },
  agreeToTerms: { type: Boolean, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PublishForm', publishFormSchema);

