import React from 'react';

/**
 * Translated sentence with **bold** parts. Only `**` is interpreted (never HTML),
 * so a translation can not inject markup.
 */
export const BoldText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={className}>
    {text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
  </span>
);
