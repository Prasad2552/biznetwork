'use client'
import React, { useState } from 'react';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import Link from 'next/link';
import { useForm } from 'react-hook-form'; 
import { Textarea } from '@/components/ui/textarea'

const sidebarItems = [
  { name: 'Publish With Us', href: '/publish' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
  { name: 'Send Feedback', href: '/feedback' },
];

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Advertise', href: '/advertise' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'How BizNetworQ Works', href: '/howitworks' },
];

export default function ContactUsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Contact Us');
  const [activeNavItem] = useState('All');
  const [isLoggedIn] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log("Form data submitted:", data);
    // Implement your form submission logic (e.g., API call)
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
     <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeSidebarItem={activeSidebarItem}
          setActiveSidebarItem={setActiveSidebarItem}
        />
      <div className="flex-1 overflow-hidden">
        <Header  toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} isLoggedIn={isLoggedIn}/>
        <main className="container mx-auto px-4 py-8 overflow-y-auto">
          <section className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <div className="mb-6 md:mb-0 md:mr-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-4">Contact us</h1>
                <p className="text-black max-w-3xl text-sm md:text-base">
                  If you&apos;re looking for support, please visit our Help Center, where you&apos;ll find answers to
                  common questions about using BizNetworQ, accessing content, and managing your
                  account.
                </p>
              </div>
              <Image 
                src="/uploads/Online-rafiki-bg.png"
                alt="Contact Header Illustration"
                width={320}
                height={170}
                className="w-full max-w-[250px] md:max-w-[320px] h-auto"
              />
            </div>

            <h2 className="text-xl md:text-2xl font-semibold mb-2 text-[#2A2FB8]">Business Inquiries</h2>
            <p className="text-black mb-6 text-sm md:text-base">
              Explore opportunities to collaborate, partner, or advertise with BizNetworQ and grow your business. Let&apos;s connect and create impact together.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Business Inquiry Cards */}
              <div className="bg-[#EEF2FF] shadow-md rounded-lg p-4 md:p-6 h-auto md:h-64">
                <Image src="/uploads/Frame-82.svg" alt="Media Relations Icon" className="mb-2" width={52} height={52} />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#2A2FB8]">Media Relations</h3>
                <p className="text-black text-xs md:text-sm">
                  Visit our Media Room for press contacts, official releases, and multimedia resources.
                </p>
              </div>
              <div className="bg-[#EEF2FF] shadow-md rounded-2xl p-4 md:p-6 h-auto md:h-64">
                <Image src="/uploads/Frame-83.svg" alt="Partnerships Icon" className="mb-2" width={52} height={52} />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#2A2FB8]">Partnerships</h3>
                <p className="text-black text-xs md:text-sm">
                  Interested in partnering with BizNetworQ? Learn more about our partnership program and discover new collaboration opportunities.
                </p>
              </div>
              <div className="bg-[#EEF2FF] shadow-md rounded-lg p-4 md:p-6 h-auto md:h-64">
                <Image src="/uploads/Frame-84.svg" alt="Advertising Icon" className="mb-2" width={52} height={52} />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#2A2FB8]">Advertising</h3>
                <p className="text-black text-xs md:text-sm">
                  Tap into our business audience by advertising on BizNetworQ. We&apos;re here to support everyone, from global companies to local businesses, in reaching their target audience.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-semibold text-[#2A2FB8] mb-2">Get in touch with us</h2>
            <p className="text-gray-600 text-sm md:text-base mb-6">
              We&apos;re here to help! Share your thoughts or questions, and we&apos;ll respond promptly.
            </p>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-sm border border-[#E1E1E1] space-y-4">
                <p className="text-gray-600 text-sm md:text-base">
                  For direct inquiries, please fill out the form below, and our team will be in touch promptly.
                </p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div>
                    <Input
                      placeholder="Full Name" 
                      {...register('fullName', { required: true })}
                      className="bg-[#F5F5F5] w-full"
                    />
                    {errors.fullName && (
                      <span className="text-red-500 text-xs md:text-sm">Full name is required</span>
                    )}
                  </div>
                  
                  <div>
                    <Input
                      type="email"
                      placeholder="Email Id"
                      {...register('email', { required: true })}
                      className="bg-[#F5F5F5] w-full"
                    />
                    {errors.email && (
                      <span className="text-red-500 text-xs md:text-sm">Email is required</span>
                    )}
                  </div>

                  <div>
                    <Textarea
                      placeholder="Describe Your Inquiry"
                      {...register('inquiry')}
                      className="min-h-[120px] bg-[#F5F5F5] w-full"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#2A2FB8] hover:bg-[#2426A8]">
                    Submit
                  </Button>
                </form>
              </div>

              <div className="flex justify-center items-center">
                <Image 
                  src="/uploads/Contact-us-rafiki.svg" 
                  alt="Contact Illustration" 
                  width={850}
                  height={600}
                  className="w-full max-w-[400px] md:max-w-[600px] h-auto object-contain"
                />
              </div>
            </div>
          </section>

          <p className="text-xs md:text-sm text-gray-500 mt-8">
            For abuse reports or policy questions, please reach out to our{' '}
            <Link href="#" className="text-gray-900 underline font-semibold">
              Support
            </Link>{' '}
            Team through our{' '}
            <Link href="#" className="text-gray-900 underline font-semibold">
              Abuse
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-gray-900 underline font-semibold">
              Policy Center
            </Link>
            .
          </p>
        </main>
        <footer className="bg-gray-100 py-4 px-4 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-gray-600 hover:text-gray-900">
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-gray-500">© 2024 BizNetworQ. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}