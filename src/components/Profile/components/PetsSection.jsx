import React from "react";
import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import EmptyState from "./EmptyState";
import CompactPetCard from "./CompactPetCard";

const PetsSection = ({ pets, onAddPet, onEditPet, onDeletePet, onToggleAvailability }) => (
  <motion.div
    key="pets"
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -12 }}
    transition={{ duration: 0.22 }}
  >
    {pets.length > 0 ? (
      <div className="space-y-3 pb-4">
        {pets.map((pet, index) => (
          <CompactPetCard
            key={pet.id}
            pet={pet}
            index={index}
            onEditPet={onEditPet}
            onDeletePet={onDeletePet}
            onToggleAvailability={onToggleAvailability}
          />
        ))}
      </div>
    ) : (
      <EmptyState
        icon={<FaPaw className="h-8 w-8 text-violet-400" />}
        title="No Pets Added Yet"
        description="Add your pets to start managing their health and sharing their profiles."
        buttonText="Add Your First Pet"
        onButtonClick={onAddPet}
      />
    )}
  </motion.div>
);

export default PetsSection;
