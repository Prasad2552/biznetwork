//src\components\success-modal.tsx
import React from 'react';
import Image from 'next/image'; // Correctly import the Next.js Image component

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white p-2 rounded-lg shadow-xl max-w-2xl w-full text-center">
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Image
            src="/uploads/success.png" // Path to your image
            alt="Success"
            width={800} // Adjust as needed
            height={600} // Adjust as needed
            className="mx-auto mb-4"
          />

          <button
            onClick={onClose}
            className="bg-blue-600 text-xs hover:bg-blue-700 text-white font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}