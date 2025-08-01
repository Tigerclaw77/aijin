import React from 'react';
import CharacterCard from './CharacterCard';

const ModelSelection = ({ models, selectedModelId, handleModelSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => (
        <CharacterCard
          key={model.id}
          name={model.name}
          description={model.description}
          image={model.image}
          label={model.label}
          onClick={() => handleModelSelect(model.id)}
          isSelected={selectedModelId === model.id}
          vibe={model.vibe}
        />
      ))}
    </div>
  );
};

export default ModelSelection;
