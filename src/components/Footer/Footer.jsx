import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Twitter, CircleArrowUp } from "lucide-react";

const Footer = () => {
  const location = useLocation();

  if (location.pathname === "/") {
    return null;
  }

  return (
    <footer className="bg-lavender-100 text-lavender-700 border-t border-lavender-200 py-6 px-4 sm:px-6 lg:px-8 shadow-soft-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-lavender-800 mb-4">
              Pawppy
            </h3>
            <p className="text-lavender-600 mb-4">
              Connecting pet lovers with resources and companions for their
              furry friends.
            </p>
            <div className="flex space-x-4">
              <Link
                to="https://www.facebook.com/pawppy"
                target="_blank"
                className="text-lavender-600 hover:text-lavender-800 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="w-6 h-6" />
              </Link>
              <Link
                to="https://www.instagram.com/pawppy"
                target="_blank"
                className="text-lavender-600 hover:text-lavender-800 transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="w-6 h-6" />
              </Link>
              <Link
                to="https://twitter.com/pawppy"
                target="_blank"
                className="text-lavender-600 hover:text-lavender-800 transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <Twitter className="w-6 h-6" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-lavender-800 uppercase tracking-wider mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/dog-resources"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Dog Resources
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cat-resources"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Cat Resources
                  </Link>
                </li>
                <li>
                  <Link
                    to="/nearby-mates"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Nearby Mates
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-lavender-800 uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/about-us"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact-us"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/our-team"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Our Team
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-lavender-800 uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-and-conditions"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="text-lavender-600 hover:text-lavender-800 transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-lavender-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-lavender-500 text-center md:text-left mb-4 md:mb-0">
            &copy; 2025 Pawppy. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              to="#"
              className="text-lavender-400 hover:text-lavender-600 text-sm"
            >
              <span className="sr-only">Download App</span>
              <CircleArrowUp className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
