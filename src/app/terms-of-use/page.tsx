//src\app\terms-of-use\page.tsx

'use client'

import React, { useState } from 'react'
import Header from '@/components/header'
import Sidebar from '@/components/sidebar'
import Link from 'next/link'
import { useAuthCheck } from "@/hooks/useAuthCheck"

const sidebarItems = [
  { name: 'Publish With Us', href: '/publish' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
  { name: 'Send Feedback', href: '/sendfeedback' },
]

export default function TermsOfUsePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Terms of Use')
  const [activeNavItem] = useState('All')
  const [isLoggedIn] = useState(false)
  const { token } = useAuthCheck()
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const { isUserLoggedIn } = useAuthCheck();

  return (
    <div className="flex min-h-screen bg-gray-50 ">
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
          <h1 className="text-3xl font-bold mb-4">Terms Of Use</h1>
          
          <p className="text-black mb-2">Effective Date: October 29, 2024</p>
          
          <p className="text-black mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">1. Introduction</h2>
            Welcome to BizNetworQ! By accessing or using our services, you agree to comply with these Terms of Use, which govern your use of BizNetworQ's products, services, and features (collectively, the "Service").
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">2. Our Service</h2>
            <p className="text-black">
              BizNetworQ is a professional content platform designed for business-focused learning, content sharing, and networking. By using BizNetworQ, you can explore insights, create a business channel, and share relevant business content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">3. Applicable Terms</h2>
            <p className="text-black">
              Your use of BizNetworQ is governed by these Terms, our Community Guidelines, and our Privacy Policy. BizNetworQ may modify these terms periodically, and users will be notified of changes that may impact their use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">4. Who May Use the Service?</h2>
            <p className="text-black">
            BizNetworQ is intended for individuals aged 18 and older. While our content is focused on business and professional growth, those using the Service for learning purposes, including internships, may also benefit. If you are under 18, please refrain from creating an account until you reach the minimum age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">5. Your Content and Content Ownership</h2>
            <p className="text-black">
            By uploading content to BizNetworQ, you grant us a right to use, display, promote, and place ads on your content. You retain ownership and control over your content and may add, edit, or delete it at any time. BizNetworQ reserves the right to distribute content uploaded to public business channels to promote platform activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">6. Prohibited Content and Conduct</h2>
            <p className="text-black">
            BizNetworQ is strictly a business-oriented platform. We do not allow content typically shared on platforms like Instagram or YouTube. Any content or activity that is misleading, offensive, illegal, or aimed at promoting personal brands or freelancing services will not be permitted. Violations may lead to content removal or account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">7. Account Suspension and Termination</h2>
            <p className="text-black">
              BizNetworQ reserves the right to suspend or terminate accounts that violate our Terms, including those that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-black">
              <li>Create fake business channels or promote nonexistent businesses.</li>
              <li>Use the platform for unauthorized marketing. Users will receive a notification before any account action is taken, giving them an opportunity to address or rectify the issue.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">8. Service Modifications</h2>
            <p className="text-black">
            As BizNetworQ grows, we will update features, content, and policies to enhance user experience. We will notify users of any changes via email. Continued use of the Service after an update signifies acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">9. Liability Limitations</h2>
            <p className="text-black">
            BizNetworQ makes every effort to ensure a reliable and secure service. However, we are not liable for any service interruptions, data loss, or system errors. Users are encouraged to maintain their own records and backup any important data as necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">10. Indemnity</h2>
            <p className="text-black">
            To the extent allowed by law, you agree to indemnify BizNetworQ against claims, damages, liabilities, or expenses resulting from your content or conduct on the platform. This clause ensures BizNetworQ is protected and remains unaffected by any disputes arising from user actions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">11. Legal Jurisdiction</h2>
            <p className="text-black">
            These Terms are governed by the laws of India, which will be applied in the event of any legal disputes. By using BizNetworQ, you agree to submit to the jurisdiction of Indian courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2A2FB8]">12. Contact Us</h2>
            <p className="text-black">
              If you have questions or require assistance, please reach out to BizNetworQ Support at{' '}
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

