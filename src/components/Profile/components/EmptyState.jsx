import React from "react";

const EmptyState = ({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
  large = false,
}) => (
  <div
    className={`bg-white rounded-2xl shadow-md border border-violet-100 ${
      large ? "p-12" : "p-8"
    } text-center`}
  >
    <div
      className={`${
        large ? "w-20 h-20" : "w-16 h-16"
      } bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4`}
    >
      {icon}
    </div>
    <h3
      className={`${
        large ? "text-xl" : "text-lg"
      } font-semibold text-slate-800 mb-2`}
    >
      {title}
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    <button
      onClick={onButtonClick}
      className="bg-gradient-to-r from-violet-400 to-indigo-400 text-white px-6 py-3 rounded-full font-medium hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg"
    >
      {buttonText}
    </button>
  </div>
);

export default EmptyState;