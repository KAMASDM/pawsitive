import React from "react";
import {
  Shield,
  Lock,
  EyeOff,
  Database,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-lavender-600 mr-3" />
            <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
              Privacy Policy
            </h2>
          </div>
          <p className="mt-4 text-lg text-lavender-700">
            Last updated: June 15, 2023
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-soft-md">
          <div className="prose prose-lavender max-w-none">
            <h3 className="text-xl font-semibold text-lavender-900 mb-4">
              <Lock className="inline h-5 w-5 text-lavender-600 mr-2" />
              Your Privacy Matters
            </h3>
            <p className="text-lavender-700 mb-6">
              At Pawppy, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our services.
            </p>

            <div className="space-y-8">
              {[
                {
                  icon: <Database className="h-6 w-6 text-lavender-600" />,
                  title: "Information We Collect",
                  content:
                    "We collect personal information you provide when creating an account, using our services, or communicating with us. This may include name, email, pet details, and location data.",
                },
                {
                  icon: <EyeOff className="h-6 w-6 text-lavender-600" />,
                  title: "How We Use Your Information",
                  content:
                    "Your information is used to provide and improve our services, personalize your experience, communicate with you, and ensure platform security. We never sell your personal data to third parties.",
                },
                {
                  icon: <UserCheck className="h-6 w-6 text-lavender-600" />,
                  title: "Data Sharing & Disclosure",
                  content:
                    "We may share information with service providers who assist us in operations, when required by law, or to protect rights and safety. Profile information is visible to other users as part of our service functionality.",
                },
                {
                  icon: <AlertTriangle className="h-6 w-6 text-lavender-600" />,
                  title: "Your Rights & Choices",
                  content:
                    "You may access, update, or delete your account information at any time. You can opt-out of marketing communications and manage cookie preferences through your account settings.",
                },
              ].map((section, index) => (
                <div
                  key={index}
                  className="border-l-4 border-lavender-200 pl-4"
                >
                  <div className="flex items-center mb-2">
                    {section.icon}
                    <div className="text-lg font-semibold text-lavender-900 ml-2">
                      {section.title}
                    </div>
                  </div>
                  <p className="text-lavender-700">{section.content}</p>
                </div>
              ))}

              <div className="bg-lavender-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Changes to This Policy
                </h4>
                <p className="text-lavender-700">
                  We may update this Privacy Policy periodically. We'll notify
                  you of significant changes by posting the new policy on our
                  site and updating the "Last Updated" date.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Contact Us
                </h4>
                <p className="text-lavender-700">
                  If you have questions about this Privacy Policy, please
                  contact us at privacy@pawppy.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
