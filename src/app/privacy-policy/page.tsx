//src\app\privacy-policy\page.tsx

'use client'

import React, { useState } from 'react'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import Link from 'next/link'
import { useAuthCheck } from "@/hooks/useAuthCheck";

const sidebarItems = [
  { name: 'Publish With Us', href: '/publish' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
  { name: 'Send Feedback', href: '/sendfeedback' },
]

export default function PrivacyPolicyPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Privacy Policy')
  const [activeNavItem] = useState('All')
  const [isLoggedIn] = useState(false)
  const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
                                          <Sidebar
                                            isSidebarOpen={isSidebarOpen}
                                            toggleSidebar={toggleSidebar}
                                            activeSidebarItem={activeSidebarItem}
                                            setActiveSidebarItem={setActiveSidebarItem}
                                            token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                        />
      <div className="flex-1">
        <Header 
          toggleSidebar={toggleSidebar} 
          activeNavItem={activeNavItem} 
          isLoggedIn={isLoggedIn}
        />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <p className="text-black mb-8">
            BizNetworQ is committed to safeguarding your privacy. This Privacy Policy defines the types of data we collect, how we use it and your rights regarding this information. By using BizNetworQ's services, you agree to the practices described here.
          </p>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8] font-['poppins']">1. Information We Collect</h2>
            <p className="text-black mb-4">To enhance your experience, we collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 text-black">
              <li>Personal Information: We gather personal details such as name, email (personal and professional), and demographic information.</li>
              <li>Geolocation and Interest Data: We may collect geolocation data, content interests, and areas of professional focus to personalize your experience.</li>
              <li>Usage and Viewing Data: We track user interactions with content, including content viewed, session duration, and preferred segments.</li>
              <li>Technical Information: This includes device type, browser, IP address, and operating system information to improve service reliability and performance.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">2. How We Use Your Information</h2>
            <p className="text-black mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2 text-black">
              <li>Provide and Improve the Service: Enhance your BizNetworQ experience by tailoring content and personalizing features based on your preferences.</li>
              <li>Analyze and Optimize Content: Using analytics tools, we track engagement with content to better understand trends and enhance platform offerings.</li>
              <li>Communication: BizNetworQ may use your contact details to send you platform updates, respond to inquiries, and share information relevant to your interests.</li>
              <li>Security and Compliance: Protect users and BizNetworQ against unauthorized activities and comply with applicable legal requirements.</li>
            </ul>
          </section>
          

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">3. Third-Party Services and Sharing</h2>
            <p className="text-black">
            BizNetworQ integrates with third-party plugins for content prioritization, analytics, and feature adjustments. These partners adhere to their own data handling practices, which are aligned with privacy standards. We do not sell or disclose user data to third parties without your explicit consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">4. Data Retention</h2>
            <p className="text-black">
            User data, including viewing history, is retained as long as your account is active. We do not automatically delete data upon inactivity. However, you may request to reset or delete your viewing history if you wish to start fresh.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">5. Cookies and Tracking Technologies</h2>
            <p className="text-black">
            BizNetworQ uses cookies, including session cookies, third-party cookies, and analytics trackers, to understand user preferences and enhance the platform experience. You can manage cookie preferences through your browser settings, but this may affect certain functionalities on BizNetworQ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">6. User Rights</h2>
            <p className="text-black mb-4">We respect your rights to access and manage your data:</p>
            <ul className="list-disc pl-6 space-y-2 text-black">
              <li>Data Access and Correction: You may view and update your profile details, such as your name, email address, and areas of interest, directly in your account settings.</li>
              <li>Data Portability: For users in regions with stricter privacy laws, including the EU, BizNetworQ provides options for data portability.</li>
              <li>Communication: BizNetworQ may use your contact details to send you platform updates, respond to inquiries, and share information relevant to your interests.</li>
              <li>Opt-Out Options: You may opt-out of marketing communications and manage cookie settings to control your data sharing preferences.              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">7. International Data Transfer</h2>
            <p className="text-black">
            Data transfers outside of India, if applicable, are conducted with user consent. BizNetworQ does not share user data with third parties without permission and maintains strict data handling practices in compliance with Indian law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">8. Data Security</h2>
            <p className="text-black">
            We implement industry-standard measures to protect your information. However, while we strive for robust data security, no system is completely infallible. We encourage users to report any suspicious activity and take proactive steps to protect their account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">9. Changes to This Policy</h2>
            <p className="text-black">
            BizNetworQ may update this Privacy Policy periodically to reflect changes in our practices. We will notify users of significant changes via email or updates on this page. Continued use of the Service after such changes constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">10. Contact Us</h2>
            <p className="text-black">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please contact BizNetworQ Support at {' '}
              <Link href="mailto:support@biznetworq.com" className="text-blue-600 hover:underline">
                support@biznetworq.com
              </Link>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

