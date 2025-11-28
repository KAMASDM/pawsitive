import React from 'react';
import { motion } from 'framer-motion';
import { FaBirthdayCake, FaInfoCircle } from 'react-icons/fa';
import { getPetAgeInfo } from '../../utils/petAgeCalculator';

/**
 * PetAgeCard Component
 * Displays pet age in human years with life stage information
 */
const PetAgeCard = ({ pet, compact = false }) => {
  if (!pet?.dateOfBirth || !pet?.petType) {
    return null;
  }

  const ageInfo = getPetAgeInfo(pet.petType, pet.dateOfBirth);
  const { actualAge, humanAge, lifeStage, formattedAge } = ageInfo;

  if (compact) {
    // Compact version for mobile/inline display
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-violet-100 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${lifeStage.color} flex items-center justify-center text-2xl mr-3`}>
              {lifeStage.emoji}
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="text-lg font-bold text-gray-900">{formattedAge}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">In Human Years</p>
            <p className="text-2xl font-bold text-violet-600">{humanAge}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full version for desktop/detailed view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-violet-100 overflow-hidden"
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${lifeStage.color} p-6`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <div className="text-5xl mr-4">{lifeStage.emoji}</div>
            <div>
              <h3 className="text-2xl font-bold mb-1">{lifeStage.stage}</h3>
              <p className="text-white/90 text-sm">{lifeStage.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/90 text-sm mb-1">In Human Years</p>
            <p className="text-4xl font-bold">{humanAge}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Age Details */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center text-gray-600 mb-2">
              <FaBirthdayCake className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Actual Age</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formattedAge}</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center flex-1">
            <div className="flex items-center justify-center text-gray-600 mb-2">
              <FaInfoCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Life Stage</span>
            </div>
            <p className="text-2xl font-bold text-violet-600">{lifeStage.stage}</p>
          </div>
        </div>

        {/* Care Tips */}
        {lifeStage.tips && lifeStage.tips.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-violet-600 rounded-full mr-2"></span>
              Care Tips for {lifeStage.stage} {pet.petType === 'dog' ? 'Dogs' : 'Cats'}
            </h4>
            <ul className="space-y-2">
              {lifeStage.tips.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start text-sm text-gray-700"
                >
                  <span className="text-violet-400 mr-2 mt-0.5">•</span>
                  <span>{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Fun Fact Footer */}
      <div className="bg-violet-50 px-6 py-3 border-t border-violet-100">
        <p className="text-xs text-violet-700 flex items-center">
          <FaInfoCircle className="w-3 h-3 mr-2" />
          <span>
            {pet.petType === 'dog' 
              ? 'Dog age calculation: First 2 years = ~10.5 human years each, then ~4.5 years per year'
              : 'Cat age calculation: First year = 15 human years, second = 9, then 4 per year'}
          </span>
        </p>
      </div>
    </motion.div>
  );
};

export default PetAgeCard;
