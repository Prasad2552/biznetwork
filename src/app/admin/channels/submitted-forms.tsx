"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ImageWithRetry } from "@/components/image-with-retry"

interface SubmittedForm {
  _id: string
  firstName: string
  lastName: string
  jobTitle: string
  businessEmail: string
  personalEmail: string
  contactNumber: string
  city: string
  pincode: string
  companyName: string
  companySize: string
  companyDescription: string
  companyLogo: string | null
  companyBanner: string | null
  businessChannelName: string
  channelDescription: string
  primaryIndustry: string
  secondaryIndustry: string
  contentFocusArea: string
  targetAudience: string
  geographicFocus: string
  contentPostingFrequency: string
  typesOfContent?: string[]
  specialRequirements?: string
  isExistingUser: boolean
  additionalComments?: string
  agreeToTerms: boolean
  createdAt: string
  updatedAt: string
}

console.log("process.env:", process.env)

export function SubmittedForms() {
  const [forms, setForms] = useState<SubmittedForm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<SubmittedForm | null>(null)

  const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch("/api/admin/submitted-forms")
        if (response.ok) {
          const data = await response.json()
          setForms(data)
        } else {
          console.error("Failed to fetch submitted forms:", response)
          throw new Error("Failed to fetch submitted forms")
        }
      } catch (error) {
        toast.error("An error occurred while fetching submitted forms.")
        console.error("Error fetching submitted forms:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[600px] flex gap-4">
      <div className="w-1/3 overflow-auto">
        <ScrollArea className="h-full">
          {forms.length > 0 ? (
            <div className="space-y-4 pr-4">
              {forms.map((form) => (
                <Card
                  key={form._id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${selectedForm?._id === form._id ? "border-primary" : ""}`}
                  onClick={() => setSelectedForm(form)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{form.companyName}</CardTitle>
                    <CardDescription>
                      Submitted by {form.firstName} {form.lastName}
                      <br />
                      {formatDate(form.createdAt)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <Icons.inbox className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No submitted forms found</p>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>

      <div className="w-2/3">
        {selectedForm ? (
          <ScrollArea className="h-full">
            <Card>
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
                <CardDescription>Submitted on {formatDate(selectedForm.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="channel">Channel</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold mb-1">Name</h4>
                                                <p>{selectedForm.firstName} {selectedForm.lastName}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Job Title</h4>
                                                <p>{selectedForm.jobTitle}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Business Email</h4>
                                                <p>{selectedForm.businessEmail}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Personal Email</h4>
                                                <p>{selectedForm.personalEmail}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Contact Number</h4>
                                                <p>{selectedForm.contactNumber}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">Location</h4>
                                                <p>{selectedForm.city}, {selectedForm.pincode}</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                  <TabsContent value="company" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <h4 className="font-semibold mb-1">Company Name</h4>
                        <p>{selectedForm.companyName}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Company Size</h4>
                        <p>{selectedForm.companySize}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="font-semibold mb-1">Company Description</h4>
                        <p>{selectedForm.companyDescription}</p>
                      </div>
                      {/* Company Logo */}
                      <div className="col-span-2">
                        <h4 className="font-semibold mb-2">Company Logo</h4>
                        {selectedForm.companyLogo ? (
                          <div className="flex items-center">
                            <ImageWithRetry
                              imageUrl={selectedForm.companyLogo}
                              alt="Company Logo"
                              bucketName={bucketName}
                              width={200}
                              height={200}
                              objectFit="contain"
                            />
                            <a
                              href={selectedForm.companyLogo}
                              download
                              onClick={(e) => {
                                e.preventDefault()
                                window.location.href = `${selectedForm.companyLogo}?download=true`
                              }}
                              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No logo available</p>
                        )}
                      </div>
                      {/* Company Banner */}
                      <div className="col-span-2">
                        <h4 className="font-semibold mb-2">Company Banner</h4>
                        {selectedForm.companyBanner ? (
                          <div className="flex items-center">
                            <ImageWithRetry
                              imageUrl={selectedForm.companyBanner}
                              alt="Company Banner"
                              bucketName={bucketName}
                              width={600}
                              height={200}
                              objectFit="cover"
                            />
                            <a
                              href={selectedForm.companyBanner}
                              download
                              onClick={(e) => {
                                e.preventDefault()
                                window.location.href = `${selectedForm.companyBanner}?download=true`
                              }}
                              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No banner available</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="channel" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Business Channel Name</h4>
                        <p>{selectedForm.businessChannelName}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Channel Description</h4>
                        <p>{selectedForm.channelDescription}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-1">Primary Industry</h4>
                          <Badge variant="secondary">{selectedForm.primaryIndustry}</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Secondary Industry</h4>
                          <Badge variant="secondary">{selectedForm.secondaryIndustry}</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Content Focus Area</h4>
                        <p>{selectedForm.contentFocusArea}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Target Audience</h4>
                        <p>{selectedForm.targetAudience}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Geographic Focus</h4>
                        <p>{selectedForm.geographicFocus}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Content Posting Frequency</h4>
                        <p>{selectedForm.contentPostingFrequency}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Types of Content</h4>
                        <div className="flex gap-2">
                          {selectedForm.typesOfContent && selectedForm.typesOfContent.length > 0 ? (
                            selectedForm.typesOfContent.map((type) => (
                              <Badge key={type} variant="outline">
                                {type}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No content types specified</p>
                          )}
                        </div>
                      </div>
                      {selectedForm.specialRequirements && (
                        <div>
                          <h4 className="font-semibold mb-1">Special Requirements</h4>
                          <p>{selectedForm.specialRequirements}</p>
                        </div>
                      )}
                      {selectedForm.additionalComments && (
                        <div>
                          <h4 className="font-semibold mb-1">Additional Comments</h4>
                          <p>{selectedForm.additionalComments}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-full">
              <Icons.fileText className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Select a form to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

