
//src\components\review.tsx
"use client";

import React, { useState } from 'react';
import { Star, Search } from 'lucide-react';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar'
import { useAuthCheck } from "@/hooks/useAuthCheck";

const Review: React.FC = () => {
  const [step, setStep] = useState(1);
  const [service, setService] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isLoggedIn] = useState(false); 
const [isSidebarOpen, setIsSidebarOpen] = useState(false)
 const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
 const [activeSidebarItem, setActiveSidebarItem] = useState('review')
 const { isUserLoggedIn, isAdmin, handleLogout, token } = useAuthCheck();
  const [activeNavItem] = useState('All')
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center mb-8">
      {[1, 2, 3].map((num, index) => (
        <React.Fragment key={num}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= num ? 'bg-[#2F2AB8] text-white' : 'border border-gray-300 text-gray-500'
            }`}
          >
            {num}
          </div>
          {index < 2 && (
            <div
              className={`w-12 rounded-md h-1 mx-2 ${
                step > num ? 'bg-[#2F2AB8]' : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Select Service to Review</h2>
            <div className="relative w-full mx-auto mb-6">
              <input
                type="text"
                placeholder="Search"
                className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mx-auto">
              {['Ecommerce', 'AI', 'Blockchain', 'Robots'].map((option) => (
                <button
                  key={option}
                  className={`p-3 rounded-md font-medium ${
                    service === option ? 'bg-blue-900 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                  onClick={() => setService(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 w-full mx-auto">
            <div>
              <h2 className="text-lg font-semibold">Service Selected</h2>
              <p className="text-gray-600">{service || 'Not selected'}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Rate our service</h2>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    className={`cursor-pointer ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Type a Review Here</h2>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Type a Review Here"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 text-center w-full mx-auto">
            <h2 className="text-xl font-semibold">Share Your Review on LinkedIn</h2>
            <div className="text-left space-y-2">
              <p><strong>Service:</strong> {service || 'Not selected'}</p>
              <p><strong>Rate our service:</strong> {rating} star{rating !== 1 ? 's' : ''}</p>
              <p><strong>Review:</strong> {reviewText || 'No review provided'}</p>
            </div>
            <button className="bg-[#2F2AB8] text-white px-4 py-2 rounded-md hover:bg-blue-800">
              Share on LinkedIn
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
       <Sidebar
                                                  isSidebarOpen={isSidebarOpen}
                                                  toggleSidebar={toggleSidebar}
                                                  activeSidebarItem={activeSidebarItem}
                                                  setActiveSidebarItem={setActiveSidebarItem}
                                                  token={token || ""} isUserLoggedIn={!!isUserLoggedIn}
                                              />
      <div className="flex-1 flex flex-col">
       <Header  toggleSidebar={toggleSidebar} activeNavItem={activeNavItem} isLoggedIn={isLoggedIn}/>
        <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
          <div className="w-full w-full">
            <h1 className="text-2xl font-bold text-center mb-6">Write a Review</h1>
            {renderStepIndicator()}
            {renderStepContent()}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={handlePrevious}
                >
                  Previous
                </button>
              )}
              {step < 3 && (
                <button
                  className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleNext}
                  disabled={step === 1 && !service}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Review;
