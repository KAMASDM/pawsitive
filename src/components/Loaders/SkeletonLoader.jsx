import React from "react";

const SkeletonLoader = ({
  type = "default",
  themeColor = "lavender",
  count = 1,
}) => {
  if (type === "resource-detail") {
    return (
      <div className="animate-pulse">
        <div
          className={`bg-${themeColor}-300 h-32 w-full rounded-t-lg mb-4`}
        ></div>

        <div className="bg-gray-200 h-64 w-full mb-6"></div>

        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <div
                className={`h-8 bg-${themeColor}-200 rounded w-1/3 mb-4`}
              ></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex">
                    <div
                      className={`h-6 w-6 rounded-full bg-${themeColor}-200 mr-3`}
                    ></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                className={`h-8 bg-${themeColor}-200 rounded w-1/3 mb-4`}
              ></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          <div className="mb-8">
            <div
              className={`h-8 bg-${themeColor}-200 rounded w-1/3 mb-4`}
            ></div>
            <div className={`bg-${themeColor}-50 p-4 rounded-lg`}>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <div
              className={`h-12 bg-${themeColor}-200 rounded-full w-32`}
            ></div>
            <div className="h-12 bg-green-200 rounded-full w-32"></div>
            <div className="h-12 bg-gray-200 rounded-full w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "resource-card") {
    const cards = Array(count).fill(null);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200"></div>

            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>

              <div className="flex items-center mb-2">
                <div className="h-5 w-5 rounded-full bg-gray-200 mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>

              <div className="flex items-center mb-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="h-5 w-5 bg-gray-200 rounded-full"
                    ></div>
                  ))}
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded ml-2"></div>
              </div>

              <div className="flex justify-between items-center">
                {[1, 2, 3, 4].map((btn) => (
                  <div
                    key={btn}
                    className="h-6 w-6 bg-gray-200 rounded-full"
                  ></div>
                ))}
              </div>
            </div>

            <div className="px-4 pb-4 grid grid-cols-2 gap-2 mt-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mr-4"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((pet) => (
              <div key={pet} className="bg-gray-100 rounded-lg p-4">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-24 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((resource) => (
              <div key={resource} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between">
          <div className="flex space-x-2">
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-64 bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(count)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md h-64 w-full"
              ></div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
};

export default SkeletonLoader;
