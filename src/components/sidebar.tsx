// src/components/sidebar.tsx

'use client'
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronRight, X } from 'lucide-react'
import Link from 'next/link';
import Image from 'next/image'
import { useSession } from 'next-auth/react';
import { usePathname } from "next/navigation";
import { useAuthCheck } from '@/hooks/useAuthCheck';

// Icon Components (unchanged)
const PublishIcon = ({ className }: { className?: string }) => (
  <Image src="/uploads/publish-with-us.svg" alt="Publish Icon" width={20} height={20} className={className} />
);

const AboutIcon = ({ className }: { className?: string }) => (
  <Image src="/uploads/about-us.svg" alt="About Icon" width={20} height={20} className={className} />
);

const ContactIcon = ({ className }: { className?: string }) => (
  <Image src="/uploads/contact-us.svg" alt="Contact Icon" width={20} height={20} className={className} />
);

const HelpIcon = ({ className }: { className?: string }) => (
  <Image src="/uploads/help.svg" alt="Help Icon" width={20} height={20} className={className} />
);

const FeedbackIcon = ({ className }: { className?: string }) => (
  <Image src="/uploads/send-feedback.svg" alt="Feedback Icon" width={20} height={20} className={className} />
);

const HistoryIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <Image
    src="/uploads/history.png"
    alt="History Icon"
    width={20}
    height={20}
    className={className}
    style={{ filter: isActive ? 'brightness(0) saturate(100%) invert(20%) sepia(71%) saturate(3339%) hue-rotate(227deg) brightness(93%) contrast(99%)' : 'none' }}
  />
);

const LikedIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <Image
    src="/uploads/Heart.png"
    alt="Liked Icon"
    width={20}
    height={20}
    className={className}
    style={{ filter: isActive ? 'brightness(0) saturate(100%) invert(20%) sepia(71%) saturate(3339%) hue-rotate(227deg) brightness(93%) contrast(99%)' : 'none' }}
  />
);

const SubscriptionsIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <Image
    src="/uploads/subscription.png"
    alt="Subscriptions Icon"
    width={20}
    height={20}
    className={className}
    style={{ filter: isActive ? 'brightness(0) saturate(100%) invert(20%) sepia(71%) saturate(3339%) hue-rotate(227deg) brightness(93%) contrast(99%)' : 'none' }}
  />
);

const SavedIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <Image
    src="/uploads/saved.png"
    alt="Saved Icon"
    width={20}
    height={20}
    className={className}
    style={{ filter: isActive ? 'brightness(0) saturate(100%) invert(20%) sepia(71%) saturate(3339%) hue-rotate(227deg) brightness(93%) contrast(99%)' : 'none' }}
  />
);

const BizIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke={isActive ? "#2A2FB8" : "#323232"}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill={isActive ? "#2A2FB8" : "#323232"} />
    <polygon points="10 8 16 12 10 16 10 8" fill="white" stroke="white" />
  </svg>
);

const HomeIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <svg
    width="18"
    height="17"
    viewBox="3 0 19 18"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10,19 L10,14 L14,14 L14,19 C14,19.55 14.45,20 15,20 L18,20 C18.55,20 19,19.55 19,19 L19,12 L20.7,12 C21.16,12 21.38,11.43 21.03,11.13 L12.67,3.6 C12.29,3.26 11.71,3.26 11.33,3.6 L2.97,11.13 C2.63,11.43 2.84,12 3.3,12 L5,12 L5,19 C5,19.55 5.45,20 6,20 L9,20 C9.55,20 10,19.55 10,19 Z"
      fill={isActive ? "#2A2FB8" : "#323232"}
    />
  </svg>
);

const TrendIcon = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#2A2FB8" : "#323232"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// Updated SidebarProps interface
interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeSidebarItem: string;
  setActiveSidebarItem: (item: string) => void;
  token: string; // Added to match props passed from parent
  isUserLoggedIn: boolean; // Added to match props passed from parent
}

// Updated Sidebar component with new props
export default function Sidebar({
  isSidebarOpen,
  toggleSidebar,
  activeSidebarItem,
  setActiveSidebarItem,
  token, // Added
  isUserLoggedIn, // Added
}: SidebarProps) {
  const { isAdmin } = useAuthCheck();
  const [isExploreOpen, setIsExploreOpen] = useState(true);
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleItemClick = useCallback((name: string) => {
    setActiveSidebarItem(name);
    if (isSidebarOpen && name !== "Subscriptions") {
      toggleSidebar();
    }
  }, [isSidebarOpen, toggleSidebar, setActiveSidebarItem]);

  useEffect(() => {
    if (pathname === '/subscriptions') {
      handleItemClick('Subscriptions');
    }
  }, [pathname, handleItemClick]);

  const sidebarItems = [
    { name: 'Home', icon: HomeIcon, href: '/' },
    { name: 'Biz', icon: BizIcon, href: '/reels' },
    { name: 'Trending', icon: TrendIcon, href: '/' },
  ];

  const userItems = [
    { name: 'History', icon: HistoryIcon, href: '/history' },
    { name: 'Liked', icon: LikedIcon, href: '/liked' },
    { name: 'Subscriptions', icon: SubscriptionsIcon, href: '/subscriptions' },
    { name: 'Saved', icon: SavedIcon, href: '/saved' },
  ];

  const exploreItems = [
    'Technology', 'FinTech', 'MarTech', 'HealthTech', 'EdTech', 'E-commerce', 'PropTech', 'AgriTech',
    'Energy & CleanTech', 'Manufacturing & Industry', 'Consumer Goods & Retail', 'Travel & Hospitality',
    'Media & Entertainment', 'Automotive', 'Logistics & Supply Chain', 'Aerospace & Defense', 'LegalTech', 'HRTech', 'Construction & Real Estate', 'FoodTech', 'Nonprofits & Social Impact',
    'Government & Public Sector', 'Education & Research', 'Insurance (InsurTech)', 'Telecommunications', 'Healthcare',
  ];

  const footerLinks = [
    { name: 'About', href: '/about' },
    { name: 'Contact Us', href: '/contact-us' },
    { name: 'Advertise', href: '/publish-with-us' },
    { name: 'Terms of Use', href: '/terms-of-use' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'How BizNetworQ Works', href: '/how-biznetwork-works' },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:h-screen
      `}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/uploads/biznetwork.png"
              alt="BizNetworQ Logo"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              width={170}
              height={60.7}
              priority
            />
          </Link>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <X size={24} />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <div className="p-4">
          <div className="space-y-4">
            {sidebarItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start pl-4 ${
                    activeSidebarItem === item.name
                      ? "bg-[#EEF2FF] text-[#2A2FB8] hover:bg-blue-100 hover:text-blue-600 rounded-full"
                      : "text-[#323232]"
                  }`}
                  onClick={() => handleItemClick(item.name)}
                >
                  <item.icon className={`mr-3 w-5 h-5`} isActive={activeSidebarItem === item.name} />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>

          <Separator className="my-4 border-gray-300" />

          {!isAdmin && session?.user && (
            <>
              <div className="space-y-1">
                {userItems.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start pl-4 ${
                        activeSidebarItem === item.name
                          ? "bg-[#EEF2FF] text-[#2A2FB8] hover:bg-blue-100 hover:text-blue-600 rounded-full"
                          : "text-[#323232]"
                      }`}
                      onClick={() => handleItemClick(item.name)}
                    >
                      <item.icon className={`mr-3 w-5 h-5`} isActive={activeSidebarItem === item.name} />
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>
              <Separator className="my-4 border-gray-300" />
            </>
          )}

          <div className="space-y-4">
            <Collapsible open={isExploreOpen} onOpenChange={setIsExploreOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between pl-4 pr-4">
                  <span className="font-semibold text-[#323232]">Explore</span>
                  <ChevronRight
                    className={`transform transition-transform duration-300 ${
                      isExploreOpen ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2 pl-0">
                <div className="space-y-2">
                  {exploreItems.map((item) => (
                    <Button
                      key={item}
                      variant="ghost"
                      className="w-full justify-start text-sm font-semibold text-[#323232]"
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator className="border-gray-300 my-4" />
          <div className="space-y-4">
            <Link href="/publish-with-us">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSidebarItem === 'Publish With Us'
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                    : "text-[#323232]"
                }`}
                onClick={() => handleItemClick('Publish With Us')}
              >
                <PublishIcon className={`mr-3 w-5 h-5`} />
                Publish With Us
              </Button>
            </Link>

            <Link href="/about">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSidebarItem === 'About Us'
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                    : "text-[#323232]"
                }`}
                onClick={() => handleItemClick('About Us')}
              >
                <AboutIcon className={`mr-3 w-5 h-5`} />
                About Us
              </Button>
            </Link>

            <Link href="/contact-us">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSidebarItem === 'Contact Us'
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                    : "text-[#323232]"
                }`}
                onClick={() => handleItemClick('Contact Us')}
              >
                <ContactIcon className={`mr-3 w-5 h-5`} />
                Contact Us
              </Button>
            </Link>

            <Separator className="my-4 border-gray-300" />

            <Link href="/help">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSidebarItem === 'Help'
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                    : "text-[#323232]"
                }`}
                onClick={() => handleItemClick('Help')}
              >
                <HelpIcon className={`mr-3 w-5 h-5`} />
                Help
              </Button>
            </Link>

            <Link href="/send-feedback">
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  activeSidebarItem === 'Send Feedback'
                    ? "bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-600 rounded-full"
                    : "text-[#323232]"
                }`}
                onClick={() => handleItemClick('Send Feedback')}
              >
                <FeedbackIcon className={`mr-3 w-5 h-5`} />
                Send Feedback
              </Button>
            </Link>

            <Separator className="my-4 border-gray-300" />

            <div className="flex flex-wrap text-sm font-semibold">
              {footerLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="mr-2 my-1 text-black hover:text-gray-900 ml-4 whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <p className="text-gray-500 mt-4 text-sm">© 2024 BizNetworQ</p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}