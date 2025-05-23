import React from "react";
import {
  Cookie,
  Settings,
  ShieldHalf,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const CookiePolicy = () => {
  const [showBanner, setShowBanner] = React.useState(true);

  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-lavender-700 text-white p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Cookie className="h-6 w-6 mr-3" />
              <p>
                We use cookies to enhance your experience. By continuing to
                browse, you agree to our use of cookies.
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowBanner(false)}
                className="px-4 py-2 bg-white text-lavender-700 rounded-lg font-medium"
              >
                Accept
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="px-4 py-2 border border-white text-white rounded-lg font-medium"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Cookie className="h-10 w-10 text-lavender-600 mr-3" />
            <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
              Cookie Policy
            </h2>
          </div>
          <p className="mt-4 text-lg text-lavender-700">
            Last updated: June 15, 2023
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-soft-md">
          <div className="prose prose-lavender max-w-none">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4">
                What Are Cookies?
              </h3>
              <p className="text-lavender-700">
                Cookies are small text files stored on your device when you
                visit websites. They help sites remember information about your
                visit, which can make it easier to visit again and make the site
                more useful.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 text-lavender-600 mr-2" />
                  How We Use Cookies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: (
                        <CheckCircle className="h-5 w-5 text-lavender-600" />
                      ),
                      title: "Essential Cookies",
                      desc: "Required for site functionality like login and security.",
                    },
                    {
                      icon: (
                        <ShieldHalf className="h-5 w-5 text-lavender-600" />
                      ),
                      title: "Preference Cookies",
                      desc: "Remember your settings and preferences.",
                    },
                    {
                      icon: (
                        <CheckCircle className="h-5 w-5 text-lavender-600" />
                      ),
                      title: "Analytics Cookies",
                      desc: "Help us understand how visitors use our site.",
                    },
                    {
                      icon: <XCircle className="h-5 w-5 text-lavender-600" />,
                      title: "Marketing Cookies",
                      desc: "Used to track effectiveness of campaigns.",
                    },
                  ].map((item, index) => (
                    <div key={index} className="bg-lavender-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        {item.icon}
                        <div className="font-medium text-lavender-900 ml-2">
                          {item.title}
                        </div>
                      </div>
                      <p className="text-lavender-700 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-lavender-900 mb-4">
                  Managing Cookies
                </h3>
                <p className="text-lavender-700 mb-4">
                  You can control and/or delete cookies as you wish. Most
                  browsers allow you to refuse cookies or delete them. However,
                  disabling essential cookies may affect site functionality.
                </p>
                <div className="bg-lavender-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-lavender-900 mb-2">
                    Browser-Specific Instructions:
                  </h4>
                  <ul className="list-disc pl-5 text-lavender-700 space-y-1">
                    <li>
                      <Link
                        to="#"
                        className="no-underline hover:text-lavender-600 "
                      >
                        Chrome
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="no-underline hover:text-lavender-600"
                      >
                        Firefox
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="no-underline hover:text-lavender-600"
                      >
                        Safari
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="no-underline hover:text-lavender-600"
                      >
                        Edge
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-lavender-50 p-4 rounded-lg">
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Changes to This Policy
                </h4>
                <p className="text-lavender-700">
                  We may update our Cookie Policy from time to time. We'll
                  notify you of any changes by posting the new policy on this
                  page.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lavender-900 mb-2">
                  Contact Us
                </h4>
                <p className="text-lavender-700">
                  For questions about our Cookie Policy, contact us at
                  privacy@pawppy.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
