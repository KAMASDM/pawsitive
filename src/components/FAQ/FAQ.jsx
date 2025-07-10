import { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Shield, Clock, Star } from 'lucide-react';

const FAQ = () => {
    const [openItems, setOpenItems] = useState({});

    const toggleItem = (index) => {
        setOpenItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const faqData = [
        {
            question: "What services do you offer for pet care?",
            answer: "We provide comprehensive pet care services including daily walks, feeding, playtime, overnight sitting, pet taxi services, basic grooming, and emergency care. Our trained professionals ensure your pets receive personalized attention and care tailored to their specific needs."
        },
        {
            question: "How do I book a pet care service?",
            answer: "Booking is easy! You can schedule services through our website, mobile app, or by calling our customer service team. We recommend booking at least 48 hours in advance, especially during peak seasons and holidays."
        },
        {
            question: "Are your pet sitters insured and background checked?",
            answer: "Absolutely! All our pet sitters undergo thorough background checks, are fully insured, and bonded. They also receive specialized training in pet care, first aid, and emergency procedures to ensure your pet's safety and well-being."
        },
        {
            question: "What happens if my pet has a medical emergency?",
            answer: "Our sitters are trained to handle medical emergencies. We have 24/7 emergency protocols in place and will immediately contact you and your veterinarian. We also maintain a network of emergency veterinary clinics for immediate care if needed."
        },
        {
            question: "Can you care for multiple pets or exotic animals?",
            answer: "Yes! We care for multiple pets in the same household at no extra charge. We also have specialized sitters trained to care for exotic pets including birds, reptiles, and small mammals. Please mention your pet type when booking."
        },
        {
            question: "How do you handle pets with special needs or medications?",
            answer: "Our experienced sitters are trained to handle pets with special medical needs, including administering medications, managing dietary restrictions, and providing specialized care routines. We'll work with you to create a detailed care plan."
        },
        {
            question: "What are your rates and cancellation policy?",
            answer: "Our rates vary based on service type, duration, and location. Basic dog walking starts at $25, while overnight sitting begins at $75. We offer package deals for regular services. Cancellations made 24 hours in advance receive a full refund."
        },
        {
            question: "How will I know my pet is being cared for?",
            answer: "We provide regular updates including photos, videos, and detailed reports about your pet's activities, meals, and mood. You'll receive real-time notifications through our app and can message your sitter directly anytime."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-lavender-50 to-violet-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="flex justify-center mb-4">
                        <Heart className="w-12 h-12 text-pink-200" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                        Everything you need to know about our premium pet care services
                    </p>
                </div>
            </div>

            {/* Features Banner */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <Shield className="w-10 h-10 text-purple-600 mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-1">Insured & Bonded</h3>
                            <p className="text-purple-600 text-sm">All sitters are fully insured and background checked</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Clock className="w-10 h-10 text-purple-600 mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-1">24/7 Support</h3>
                            <p className="text-purple-600 text-sm">Round-the-clock emergency support available</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Star className="w-10 h-10 text-purple-600 mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-1">5-Star Rated</h3>
                            <p className="text-purple-600 text-sm">Trusted by thousands of pet parents</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="space-y-4">
                    {faqData.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-xl"
                        >
                            <button
                                onClick={() => toggleItem(index)}
                                className="w-full px-8 py-6 text-left flex justify-between items-center bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-300"
                            >
                                <h3 className="text-lg font-semibold text-purple-900 pr-4">
                                    {item.question}
                                </h3>
                                <div className="flex-shrink-0">
                                    {openItems[index] ? (
                                        <ChevronUp className="w-6 h-6 text-purple-600" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-purple-600" />
                                    )}
                                </div>
                            </button>

                            {openItems[index] && (
                                <div className="px-8 py-6 bg-white/50">
                                    <p className="text-purple-800 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>



        </div>
    );
};

export default FAQ;