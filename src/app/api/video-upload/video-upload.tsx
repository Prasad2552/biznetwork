//src\app\api\video-upload\video-upload.tsx

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  ImageIcon,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import "react-toastify/dist/ReactToastify.css";

const categoryOptions = {
  Technology: [
    "Information Technology (IT)",
    "Software as a Service (SaaS)",
    "Hardware",
    "Cloud Computing",
    "Cybersecurity",
    "Artificial Intelligence (AI)",
    "Blockchain",
    "Data Analytics",
    "Internet of Things (IoT)",
    "Telecommunications",
  ],
  Fintech: [
    "Digital Payments",
    "Cryptocurrency",
    "Insurtech",
    "WealthTech",
    "Lending & Credit",
    "RegTech",
    "Investment Platforms",
    "Personal Finance Management",
  ],
  MarTech: [
    "Customer Relationship Management (CRM)",
    "Marketing Automation",
    "Social Media Management",
    "Email Marketing",
    "Content Management Systems (CMS)",
    "AdTech (Advertising Technology)",
    "SEO Tools",
    "Influencer Marketing Platforms",
  ],
  HealthTech: [
    "Telemedicine",
    "Medical Devices",
    "Healthcare Analytics",
    "Electronic Health Records (EHR)",
    "Wearables & Health Monitoring",
    "Biotech",
    "Pharmaceuticals",
    "Health Insurance Tech",
  ],
  EdTech: [
    "Online Learning Platforms",
    "Learning Management Systems (LMS)",
    "Virtual Classrooms",
    "Tutoring & Test Prep",
    "Educational Content Providers",
    "Corporate Training Solutions",
    "K-12 & Higher Education Solutions",
  ],
  "E-commerce": [
    "Online Marketplaces",
    "Subscription Services",
    "Retail Tech",
    "D2C Brands",
    "Dropshipping",
    "Personalization Engines",
    "Logistics & Fulfillment Tech",
    "Payment Gateways",
  ],
  PropTech: [
    "Real Estate Marketplaces",
    "Property Management Software",
    "Smart Buildings & IoT",
    "Mortgage & Lending Solutions",
    "Co-living & Co-working Spaces",
    "Real Estate Analytics",
  ],
  Agritech: [
    "Precision Farming",
    "Agri Drones",
    "Farm Management Software",
    "Supply Chain Solutions",
    "Sustainable Agriculture",
    "Vertical Farming",
    "Agri-Fintech",
    "Agri-Biotech",
  ],
  "Energy & CleanTech": [
    "Renewable Energy",
    "Energy Storage",
    "Electric Vehicles (EV)",
    "Smart Grids",
    "Waste Management",
    "Carbon Capture",
    "Energy Efficiency Solutions",
  ],
  "Manufacturing & Industry 4.0": [
    "3D Printing",
    "Automation & Robotics",
    "Industrial IoT (IIoT)",
    "Supply Chain Management",
    "Smart Factories",
    "Quality Control Tech",
    "Industrial Software Solutions",
  ],
  "Consumer Goods & Retail": [
    "Fashion & Apparel",
    "Home Goods",
    "Beauty & Personal Care",
    "Food & Beverage",
    "Luxury Goods",
    "Sports & Fitness Equipment",
    "Toys & Games",
    "Consumer Electronics",
  ],
  "Travel & Hospitality": [
    "Online Travel Agencies (OTA)",
    "Hotel Management Software",
    "Airbnb & Short-term Rentals",
    "Travel Booking Platforms",
    "Hospitality Tech",
    "Cruise Lines",
    "Event Management",
    "Tourism Marketing",
  ],
  "Media & Entertainment": [
    "Streaming Services",
    "Gaming",
    "Digital Content Creation",
    "Music & Audio",
    "Film & TV Production",
    "Virtual Reality (VR) & Augmented Reality (AR)",
    "Publishing",
    "Sports Tech",
  ],
  Automotive: [
    "Vehicle Manufacturing",
    "Autonomous Vehicles",
    "Connected Car Technology",
    "Electric Vehicles",
    "Car Sharing & Ride-hailing",
    "Aftermarket Parts & Services",
    "Fleet Management",
    "Automotive Retail",
  ],
  "Logistics & Supply Chain": [
    "Warehousing Solutions",
    "Freight & Shipping",
    "Last-mile Delivery",
    "Inventory Management",
    "Supply Chain Analytics",
    "Cold Chain Logistics",
    "Transportation Management Systems (TMS)",
    "E-commerce Fulfillment",
  ],
  "Aerospace & Defense": [
    "Aviation Tech",
    "Defense Contractors",
    "Satellite Communications",
    "Space Exploration",
    "Unmanned Aerial Vehicles (UAVs)",
    "Cybersecurity for Defense",
    "Military Equipment & Tech",
  ],
  LegalTech: [
    "Document Management",
    "Contract Analysis",
    "E-discovery",
    "Legal Research",
    "Case Management",
    "Compliance Solutions",
    "Legal Analytics",
    "Online Legal Services",
  ],
  HRTech: [
    "Recruitment Platforms",
    "Employee Engagement",
    "Payroll & Benefits",
    "Workforce Management",
    "Learning & Development",
    "HR Analytics",
    "Talent Management",
    "Performance Management",
  ],
  "Construction & Real Estate": [
    "Construction Management Software",
    "Building Information Modeling (BIM)",
    "Smart Building Tech",
    "Construction Drones",
    "Modular Construction",
    "PropTech Integration",
    "Green Building Solutions",
  ],
  FoodTech: [
    "Meal Kits & Delivery",
    "Alternative Proteins",
    "Food Safety Tech",
    "Restaurant Tech",
    "AgriTech Integration",
    "Food Waste Reduction",
    "Smart Kitchen Appliances",
    "Food & Beverage Supply Chain",
  ],
  "Nonprofits & Social Impact": [
    "Fundraising Platforms",
    "Impact Investing",
    "Social Enterprise Solutions",
    "Volunteer Management",
    "Nonprofit CRM",
    "Grant Management",
    "Social Impact Measurement",
    "Crowdfunding Platforms",
  ],
  "Government & Public Sector": [
    "GovTech",
    "Public Safety Tech",
    "Smart Cities",
    "E-Government Solutions",
    "Public Health Tech",
    "Infrastructure Management",
    "Disaster Response Tech",
    "Citizen Engagement Platforms",
  ],
  "Education & Research": [
    "EdTech",
    "Academic Publishing",
    "Research Collaboration Tools",
    "Open Access Platforms",
    "Learning Analytics",
    "Virtual Labs",
    "Student Information Systems",
    "University Management Software",
  ],
  "Insurance (InsurTech)": [
    "Health Insurance",
    "Auto Insurance",
    "Life Insurance",
    "Property & Casualty",
    "Insurance Aggregators",
    "Claims Processing",
    "Insurance Analytics",
    "Risk Management",
  ],
  Telecommunications: [
    "Mobile Networks",
    "Broadband Services",
    "VoIP (Voice over Internet Protocol)",
    "5G Technology",
    "Telecom Equipment",
    "Fiber Optics",
    "Telecom Billing Solutions",
    "Satellite Communication",
  ],
  Healthcare: [
    "Telemedicine",
    "Medical Devices",
    "Pharma R&D",
    "Biotech",
    "Healthcare IT",
    "Pharmacy Tech",
    "Wellness & Fitness Tech",
    "Healthcare Data Analytics",
  ],
};

interface UploadProps {
  channelId: string;
  contentType?: string;
}

export default function VideoUpload({
  channelId,
  contentType = "video",
}: UploadProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null
  );
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

    const [eventImages, setEventImages] = useState<File[]>([]);
    const [eventImagePreviews, setEventImagePreviews] = useState<string[]>([]);

  const [videoDetails, setVideoDetails] = useState({
    title: "",
    description: "",
    categories: [] as string[],
  });

  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps } =
    useDropzone({
      accept: { "video/*": [] },
      maxFiles: 1,
      onDrop: (files) => handleVideoChange(files[0]),
    });

  const {
    getRootProps: getThumbnailRootProps,
    getInputProps: getThumbnailInputProps,
  } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => handleThumbnailChange(files[0]),
  });

        const { getRootProps: getEventImageRootProps, getInputProps: getEventImageInputProps } = useDropzone({
            accept: { 'image/*': [] },
            maxFiles: 5, // Allow up to 5 images
            onDrop: (acceptedFiles) => {
                setEventImages((prevFiles) => [...prevFiles, ...acceptedFiles]);
                setEventImagePreviews((prevPreviews) => [
                    ...prevPreviews,
                    ...acceptedFiles.map((file) => URL.createObjectURL(file)),
                ]);
            },
        });

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleVideoChange = (file: File | null) => {
    setVideoFile(file);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

    if (file) {
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);

      const video = document.createElement("video");
      video.src = url;
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoDuration(duration);

        // Enforce Shorts duration limit (e.g., 60 seconds)
        if (contentType === "shorts" && duration > 60) {
          toast.error("Shorts videos must be 60 seconds or less.");
          setVideoFile(null);
          setVideoPreviewUrl(null);
          setVideoDuration(null);
        }

        // Enforce Shorts aspect ratio (9:16) - example only, needs a real calculation
      };
    } else {
      setVideoPreviewUrl(null);
      setVideoDuration(null);
    }
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnailFile(file);
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);

    if (file) {
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    } else {
      setThumbnailPreviewUrl(null);
    }
  };

  const handleVideoDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setVideoDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = useCallback((subCategory: string) => {
    setVideoDetails((prev) => ({
      ...prev,
      categories: prev.categories.includes(subCategory)
        ? prev.categories.filter((cat) => cat !== subCategory)
        : [...prev.categories, subCategory],
    }));
  }, []);

        const handleRemoveEventImage = (indexToRemove: number) => {
            setEventImages((prevImages) => prevImages.filter((_, index) => index !== indexToRemove));
            setEventImagePreviews((prevPreviews) => prevPreviews.filter((_, index) => index !== indexToRemove));
        };

  const getUploadEndpoint = () => {
    const endpoints: { [key: string]: string } = {
      podcasts: "/api/podcasts/uploads",
      webinars: "/api/webinars/uploads",
      testimonials: "/api/testimonials/uploads",
      demos: "/api/demos/uploads",
      events: "/api/events/uploads",
      shorts: "/api/shorts/uploads", // Added Shorts endpoint
    };
    return endpoints[contentType] || "/api/videos/uploads";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !thumbnailFile) {
      toast.error("Please select both a video and thumbnail");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("thumbnail", thumbnailFile);
    formData.append("channelId", channelId);
    formData.append("duration", videoDuration?.toString() || "0");
    formData.append("contentType", contentType);
    formData.append("title", videoDetails.title);
    formData.append("description", videoDetails.description);
    formData.append("categories", JSON.stringify(videoDetails.categories));

            eventImages.forEach((image) => {
                formData.append('eventImages', image); // Append multiple event images
            });

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.response);
            toast.success(`${contentType} uploaded successfully!`);
            setTimeout(() => router.push(`/admin/dashboard/${channelId}`), 2000);
            resolve(data);
          } else {
            reject(xhr.statusText);
          }
        };

          xhr.onerror = () => reject("Network error");
          xhr.open("POST", getUploadEndpoint());
          xhr.send(formData);
      });
    } catch (error) {
      console.error(`Error uploading ${contentType}:`, error);
      toast.error(typeof error === "string" ? error : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const renderCategoryDropdowns = useMemo(
    () =>
      Object.entries(categoryOptions).map(([category, subCategories]) => (
        <Collapsible key={category}>
          <CollapsibleTrigger className="w-full p-4 bg-muted hover:bg-muted/80 rounded-lg transition-all">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{category}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {subCategories.map((subCategory) => (
                <Label
                  key={subCategory}
                  className={cn(
                    "flex items-center p-3 border rounded-md cursor-pointer transition-colors",
                    "hover:border-primary/50 active:scale-[98%] text-sm",
                    videoDetails.categories.includes(subCategory)
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/20"
                  )}
                >
                  <Checkbox
                    checked={videoDetails.categories.includes(subCategory)}
                    onCheckedChange={() => handleCategoryChange(subCategory)}
                    className="mr-2 h-4 w-4"
                  />
                  {subCategory}
                </Label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )),
    [videoDetails.categories, handleCategoryChange]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">
              Upload {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground/80">
            Fill in the details below to publish your content
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Media Uploads */}
            <div className="space-y-6">
              {/* Video Upload Section */}
              <div>
                <Label className="block mb-3 text-sm font-medium">Video Content *</Label>
                <div
                  {...getVideoRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-muted/30",
                    videoFile
                      ? "border-green-500 bg-green-500/5"
                      : "border-muted-foreground/30"
                  )}
                >
                  <input {...getVideoInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium mb-1">
                        {videoFile ? videoFile.name : "Drag video file here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {videoFile
                          ? "Click to replace file"
                          : "Supports: MP4, MOV, AVI • Max 2GB"}
                      </p>
                      {contentType === "shorts" && (
                        <p className="text-sm text-muted-foreground">
                          Vertical Aspect Ratio (9:16) Recommended
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {videoPreviewUrl && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
                    <video
                      ref={videoRef}
                      src={videoPreviewUrl}
                      controls
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {videoDuration && formatDuration(videoDuration)}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Upload Section */}
              <div>
                <Label className="block mb-3 text-sm font-medium">
                  Thumbnail Image *
                </Label>
                <div
                  {...getThumbnailRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-muted/30",
                    thumbnailFile
                      ? "border-green-500 bg-green-500/5"
                      : "border-muted-foreground/30"
                  )}
                >
                  <input {...getThumbnailInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium mb-1">
                        {thumbnailFile
                          ? thumbnailFile.name
                          : "Drag thumbnail image here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {thumbnailFile
                          ? "Click to replace image"
                          : "Supports: JPG, PNG • Max 5MB"}
                      </p>
                       {contentType === "shorts" && (
                                            <p className="text-sm text-muted-foreground">
                                              Vertical Aspect Ratio (9:16) Recommended
                                            </p>
                                          )}
                    </div>
                  </div>
                </div>

                {thumbnailPreviewUrl && (
                  <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
                    <Image
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setThumbnailFile(null)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

                        {/* Event Images Upload Section (Conditional Rendering) */}
                        {contentType === 'events' && (
                            <div>
                                <Label className="block mb-3 text-sm font-medium">Event Images (Optional)</Label>
                                <div
                                    {...getEventImageRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors",
                                        "hover:border-primary hover:bg-muted/30",
                                        eventImages.length > 0 ? "border-green-500 bg-green-500/5" : "border-muted-foreground/30"
                                    )}
                                >
                                    <input {...getEventImageInputProps()} />
                                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium mb-1">
                                                {eventImages.length > 0 ? `${eventImages.length} images selected` : "Drag event images here"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Supports: JPG, PNG • Max 5 images
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Display image previews */}
                                {eventImagePreviews.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {eventImagePreviews.map((preview, index) => (
                                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                                <Image
                                                    src={preview}
                                                    alt={`Event image ${index}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEventImage(index)}
                                                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <Label className="block mb-2 text-sm font-medium">Title *</Label>
                <Input
                  name="title"
                  value={videoDetails.title}
                  onChange={handleVideoDetailsChange}
                  placeholder="Enter your content title"
                  className="h-12 text-base"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <Label className="block mb-2 text-sm font-medium">Description</Label>
                <Textarea
                  name="description"
                  value={videoDetails.description}
                  onChange={handleVideoDetailsChange}
                  placeholder="Add a detailed description..."
                  rows={5}
                  className="text-base resize-none"
                />
              </div>

              {/* Categories Section */}
              <div>
                <Label className="block mb-3 text-sm font-medium">Categories *</Label>
                <div className="space-y-3">
                  {renderCategoryDropdowns}

                  {videoDetails.categories.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Selected categories:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {videoDetails.categories.map((category) => (
                          <span
                            key={category}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isUploading}
                className="w-full h-12 text-base relative overflow-hidden transition-all"
              >
                {isUploading ? (
                  <>
                    <div
                      className="absolute left-0 top-0 h-full bg-primary/20 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading ({uploadProgress}%)
                  </>
                ) : (
                  `Publish ${contentType}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}