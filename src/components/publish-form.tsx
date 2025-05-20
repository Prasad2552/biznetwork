//src\components\publish-form.tsx

'use client'

import React, { useState, useCallback, useEffect, startTransition } from 'react' //Import startTransition
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { ProgressSteps } from './progress-steps'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Image from 'next/image'
import type { PublishFormData } from '@/types/publish-form'
import { sendEmail } from '@/actions/sendEmail'
import { useActionState } from 'react'
import ReactSelect from 'react-select';
import { SuccessModal } from './success-modal'

const formSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    jobTitle: z.string().min(1, 'Job title is required'),
    businessEmail: z.string().email('Invalid business email address'),
    personalEmail: z.string().email('Invalid personal email address'),
    contactNumber: z.string().min(1, 'Contact number is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(1, 'Pincode is required'),
    companyName: z.string().min(1, 'Company name is required'),
    companyLocation: z.string().optional(),
    companySize: z.string().min(1, 'Company size is required'),
    companyDescription: z.string().min(1, 'Company description is required'),
    companyLogo: z.any().optional(),
    companyBanner: z.any().optional(),
    businessChannelName: z.string().min(1, 'Business channel name is required'),
    channelDescription: z.string().min(1, 'Channel description is required'),
    primaryIndustry: z.string().min(1, 'Primary industry is required'),
    secondaryIndustry: z.string().min(1, 'Secondary industry is required'),
    contentFocusArea: z.string().min(1, 'Content focus area is required'),
    targetAudience: z.string().min(1, 'Target audience is required'),
    geographicFocus: z.string().min(1, 'Geographic focus is required'),
    contentPostingFrequency: z.string().min(1, 'Content posting frequency is required'),
    typesOfContent: z.array(z.string()).min(1, 'At least one content type is required'),
    specialRequirements: z.string().optional(),
    isExistingUser: z.boolean(),
    additionalComments: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
})

const contentTypes = [
    { value: 'articles', label: 'Articles' },
    { value: 'videos', label: 'Videos' },
    { value: 'podcasts', label: 'Podcasts' },
    { value: 'infographics', label: 'Infographics' },
];



export function PublishForm() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [, formAction] = useActionState(sendEmail, null);
     const [isModalOpen, setIsModalOpen] = useState(false);


    const form = useForm<PublishFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            isExistingUser: false,
            agreeToTerms: false,
            typesOfContent: [],
             contentPostingFrequency: '',
        },
    })

    const { formState: { errors } } = form;
    const contentPostingFrequency = useWatch({ control: form.control, name: 'contentPostingFrequency' });
       const typesOfContent = useWatch({ control: form.control, name: 'typesOfContent' });

    useEffect(() => {
        console.log('Form errors:', errors)
    }, [errors])

    const renderError = (fieldName: keyof PublishFormData) => {
        const error = errors[fieldName]
        return error ? (
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
        ) : null
    }
       

   const onSubmit = async (data: PublishFormData) => {
        setIsSubmitting(true);
        try {
            const validatedData = await formSchema.parseAsync(data);

            const formData = new FormData();
            const location = `${validatedData.city}, ${validatedData.pincode}`;
            formData.append('location', location);

            for (const [key, value] of Object.entries(validatedData)) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (Array.isArray(value)) {
                    value.forEach((item) => formData.append(key, item));
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            }

            console.log('Submitting form data:', Object.fromEntries(formData));

            const response = await fetch('/api/publish-form', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log('Form submitted successfully:', result)

            if (!response.ok) {
                throw new Error(result.error || 'Form submission failed');
            }
             formData.append('formId', result.formId)

             startTransition(async () => { // Wrap formAction in startTransition
               const emailResult =  await formAction(formData);
               console.log("Email action result:", emailResult)
                toast.success("Your form has been submitted successfully.");
                setIsModalOpen(true);
                 form.reset();
                setStep(1);
              })

        } catch (error: unknown) {
            console.error('Error submitting form:', error);
            if (error instanceof z.ZodError) {
                error.errors.forEach((err) => {
                    toast.error(`${err.path.join('.')} - ${err.message}`);
                });
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

     const closeModal = () => {
        setIsModalOpen(false)
     };

    const nextStep = () => {
        const currentFields = Object.keys(form.getValues()).filter(
            key => form.getFieldState(key as keyof PublishFormData).isDirty
        )
        form.trigger(currentFields as (keyof PublishFormData)[])
        const currentStepIsValid = currentFields.every(field => !form.getFieldState(field as keyof PublishFormData).error)

        if (currentStepIsValid) {
            setStep((prev) => Math.min(prev + 1, 6))
        } else {
            // Display errors for the current step
            Object.keys(errors).forEach((key) => {
                toast.error(`${key}: ${errors[key as keyof PublishFormData]?.message}`)
            })
        }
    }

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1))
    }

    const handleDrop = useCallback((fieldName: 'companyLogo' | 'companyBanner') => (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer.files[0]
        if (file) {
            form.setValue(fieldName, file)
        }
    }, [form])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const renderFilePreview = (fieldName: 'companyLogo' | 'companyBanner') => {
        const file = form.watch(fieldName)
        if (!file) return null

        return (
            <div className="mt-2">
                <p className="text-sm font-medium mb-1">{fieldName === 'companyLogo' ? 'Logo' : 'Banner'} Preview:</p>
                <Image
                    src={URL.createObjectURL(file)}
                    alt={`${fieldName} preview`}
                    width={100}
                    height={100}
                    className="rounded-md"
                />
            </div>
        )
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl mb-6 text-center">Contact Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="First Name"
                                    {...form.register('firstName')}
                                />
                                {renderError('firstName')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="Last Name"
                                    {...form.register('lastName')}
                                />
                                {renderError('lastName')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="Job Title"
                                    {...form.register('jobTitle')}
                                />
                                {renderError('jobTitle')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    type="email"
                                    placeholder="Business Email Address"
                                    {...form.register('businessEmail')}
                                />
                                {renderError('businessEmail')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    type="email"
                                    placeholder="Personal Email Address"
                                    {...form.register('personalEmail')}
                                />
                                {renderError('personalEmail')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="Contact Number"
                                    {...form.register('contactNumber')}
                                />
                                {renderError('contactNumber')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="City, State/Province"
                                    {...form.register('city')}
                                />
                                {renderError('city')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="Pincode"
                                    {...form.register('pincode')}
                                />
                                {renderError('pincode')}
                            </div>
                        </div>
                    </div>
                    
                )

            case 2:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl mb-6 text-center">Company Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    className="bg-[#E1E1E1]"
                                    placeholder="Company Name"
                                    {...form.register('companyName')}
                                />
                                {renderError('companyName')}
                            </div>
                            <div>
                                <Select onValueChange={(value) => form.setValue('companySize', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Company Employee Size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10</SelectItem>
                                        <SelectItem value="11-50">11-50</SelectItem>
                                        <SelectItem value="51-200">51-200</SelectItem>
                                        <SelectItem value="201-500">201-500</SelectItem>
                                        <SelectItem value="501+">501+</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('companySize')}
                            </div>
                            <div className="col-span-2">
                                <Textarea
                                    className="bg-[#E1E1E1]"
                                    placeholder="Company Description"
                                    {...form.register('companyDescription')}
                                />
                                {renderError('companyDescription')}
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl mb-6 text-center">Branding & Channel Details</h2>
                        <div className="grid grid-cols-2 gap-4 ">
                            <div className="space-y-2 ">
                                <p className="text-sm font-medium ">Company Logo</p>
                                <div
                                    className="border-2 border-dashed border-[#828282] rounded-2xl p-8 text-center bg-[#F3F4F6] cursor-pointer"
                                    onDrop={handleDrop('companyLogo')}
                                    onDragOver={handleDragOver}
                                    onClick={() => document.getElementById('companyLogo')?.click()}
                                >
                                    <Input
                                        id="companyLogo"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                form.setValue('companyLogo', file)
                                            }
                                        }}
                                    />
                                    <p className="text-sm text-gray-500">Click to browse or drag and drop your files</p>
                                </div>
                                {renderFilePreview('companyLogo')}
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Company Banner</p>
                                <div
                                    className="border-2 border-dashed border-[#828282] rounded-2xl p-8 text-center bg-[#F3F4F6] cursor-pointer"
                                    onDrop={handleDrop('companyBanner')}
                                    onDragOver={handleDragOver}
                                    onClick={() => document.getElementById('companyBanner')?.click()}
                                >
                                    <Input
                                        id="companyBanner"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                form.setValue('companyBanner', file)
                                            }
                                        }}
                                    />
                                    <p className="text-sm text-gray-500">Click to browse or drag and drop your files</p>
                                </div>
                                {renderFilePreview('companyBanner')}
                            </div>
                            <div>
                                <Input
                                    className="bg-[#F3F4F6]"
                                    placeholder="Business Channel Name"
                                    {...form.register('businessChannelName')}
                                />
                                {renderError('businessChannelName')}
                            </div>
                            <div>
                                <Textarea
                                    className="bg-[#F3F4F6]"
                                    placeholder="Channel Description"
                                    {...form.register('channelDescription')}
                                />
                                {renderError('channelDescription')}
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl mb-6 text-center">Content Preferences & Audience Targeting</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Select onValueChange={(value) => form.setValue('primaryIndustry', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Primary Industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technology">Technology</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('primaryIndustry')}
                            </div>
                            <div>
                                <Select onValueChange={(value) => form.setValue('secondaryIndustry', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Secondary Industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="technology">Technology</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('secondaryIndustry')}
                            </div>
                            <div>
                                <Select onValueChange={(value) => form.setValue('contentFocusArea', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Content Focus Area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">Product</SelectItem>
                                        <SelectItem value="service">Service</SelectItem>
                                        <SelectItem value="thought-leadership">Thought Leadership</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('contentFocusArea')}
                            </div>
                            <div>
                                <Select onValueChange={(value) => form.setValue('targetAudience', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Target Audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="business">Business Decision Makers</SelectItem>
                                        <SelectItem value="technical">Technical Decision Makers</SelectItem>
                                        <SelectItem value="end-users">End Users</SelectItem>
                                        <SelectItem value="developers">Developers</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('targetAudience')}
                            </div>
                            <div className="col-span-2">
                                <Select onValueChange={(value) => form.setValue('geographicFocus', value)}>
                                    <SelectTrigger className="bg-[#E1E1E1]">
                                        <SelectValue placeholder="Geographic Focus of Audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">Global</SelectItem>
                                        <SelectItem value="regional">Regional</SelectItem>
                                        <SelectItem value="local">Local</SelectItem>
                                    </SelectContent>
                                </Select>
                                {renderError('geographicFocus')}
                            </div>
                        </div>
                    </div>
                )

             case 5:
                  return (
                      <div className="space-y-6">
                          <h2 className="text-2xl mb-6 text-center">Content Frequency & Types</h2>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Select onValueChange={(value) => form.setValue('contentPostingFrequency', value)}>
                                        <SelectTrigger className="bg-[#E1E1E1]">
                                          <SelectValue placeholder={contentPostingFrequency  ||  "Content Posting Frequency"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                              <SelectItem value="daily">Daily</SelectItem>
                                              <SelectItem value="weekly">Weekly</SelectItem>
                                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                              <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                  </Select>
                                  {renderError('contentPostingFrequency')}
                              </div>
                              <div className="col-span-1">
                                  <div className="space-y-4">
                                        <p className="text-sm font-medium">Types of Content</p>
                                        <ReactSelect
                                              isMulti
                                              options={contentTypes}
                                              value={contentTypes.filter(option => typesOfContent?.includes(option.value))}
                                              onChange={(selectedOptions) => form.setValue('typesOfContent', selectedOptions.map(option => option.value))}
                                             classNames={{
                                              control: (state) =>  'bg-[#E1E1E1] border-transparent focus:border-primary focus:ring-0',
                                                   menu: () => 'bg-[#E1E1E1] border-transparent',
                                               }}
                                           />
                                        {renderError('typesOfContent')}
                                    </div>
                             </div>
                              <div className="col-span-2">
                                  <Textarea
                                      className="bg-[#E1E1E1]"
                                      placeholder="Special Requirements"
                                      {...form.register('specialRequirements')}
                                  />
                                  {renderError('specialRequirements')}
                              </div>
                          </div>
                      </div>
                  )

            case 6:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl mb-6 text-center">Final Details & Submissions</h2>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <p className="mb-4">Are you already a BizNetworQ User?</p>
                                <RadioGroup
                                    onValueChange={(value) => form.setValue('isExistingUser', value === 'yes')}
                                    className="flex space-x-8"
                                >
                                    <div className="flex space-x-2">
                                        <RadioGroupItem value="yes" id="yes" />
                                        <span>Yes</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no" id="no" />
                                        <span>No</span>
                                    </div>
                                </RadioGroup>
                                {renderError('isExistingUser')}
                            </div>

                            <div>
                                <Textarea
                                    className="bg-[#E1E1E1]"
                                    placeholder="Additional Comments"
                                    {...form.register('additionalComments')}
                                />
                                {renderError('additionalComments')}
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-black">
                                    After submitting this form, a BizNetworQ team member will reach out to align on your needs and schedule a brief
                                    15-minute call.
                                </p>

                                <div className="flex space-x-2">
                                    <Checkbox
                                        id="terms"
                                        checked={form.watch('agreeToTerms')}
                                        onCheckedChange={(checked) => form.setValue('agreeToTerms', checked as boolean)}
                                    />
                                    <span className="text-sm">I Agree Terms & Conditions</span>
                                </div>
                                {renderError('agreeToTerms')}
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <form  onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
            {Object.keys(errors).length > 0 && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">There are errors in your form submission.</strong>
                    <span className="block sm:inline"> Please check the fields below and try again.</span>
                </div>
            )}
            <h1 className="text-3xl font-bold mb-8">Publish With Us</h1>
            <div className="bg-gray-100 rounded-lg border border-['#AAAA'] p-6">
                <ProgressSteps currentStep={step} totalSteps={6} />
                
                  <SuccessModal isOpen={isModalOpen} onClose={closeModal} />
                {renderStep()}

                <div className="flex justify-between mt-8">
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                            Back
                        </Button>
                    )}
                    {step < 6 ? (
                        <Button
                            type="button"
                            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={nextStep}
                            disabled={isSubmitting}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!form.watch('agreeToTerms') || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Done'}
                        </Button>
                    )}
                </div>
            </div>
            <ToastContainer position="top-center" autoClose={3000} />
        </form>
    )
}

