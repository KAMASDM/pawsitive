import React from "react";
import { ArrowLeft } from "lucide-react";

const PetDetailShimmer = () => {
  return (
    <div className="container mx-auto py-4 px-4 lg:py-8 max-w-7xl">
      <div className="bg-gradient-to-r from-lavender-600 to-lavender-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-lavender-700 text-white flex items-center">
          <button className="mr-3 p-1 rounded-full hover:bg-lavender-600">
            <ArrowLeft className="text-white" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Pet Details</h1>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-5/12">
            <div className="w-full h-64 sm:h-80 md:h-96 lg:h-full bg-gray-200 animate-pulse relative overflow-hidden">
              <div className="shimmer-effect"></div>
            </div>
          </div>

          <div className="w-full lg:w-7/12 bg-white p-4 sm:p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                <div className="shimmer-effect"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <div className="w-6 h-6 mr-2 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                <div className="shimmer-effect"></div>
              </div>
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                <div className="shimmer-effect"></div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-6 h-6 mr-2 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                    <div className="shimmer-effect"></div>
                  </div>
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                    <div className="shimmer-effect"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 mr-2 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
              <div className="pl-6 space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 mr-2 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
              <div className="pl-6 space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-4 h-4 mr-2 mt-1 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                      <div className="shimmer-effect"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                      <div className="shimmer-effect"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse relative overflow-hidden mr-3">
                    <div className="shimmer-effect"></div>
                  </div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                    <div className="shimmer-effect"></div>
                  </div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .shimmer-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PetDetailShimmer;
