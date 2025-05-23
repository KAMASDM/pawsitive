import React from "react";
import { Users, Award, Heart, PawPrint, Star, Globe } from "lucide-react";

const teamMembers = [
  {
    name: "Jeegar Desai",
    role: "Founder & CEO",
    bio: "Visionary leader with over a decade in animal welfare. Founded Pawppy to revolutionize pet care and community connection.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    funFact: "Dreams of opening a free pet clinic in every state.",
  },
  {
    name: "Sandeep Patel",
    role: "Co-Founder & CTO",
    bio: "Tech-savvy strategist focused on building scalable systems that simplify life for pet lovers everywhere.",
    image: "https://randomuser.me/api/portraits/men/44.jpg",
    funFact: "Once built a smart feeder that texts when your pet eats.",
  },
  {
    name: "Sagar Ramani",
    role: "Lead Developer",
    bio: "Code wizard behind Pawppy’s core systems, ensuring seamless performance and secure experiences for all users.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    funFact: "Automated his dog's treat dispenser using voice commands.",
  },
  {
    name: "Darshan Patel",
    role: "Lead Designer",
    bio: "Design expert dedicated to crafting intuitive, inclusive, and visually delightful experiences for pet communities.",
    image: "https://randomuser.me/api/portraits/men/63.jpg",
    funFact: "Once illustrated a comic series featuring shelter animals.",
  },
];

const OurTeam = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-lavender-600 mr-3" />
            <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
              Meet Our Team
            </h2>
          </div>
          <p className="mt-4 text-lg text-lavender-700 max-w-3xl mx-auto">
            Passionate pet lovers dedicated to making Pawppy the best platform
            for you and your furry friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-soft-md overflow-hidden hover:shadow-soft-lg transition-shadow"
            >
              <div className="h-48 bg-lavender-100 flex items-center justify-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-lavender-900">
                  {member.name}
                </h3>
                <p className="text-lavender-600 mb-3">{member.role}</p>
                <p className="text-lavender-700 mb-4">{member.bio}</p>
                <div className="flex items-center text-sm text-lavender-500">
                  <PawPrint className="h-4 w-4 mr-1" />
                  <span>{member.funFact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-lavender-100 to-lavender-50 p-8 rounded-xl">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-lavender-900 mb-6 text-center">
              Our Values
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Heart className="h-8 w-8 text-lavender-600" />,
                  title: "Compassion",
                  desc: "Every decision is made with pets' best interests at heart.",
                },
                {
                  icon: <Award className="h-8 w-8 text-lavender-600" />,
                  title: "Excellence",
                  desc: "We strive to deliver the best possible experience for our users.",
                },
                {
                  icon: <Globe className="h-8 w-8 text-lavender-600" />,
                  title: "Community",
                  desc: "Building connections between pet lovers is at our core.",
                },
                {
                  icon: <Star className="h-8 w-8 text-lavender-600" />,
                  title: "Innovation",
                  desc: "Continuously improving our platform to serve you better.",
                },
                {
                  icon: <PawPrint className="h-8 w-8 text-lavender-600" />,
                  title: "Integrity",
                  desc: "Honest and transparent in all our interactions.",
                },
                {
                  icon: <Users className="h-8 w-8 text-lavender-600" />,
                  title: "Inclusivity",
                  desc: "Welcoming all pet lovers regardless of background.",
                },
              ].map((value, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg flex items-start"
                >
                  <div className="p-2 rounded-full bg-lavender-100 mr-4">
                    {value.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lavender-900">
                      {value.title}
                    </h4>
                    <p className="text-sm text-lavender-700">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurTeam;
