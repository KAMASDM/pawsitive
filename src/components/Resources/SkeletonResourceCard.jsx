import React from "react";

const SkeletonResourceCard = () => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
            {/* Image skeleton */}
            <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
            
            <div className="p-4">
                {/* Title skeleton */}
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                
                {/* Address skeleton */}
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                
                {/* Rating skeleton */}
                <div className="flex items-center mb-3">
                    <div className="h-4 bg-gray-200 rounded w-20 mr-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                
                {/* Info items skeleton */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
                
                {/* Buttons skeleton */}
                <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg"></div>
                    <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonResourceCard;
