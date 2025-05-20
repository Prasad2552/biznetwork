'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/ui/icons"

export default function CreateChannel() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null) // New state for banner image
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null) // New state for banner preview
  const [isLoading, setIsLoading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null) // Ref for banner input

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBanner(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    if (logo) {
      formData.append('logo', logo)
    }
    if (banner) {
      formData.append('banner', banner) // Append banner to form data
    }

    try {
      const response = await fetch('/api/admin/channels', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json();
        toast.success('Channel created successfully!')
        setTimeout(() => {
          router.push('/admin/channels');
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create channel. Please try again.');
        throw new Error(errorData.error || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer />
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Create New Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Channel Logo</Label>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Upload Logo
                </Button>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  onChange={handleLogoChange}
                />
                {logoPreviewUrl && (
                  <div className="relative w-16 h-16">
                    <Image
                      src={logoPreviewUrl}
                      alt="Logo preview"
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="banner">Channel Banner</Label>
              <div className="flex flex-col items-start space-y-2">
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    Upload Banner
                  </Button>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={bannerInputRef}
                    onChange={handleBannerChange}
                  />
                  {bannerPreviewUrl && (
                    <div className="relative w-32 h-16">
                      <Image
                        src={bannerPreviewUrl}
                        alt="Banner preview"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-md"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended aspect ratio: 16:9 (e.g., 1920x1080 pixels).
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Create Channel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}