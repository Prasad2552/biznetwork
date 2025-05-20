interface ProgressStepsProps {
    currentStep: number;
    totalSteps: number;
  }
  
  export function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
    return (
      <div className="relative mb-8">
        <div className="flex justify-between items-center">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="relative flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${
                    index + 1 <= currentStep
                      ? 'bg-[#2F2AB8] text-white'
                      : 'bg-white text-[#2F2AB8]'
                  }`}
              >
                {index + 1}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`h-[5px] flex-1 mx-2 rounded-lg
                    ${index + 1 < currentStep ? 'bg-[#2F2AB8]' : 'bg-white'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  