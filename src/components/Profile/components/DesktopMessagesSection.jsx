import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import EmptyState from './EmptyState';

const DesktopMessagesSection = () => (
  <motion.div
    key="messages"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <EmptyState
      icon={<FiMessageSquare className="w-12 h-12 text-violet-400" />}
      title="No Messages Yet"
      description="Your conversations with other pet owners will appear here"
      buttonText="Start Chatting"
      onButtonClick={() => {}}
      large
    />
  </motion.div>
);

export default DesktopMessagesSection;