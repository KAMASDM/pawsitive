import React from "react";
import {
  FileText,
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  ThumbsUp,
  Zap,
} from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-lavender-600 mr-3" />
            <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
              Terms and Conditions
            </h2>
          </div>
          <p className="mt-4 text-lg text-lavender-700">
            Last updated: June 15, 2023
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-soft-md">
          <div className="prose prose-lavender max-w-none">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 text-lavender-600 mr-2" />
                Introduction
              </h3>
              <p className="text-lavender-700">
                Welcome to Pawppy! These Terms and Conditions govern your use of
                our website and services. By accessing or using our platform,
                you agree to be bound by these terms.
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  icon: <AlertCircle className="h-5 w-5 text-lavender-600" />,
                  title: "User Responsibilities",
                  content:
                    "You must be at least 18 years old to use our services. You're responsible for maintaining the confidentiality of your account and for all activities that occur under your account.",
                },
                {
                  icon: (
                    <ClipboardCheck className="h-5 w-5 text-lavender-600" />
                  ),
                  title: "Content Guidelines",
                  content:
                    "You agree not to post harmful, illegal, or misleading content. All pet listings must be accurate and comply with local laws regarding animal welfare and sales.",
                },
                {
                  icon: <ThumbsUp className="h-5 w-5 text-lavender-600" />,
                  title: "Service Limitations",
                  content:
                    "Pawppy is a platform for connecting users but does not guarantee successful connections or the quality of interactions. We're not responsible for user conduct offline.",
                },
                {
                  icon: <Zap className="h-5 w-5 text-lavender-600" />,
                  title: "Modifications",
                  content:
                    "We reserve the right to modify or discontinue services at any time. Continued use after changes constitutes acceptance of the new terms.",
                },
              ].map((item, index) => (
                <div key={index} className="border-b border-lavender-100 pb-6">
                  <div className="flex items-center mb-2">
                    {item.icon}
                    <div className="text-lg font-semibold text-lavender-900 ml-2">
                      {item.title}
                    </div>
                  </div>
                  <p className="text-lavender-700">{item.content}</p>
                </div>
              ))}

              <div className="bg-lavender-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Governing Law
                </h4>
                <p className="text-lavender-700">
                  These Terms shall be governed by the laws of the State of
                  California without regard to its conflict of law provisions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Contact Information
                </h4>
                <p className="text-lavender-700">
                  For questions about these Terms, please contact us at
                  legal@pawppy.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
