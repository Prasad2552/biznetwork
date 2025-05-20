import mongoose, { Schema, Document } from 'mongoose';

export interface IPublishForm extends Document {
    firstName: string;
    lastName: string;
    jobTitle: string;
    businessEmail: string;
    personalEmail: string;
    contactNumber: string;
    city: string;
    pincode: string;
    companyName: string;
    companySize: string;
    companyDescription: string;
    companyLogo: string | null;
    companyBanner: string | null;
    businessChannelName: string;
    channelDescription: string;
    primaryIndustry: string;
    secondaryIndustry: string;
    contentFocusArea: string;
    targetAudience: string;
    geographicFocus: string;
    contentPostingFrequency: string;
    typesOfContent: string[];
    specialRequirements: string;
    isExistingUser: boolean;
    additionalComments: string;
    agreeToTerms: boolean;
}

const PublishFormSchema: Schema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    businessEmail: { type: String, required: true },
    personalEmail: { type: String, required: true },
    contactNumber: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    companyName: { type: String, required: true },
    companySize: { type: String, required: true },
    companyDescription: { type: String, required: true },
    companyLogo: { type: String, default: null },
    companyBanner: { type: String, default: null },
    businessChannelName: { type: String, required: true },
    channelDescription: { type: String, required: true },
    primaryIndustry: { type: String, required: true },
    secondaryIndustry: { type: String, required: true },
    contentFocusArea: { type: String, required: true },
    targetAudience: { type: String, required: true },
    geographicFocus: { type: String, required: true },
    contentPostingFrequency: { type: String, required: true },
    typesOfContent: { type: [String], required: true },
    specialRequirements: { type: String },
    isExistingUser: { type: Boolean, required: true },
    additionalComments: { type: String },
    agreeToTerms: { type: Boolean, required: true },
}, { timestamps: true });

export default mongoose.models.PublishForm || mongoose.model<IPublishForm>('PublishForm', PublishFormSchema);