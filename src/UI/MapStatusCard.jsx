import React from "react";

const toneStyles = {
  violet: {
    spinner: "border-violet-600",
    button: "bg-violet-600 hover:bg-violet-700",
  },
  green: {
    spinner: "border-green-600",
    button: "bg-green-600 hover:bg-green-700",
  },
  blue: {
    spinner: "border-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
};

const MapStatusCard = ({
  variant = "loading",
  tone = "violet",
  title,
  description,
  onRetry,
}) => {
  const styles = toneStyles[tone] || toneStyles.violet;
  const isError = variant === "error";

  const defaultTitle = isError ? "Map failed to load" : "Loading map...";
  const defaultDescription = isError
    ? "Check your connection or the Google Maps API key."
    : "";

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        {!isError && (
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 ${styles.spinner} mx-auto mb-4`}
          ></div>
        )}
        <p className="text-gray-700 font-semibold mb-2">
          {title || defaultTitle}
        </p>
        {(description || defaultDescription) && (
          <p className="text-gray-600 text-sm">
            {description || defaultDescription}
          </p>
        )}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            className={`mt-4 px-4 py-2 rounded-lg ${styles.button} text-white text-sm font-semibold transition-colors`}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default MapStatusCard;
