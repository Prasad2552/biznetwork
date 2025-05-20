export interface PublishFormData {
    // Step 1: Contact Information
    firstName: string;
    lastName: string;
    jobTitle: string;
    businessEmail: string;
    personalEmail: string;
    contactNumber: string;
    city: string;
    pincode: string;
  
    // Step 2: Company Information
    companyName: string;
    companySize: string;
    companyDescription: string;
    companyLocation: {
      city: string;
      pincode: string;
    };
  
    // Step 3: Branding & Channel Details
    companyLogo: File | null;
    companyBanner: File | null;
    businessChannelName: string;
    channelDescription: string;
  
    // Step 4: Content Preferences
    primaryIndustry: string;
    secondaryIndustry: string;
    contentFocusArea: string;
    targetAudience: string;
    geographicFocus: string;
  
    // Step 5: Content Details
    contentPostingFrequency: string;
    typesOfContent: string[];
    specialRequirements: string;
  
    // Step 6: Final Details
    isExistingUser: boolean;
    additionalComments: string;
    agreeToTerms: boolean;
  }
  
  