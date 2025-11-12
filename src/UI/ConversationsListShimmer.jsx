import React from "react";

const ConversationsListShimmer = ({ count = 5 }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-lavender-100 overflow-hidden">
      <div className="p-4 border-b border-lavender-100 flex items-center gap-2">
        <div className="h-8 w-12 bg-gray-200 rounded-full animate-pulse relative overflow-hidden">
          <div className="shimmer-effect"></div>
        </div>

        <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse relative overflow-hidden">
          <div className="shimmer-effect"></div>
        </div>

        <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse relative overflow-hidden">
          <div className="shimmer-effect"></div>
        </div>
      </div>

      <div className="divide-y divide-lavender-100">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="p-4 flex items-start">
            <div className="relative mr-4 flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse relative overflow-hidden">
                <div className="shimmer-effect"></div>
              </div>

              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white bg-gray-200 animate-pulse overflow-hidden">
                <div className="shimmer-effect"></div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse relative overflow-hidden ml-2 flex-shrink-0">
                  <div className="shimmer-effect"></div>
                </div>
              </div>

              <div className="h-4 w-full bg-gray-200 rounded animate-pulse relative overflow-hidden mb-1">
                <div className="shimmer-effect"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse relative overflow-hidden">
                  <div className="shimmer-effect"></div>
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse relative overflow-hidden flex-shrink-0">
                  <div className="shimmer-effect"></div>
                </div>
              </div>
            </div>

            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse relative overflow-hidden ml-2 flex-shrink-0 self-center">
              <div className="shimmer-effect"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationsListShimmer;
