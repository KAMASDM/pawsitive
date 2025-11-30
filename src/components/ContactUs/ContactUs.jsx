import React from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
            Contact Pawppy
          </h2>
          <p className="mt-4 text-lg text-lavender-700 max-w-3xl mx-auto">
            We'd love to hear from you! Reach out with questions, feedback, or
            partnership inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-xl shadow-soft-md">
            <h3 className="text-2xl font-semibold text-lavender-900 mb-6">
              Send us a message
            </h3>
            <form className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-lavender-700 mb-1"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-lavender-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-lavender-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-lavender-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-lavender-700 mb-1"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-2 border border-lavender-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500"
                >
                  <option>General Inquiry</option>
                  <option>Partnership</option>
                  <option>Technical Support</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-lavender-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows="4"
                  className="w-full px-4 py-2 border border-lavender-300 rounded-lg focus:ring-2 focus:ring-lavender-500 focus:border-lavender-500"
                  placeholder="Your message here..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="flex items-center justify-center w-full bg-lavender-600 hover:bg-lavender-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                <Send className="mr-2 h-5 w-5" />
                Send Message
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-soft-md">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                <MapPin className="h-6 w-6 text-lavender-600 mr-2" />
                Our Location
              </h3>
              <p className="text-lavender-700">
                1C Satyam Appartment, Vishwas Colony
                <br />
                Alkapuri, Vadodara 390007
                <br />
                Gujarat, India
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft-md">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 text-lavender-600 mr-2" />
                Email Us
              </h3>
              <p className="text-lavender-700">
                <a
                  href="mailto:support@pawppy.in"
                  className="hover:text-lavender-600"
                >
                  support@pawppy.in
                </a>
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft-md">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                <Phone className="h-6 w-6 text-lavender-600 mr-2" />
                Call Us
              </h3>
              <p className="text-lavender-700">
                <a href="tel:+919638389455" className="hover:text-lavender-600">
                  +91-9638389455
                </a>
              </p>
              <p className="text-lavender-700 mt-2">
                Monday - Friday: 9am - 6pm IST
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-soft-md">
              <h3 className="text-xl font-semibold text-lavender-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 text-lavender-600 mr-2" />
                Office Hours
              </h3>
              <p className="text-lavender-700">
                Monday to Friday
              </p>
              <p className="text-lavender-700 mt-2">
                9:00 AM - 6:00 PM IST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
