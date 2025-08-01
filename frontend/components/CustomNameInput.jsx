import React from 'react';

const CustomNameInput = ({ customName, setCustomName, placeholder }) => {
  return (
    <div className="mb-4">
      <label className="block mb-4 text-sm text-white">
        Change her name (optional):
      </label>
      <input
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder={placeholder || "e.g. Aya, Sakura, Mina"}
        className="w-full p-3 border-2 border-white rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
      />
    </div>
  );
};

export default CustomNameInput;
