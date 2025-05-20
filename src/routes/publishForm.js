import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import PublishForm from '../models/PublishForm'; // Adjust path as necessary

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        try {
            await fs.access(uploadDir);
        } catch (e) {
            if (e.code === 'ENOENT') {
                await fs.mkdir(uploadDir, { recursive: true });
            } else {
                console.error('Error creating upload directory:', e);
                return cb(e);  // Important: Pass the error to multer
            }
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only!'));
        }
    }
});

router.post('/', upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'companyBanner', maxCount: 1 }
]), async (req, res) => {
    try {
        const formData = req.body;

        // Handle file uploads.  Use try...catch around each one in case of errors.
        try {
            if (req.files?.companyLogo) {
                formData.companyLogo = req.files.companyLogo[0].path;
            }
        } catch (e) {
            console.error("Error processing companyLogo:", e);
            return res.status(400).json({ message: "Error processing company logo upload.", error: e.message });
        }

        try {
            if (req.files?.companyBanner) {
                formData.companyBanner = req.files.companyBanner[0].path;
            }
        } catch (e) {
            console.error("Error processing companyBanner:", e);
            return res.status(400).json({ message: "Error processing company banner upload.", error: e.message });
        }



        // Convert string 'true'/'false' to boolean
        formData.isExistingUser = formData.isExistingUser === 'true';
        formData.agreeToTerms = formData.agreeToTerms === 'true';

        // Convert typesOfContent to array if it's a string
        if (typeof formData.typesOfContent === 'string') {
            formData.typesOfContent = [formData.typesOfContent];
        }

        // Validate required fields
        const requiredFields = [
            'firstName', 'lastName', 'jobTitle', 'businessEmail', 'personalEmail',
            'contactNumber', 'city', 'pincode', 'companyName', 'companySize',
            'companyDescription', 'businessChannelName', 'channelDescription',
            'primaryIndustry', 'secondaryIndustry', 'contentFocusArea',
            'targetAudience', 'geographicFocus', 'contentPostingFrequency',
            'typesOfContent', 'isExistingUser', 'agreeToTerms'
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }

        const newPublishForm = new PublishForm(formData);
        await newPublishForm.save();

        res.status(201).json({
            message: 'Form submitted successfully',
            formId: newPublishForm._id
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ message: 'Error submitting form', error: error.message });
    }
});

export default router; // Use export default for ES modules