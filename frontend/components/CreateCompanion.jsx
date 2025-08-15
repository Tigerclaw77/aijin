'use client';
export const runtime = 'nodejs';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import IntimacySelection from '../components/IntimacySelection';
import useCompanionStore from '../store/companionStore';
import { saveCompanionDataToSupabase } from '../utils/Companion/saveCompanionData';
import { supabase } from '../utils/Supabase/supabaseClient';
import { intimacyArchetypes } from '../data/intimacy';

import CharacterCard from './CharacterCard';
import PersonalityCard from './PersonalityCard';
import SampleChatModal from './SampleChatModal';
import PersonalitySelection from './PersonalitySelection';
import SummaryModal from './SummaryModal';

const mbtiAxes = [
  {
    key: 'E',
    label: 'Energy Source',
    options: [
      { label: 'Introversion', value: 'I' },
      { label: 'Extroversion', value: 'E' },
      { label: "Doesn't Matter", value: 'any' },
    ],
  },
  {
    key: 'S',
    label: 'Information',
    options: [
      { label: 'Sensing', value: 'S' },
      { label: 'Intuition', value: 'N' },
      { label: "Doesn't Matter", value: 'any' },
    ],
  },
  {
    key: 'T',
    label: 'Decisions',
    options: [
      { label: 'Thinking', value: 'T' },
      { label: 'Feeling', value: 'F' },
      { label: "Doesn't Matter", value: 'any' },
    ],
  },
  {
    key: 'J',
    label: 'Lifestyle',
    options: [
      { label: 'Judging', value: 'J' },
      { label: 'Perceiving', value: 'P' },
      { label: "Doesn't Matter", value: 'any' },
    ],
  },
];

export default function CreateCompanion() {
  const isSubmittingRef = useRef(false);
  const submittedHashRef = useRef(null);
  const router = useRouter();

  const [models, setModels] = useState([]);
  const [personalities, setPersonalities] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState(null);
  const [step, setStep] = useState(1);
  const [user_id, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showChatPreview, setShowChatPreview] = useState(false);

  // Replace your mbtiFilter default with this:
  const [mbtiFilter, setMbtiFilter] = useState({
    E: 'any',
    S: 'any',
    T: 'any',
    J: 'any',
  });

  const {
    setSelectedAvatar,
    setSelectedPersonality,
    setSelectedIntimacy,
    selectedIntimacy,
    setDisplayName,
    setCurrentCompanion,
    currentCompanion,
  } = useCompanionStore();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const modelModule = await import('../data/models');
        const personalityModule = await import('../data/personalities');
        setModels(modelModule.models || []);
        setPersonalities(personalityModule.default || []);
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      } catch (err) {
        console.error('Failed to load companion creation data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleModelSelect = (id) => {
    // Guard: ensure models are loaded and the id exists
    const model = Array.isArray(models) ? models.find((m) => m.id === id) : null;
    if (!model) {
      console.error('Model not found for id:', id, { models });
      return;
    }

    setSelectedModelId(id);

    // Preferred: store action if available
    if (typeof setSelectedAvatar === 'function') {
      setSelectedAvatar({
        id: model.id,
        image: model.image,
        name: model.name,
      });
    } else {
      // Fallback: hydrate currentCompanion so downstream UI doesn't break
      console.warn('setSelectedAvatar is not a function — falling back to setCurrentCompanion');
      const merged = {
        ...(currentCompanion || {}),
        model_id: model.id,
        avatar_image_url: model.image ?? null,
        name: currentCompanion?.name || customName || model.name || 'Companion',
      };
      setCurrentCompanion(merged);
    }

    setStep(2);
  };

  const handlePersonalitySelect = (id) => {
    const personality = Array.isArray(personalities)
      ? personalities.find((p) => p.id === id)
      : null;

    if (!personality) {
      console.error('Personality not found for id:', id, { personalities });
      return;
    }

    setSelectedPersonalityId(id);
    if (typeof setSelectedPersonality === 'function') {
      setSelectedPersonality(personality);
    } else {
      console.warn('setSelectedPersonality is not a function — skipping store set');
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    console.log('🟢 handleSubmit called');

    const result = await saveCompanionDataToSupabase({ user_id, customName });
    if (!result.success) {
      console.error('❌ Failed to save companion:', result.error);
      return;
    }

    const chosenModel = models.find((m) => m.id === selectedModelId);

    const merged = {
      ...result.data,
      name: customName || result.data?.name || chosenModel?.name || 'Companion',
      avatar_image_url: result.data?.avatar_image_url || chosenModel?.image || null,
    };

    setCurrentCompanion(merged);
    setDisplayName(merged.name);
    setShowSummaryModal(true);
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const applyMbtiFilter = (mbti) => {
    if (!mbti || mbti.length !== 4) return false;
    const [first, second, third, fourth] = mbti;
    return (
      (mbtiFilter.E === 'any' || mbtiFilter.E[0] === first) &&
      (mbtiFilter.S === 'any' || mbtiFilter.S[0] === second) &&
      (mbtiFilter.T === 'any' || mbtiFilter.T[0] === third) &&
      (mbtiFilter.J === 'any' || mbtiFilter.J[0] === fourth)
    );
  };

  const filteredPersonalities = personalities.filter((p) => applyMbtiFilter(p.mbti));

  const initials = customName
    .split(' ')
    .filter((word) => word.length > 0)
    .map((name) => name.charAt(0).toUpperCase())
    .join('');

  const displayInitials = initials.length ? initials : 'R';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        Loading companion data...
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-black text-white">
      {step > 1 && (
        <button onClick={() => setStep(step - 1)} className="text-blue-400 hover:underline mb-4">
          ← Back
        </button>
      )}
      <h1 className="text-2xl font-bold mb-4">
        {step === 1 && 'Choose Your AI Companion'}
        {step === 2 && `Choose a Personality for ${selectedModel?.name}`}
        {step === 3 && 'Choose Your Intimacy Archetype'}
      </h1>

      {step === 1 && (
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
      )}

      {step === 2 && (
        <PersonalitySelection
          mbtiAxes={mbtiAxes}
          mbtiFilter={mbtiFilter}
          setMbtiFilter={setMbtiFilter}
          selectedModel={selectedModel}
          filteredPersonalities={filteredPersonalities}
          selectedPersonalityId={selectedPersonalityId}
          handlePersonalitySelect={handlePersonalitySelect}
        />
      )}

      {step === 3 && (
        <IntimacySelection
          selectedIntimacy={selectedIntimacy}
          setSelectedIntimacy={setSelectedIntimacy}
          setShowSummaryModal={setShowSummaryModal}
        />
      )}

      <SummaryModal
        show={showSummaryModal}
        setShow={setShowSummaryModal}
        selectedModel={selectedModel}
        selectedModelId={selectedModelId}
        selectedPersonalityId={selectedPersonalityId}
        selectedIntimacy={selectedIntimacy}
        personalities={personalities}
        customName={customName}
        setCustomName={setCustomName}
        setDisplayName={setDisplayName}
        user_id={user_id}
      />

      {showChatPreview && (
        <div className="w-full flex justify-center px-4">
          <div className="w-full max-w-[800px] flex flex-col gap-4">
            <SampleChatModal
              selectedPersonalityId={selectedPersonalityId}
              selectedModel={selectedModel}
              customName={customName}
              selectedIntimacy={selectedIntimacy}
              onClose={() => setShowChatPreview(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
