import React from "react";
import {
  Heart,
  PawPrint,
  Users,
  ShieldCheck,
  Globe,
  HandHeart,
} from "lucide-react";

const AboutUs = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
            <PawPrint className="inline mr-2 h-8 w-8 text-lavender-700" />
            About Pawppy
          </h2>
          <p className="mt-4 text-lg text-lavender-700 max-w-3xl mx-auto">
            Connecting pet lovers with resources and companions for their furry
            friends since 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <Heart className="h-10 w-10 text-lavender-600" />,
              title: "Our Mission",
              desc: "To create a community where pet owners can find everything they need for their pets' happiness and wellbeing.",
            },
            {
              icon: <Users className="h-10 w-10 text-lavender-600" />,
              title: "Our Community",
              desc: "Over 50,000 pet lovers connecting daily to share knowledge and find mates for their pets.",
            },
            {
              icon: <ShieldCheck className="h-10 w-10 text-lavender-600" />,
              title: "Trust & Safety",
              desc: "Verified profiles and secure platform to ensure safe interactions for all members.",
            },
            {
              icon: <Globe className="h-10 w-10 text-lavender-600" />,
              title: "Nationwide",
              desc: "Serving pet owners across the country with localized resources and connections.",
            },
            {
              icon: <HandHeart className="h-10 w-10 text-lavender-600" />,
              title: "Adoption Support",
              desc: "Partnering with shelters to help pets find their forever homes.",
            },
            {
              icon: <PawPrint className="h-10 w-10 text-lavender-600" />,
              title: "Pet First",
              desc: "Every decision we make prioritizes the wellbeing of animals in our community.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-soft-md hover:shadow-soft-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-full bg-lavender-100 mr-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-lavender-900">
                  {item.title}
                </h3>
              </div>
              <p className="text-lavender-700">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-lavender-100 to-lavender-50 p-8 rounded-xl">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-lavender-900 mb-4">
              Our Story
            </h3>
            <p className="text-lavender-700 mb-6">
              Pawppy was founded by a team of pet enthusiasts who recognized the
              challenges pet owners face in finding reliable resources and
              compatible mates for their pets. What started as a small local
              project has grown into a nationwide platform helping thousands of
              pets and their owners every day.
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-lavender-600 text-white px-6 py-2 rounded-full font-medium">
                50K+ Users
              </div>
              <div className="bg-lavender-600 text-white px-6 py-2 rounded-full font-medium">
                100+ Shelters
              </div>
              <div className="bg-lavender-600 text-white px-6 py-2 rounded-full font-medium">
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
