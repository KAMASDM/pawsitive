import React, { useEffect } from "react";

const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`;

const MeetingDetailsSkeleton = ({ activeTab = 0 }) => {
  
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = shimmerKeyframes;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  const shimmerOverlay = (
    <div
      className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200px_100%] z-10"
      style={{ animation: "shimmer 1.5s infinite linear" }}
    />
  );

  const HeaderSkeleton = () => (
    <div className="mb-8">
      <div className="w-24 h-7 bg-gray-200 rounded mb-4" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <div className="flex items-center">
            <div className="w-48 h-10 bg-gray-200 rounded mr-2" />
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="w-28 h-6 bg-gray-200 rounded-full" />
            <div className="w-24 h-6 bg-gray-200 rounded-full" />
            <div className="w-36 h-6 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-9 bg-gray-200 rounded-md" />
          <div className="w-20 h-9 bg-gray-200 rounded-md" />
          <div className="w-9 h-9 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );

  const TabsSkeleton = () => (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex">
        <div className="w-28 h-12 bg-gray-200 rounded-md mr-4" />
        <div className="w-28 h-12 bg-gray-200 rounded-md mr-4" />
        <div className="w-28 h-12 bg-gray-200 rounded-md mr-4" />
        <div className="w-28 h-12 bg-gray-200 rounded-md" />
      </div>
    </div>
  );

  const MinutesTabSkeleton = () => (
    <div className="rounded-2xl shadow-lg relative overflow-hidden bg-white">
      <div className="p-6 relative">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full mr-4" />
            <div className="w-44 h-7 bg-gray-200 rounded" />
          </div>
          <div className="p-6 rounded-2xl bg-purple-50 border border-purple-100 mb-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="w-24 h-5 bg-gray-200 rounded mb-2" />
                <div className="w-36 h-6 bg-gray-200 rounded" />
              </div>
              <div>
                <div className="w-24 h-5 bg-gray-200 rounded mb-2" />
                <div className="w-44 h-6 bg-gray-200 rounded" />
              </div>
              <div>
                <div className="w-24 h-5 bg-gray-200 rounded mb-2" />
                <div className="w-40 h-6 bg-gray-200 rounded" />
              </div>
            </div>
            {shimmerOverlay}
          </div>
          <div className="mb-8">
            <div className="w-24 h-7 bg-gray-200 rounded mb-4" />
            <div className="w-full h-5 bg-gray-200 rounded mb-2" />
            <div className="w-[90%] h-5 bg-gray-200 rounded mb-2" />
            <div className="w-[95%] h-5 bg-gray-200 rounded mb-2" />
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full mr-4" />
            <div className="w-52 h-7 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-5 bg-gray-200 rounded mb-2" />
          <div className="w-[95%] h-5 bg-gray-200 rounded mb-2" />
          <div className="w-[90%] h-5 bg-gray-200 rounded mb-2" />
          <div className="w-[97%] h-5 bg-gray-200 rounded mb-2" />
        </div>
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full mr-4" />
            <div className="w-40 h-7 bg-gray-200 rounded" />
          </div>
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 mb-6 relative">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex mb-4 last:mb-0">
                <div className="w-6 h-6 bg-gray-200 rounded-full mr-4 flex-shrink-0" />
                <div className="w-[90%] h-5 bg-gray-200 rounded" />
              </div>
            ))}
            {shimmerOverlay}
          </div>
        </div>
        <div>
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full mr-4" />
            <div className="w-32 h-7 bg-gray-200 rounded" />
          </div>
          <div className="rounded-2xl border border-gray-200 overflow-hidden mb-6 relative">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className={`p-4 bg-white flex items-center gap-4 ${
                  index < 2 ? "border-b border-gray-200" : ""
                }`}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-grow">
                  <div className="w-[80%] h-5 bg-gray-200 rounded" />
                  <div className="flex items-center mt-1">
                    <div className="w-28 h-4 bg-gray-200 rounded" />
                    <div className="mx-2 h-4 w-px bg-gray-200" />
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-md" />
              </div>
            ))}
            {shimmerOverlay}
          </div>
        </div>
      </div>
      {shimmerOverlay}
    </div>
  );

  const TranscriptTabSkeleton = () => (
    <div className="rounded-2xl shadow-lg relative overflow-hidden bg-white">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="w-36 h-8 bg-gray-200 rounded" />
          <div className="w-28 h-9 bg-gray-200 rounded-md" />
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 bg-white/60 h-[60vh] relative">
          {[...Array(15)].map((_, index) => (
            <React.Fragment key={index}>
              <div className="w-full h-5 bg-gray-200 rounded mb-2" />
              <div className="w-[95%] h-5 bg-gray-200 rounded mb-2" />
              <div className="w-[90%] h-5 bg-gray-200 rounded mb-4" />
            </React.Fragment>
          ))}
          {shimmerOverlay}
        </div>
      </div>
      {shimmerOverlay}
    </div>
  );

  const ActionItemsTabSkeleton = () => (
    <div className="rounded-2xl shadow-lg relative overflow-hidden bg-white">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="w-48 h-8 bg-gray-200 rounded" />
          <div className="w-28 h-9 bg-gray-200 rounded-md" />
        </div>
        <div className="ml-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex mb-8">
              <div className="mr-4 flex flex-col items-center">
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
                <div className="w-px h-20 my-2 bg-gray-200" />
              </div>
              <div className="w-full">
                <div className="w-20 h-5 bg-gray-200 rounded mb-2" />
                <div className="p-4 rounded-xl bg-white border border-gray-200 w-full relative overflow-hidden">
                  <div className="w-[90%] h-5 bg-gray-200 rounded mb-2" />
                  <div className="w-[60%] h-4 bg-gray-200 rounded" />
                  {shimmerOverlay}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {shimmerOverlay}
    </div>
  );

  const RecordingTabSkeleton = () => (
    <div className="rounded-2xl shadow-lg relative overflow-hidden bg-white">
      <div className="p-6">
        <div className="w-48 h-8 bg-gray-200 rounded mb-8" />
        <div className="p-6 rounded-2xl border border-gray-200 bg-white relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-4" />
              <div className="w-24 h-5 bg-gray-200 rounded" />
            </div>
            <div className="w-14 h-5 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-10 bg-gray-200 rounded-md mb-4" />
          <div className="flex justify-between">
            <div className="w-14 h-5 bg-gray-200 rounded" />
            <div className="flex gap-4">
              <div className="w-9 h-9 bg-gray-200 rounded-full" />
              <div className="w-9 h-9 bg-gray-200 rounded-full" />
              <div className="w-9 h-9 bg-gray-200 rounded-full" />
            </div>
            <div className="w-14 h-5 bg-gray-200 rounded" />
          </div>
          {shimmerOverlay}
        </div>
      </div>
      {shimmerOverlay}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <MinutesTabSkeleton />;
      case 1:
        return <TranscriptTabSkeleton />;
      case 2:
        return <ActionItemsTabSkeleton />;
      case 3:
        return <RecordingTabSkeleton />;
      default:
        return <MinutesTabSkeleton />;
    }
  };

  return (
    <div className="container max-w-6xl relative z-10 pt-6">
      <HeaderSkeleton />
      <TabsSkeleton />
      {renderTabContent()}
    </div>
  );
};

export default MeetingDetailsSkeleton;
