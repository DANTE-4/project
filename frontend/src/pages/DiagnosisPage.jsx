// frontend/src/pages/DiagnosisPage.jsx
import { useState } from "react";
import { diagnosisApi } from "../services/api";
import ResultCard from "../components/ResultCard";

const AGE_GROUPS = ["0-17", "18-30", "31-45", "46-60", "60+"];
const SYMPTOMS = [
  { key: "sudden_fever",    label: "Sudden high fever" },
  { key: "joint_pain",      label: "Severe joint pain" },
  { key: "rash",            label: "Skin rash" },
  { key: "headache",        label: "Headache" },
  { key: "muscle_pain",     label: "Muscle pain" },
  { key: "fatigue",         label: "Fatigue / weakness" },
  { key: "chills",          label: "Chills" },
  { key: "nausea",          label: "Nausea" },
  { key: "eye_redness",     label: "Red eyes (conjunctivitis)" },
  { key: "swollen_joints",  label: "Swollen joints" },
];
const EXPOSURE = [
  { key: "recent_travel",             label: "Recent travel to tropical area" },
  { key: "mosquito_exposure",         label: "Known mosquito bites recently" },
  { key: "known_contact_with_case",   label: "Contact with confirmed case" },
  { key: "standing_water_nearby",     label: "Standing water near home/work" },
];

const initialSymptoms = Object.fromEntries(SYMPTOMS.map((s) => [s.key, false]));
const initialExposure  = Object.fromEntries(EXPOSURE.map((e) => [e.key, false]));

export default function DiagnosisPage() {
  const [step, setStep]             = useState(1);
  const [ageGroup, setAgeGroup]     = useState("18-30");
  const [sex, setSex]               = useState("female");
  const [symptoms, setSymptoms]     = useState(initialSymptoms);
  const [exposure, setExposure]     = useState(initialExposure);
  const [durationDays, setDuration] = useState(1);
  const [result, setResult]         = useState(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");

  const toggleSymptom = (key) =>
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleExposure = (key) =>
    setExposure((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const payload = {
        demographics: { age_group: ageGroup, sex },
        symptoms,
        exposure,
        duration_days: Number(durationDays),
      };
      const data = await diagnosisApi.submit(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
      setStep(1); // Go back to fix issues if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(1);
    setSymptoms(initialSymptoms);
    setExposure(initialExposure);
    setDuration(1);
  };

  if (result) return <ResultCard result={result} onReset={handleReset} />;

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Health Assessment</h1>
        <p className="text-slate-500">
          Complete the following steps to receive an AI-assisted chikungunya virus risk screening.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Step {step} of 4: {
              step === 1 ? "Demographics" :
              step === 2 ? "Symptoms" :
              step === 3 ? "Exposure" : "Duration"
            }
          </span>
          <span className="text-xs font-medium text-slate-400">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Basic Information</h3>
                <p className="text-sm text-slate-500 mb-6">Tell us a bit about yourself to help the AI calibrate.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Age Group</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                    >
                      {AGE_GROUPS.map((ag) => <option key={ag}>{ag}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Biological Sex</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["female", "male", "other"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSex(s)}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border ${
                            sex === s
                              ? "bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-100"
                              : "bg-white border-slate-200 text-slate-600 hover:border-brand-200"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Current Symptoms</h3>
                <p className="text-sm text-slate-500 mb-6">Select all symptoms you have experienced in the last 14 days.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYMPTOMS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSymptom(s.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all ${
                        symptoms[s.key]
                          ? "bg-brand-50 border-brand-200 text-brand-900"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        symptoms[s.key] ? "bg-brand-600 border-brand-600" : "bg-white border-slate-300"
                      }`}>
                        {symptoms[s.key] && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Exposure Risk</h3>
                <p className="text-sm text-slate-500 mb-6">Factors that increase the likelihood of virus transmission.</p>
                <div className="grid grid-cols-1 gap-3">
                  {EXPOSURE.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => toggleExposure(e.key)}
                      className={`flex items-center gap-4 p-5 rounded-xl text-left border transition-all ${
                        exposure[e.key]
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                        exposure[e.key] ? "bg-amber-500 border-amber-500" : "bg-white border-slate-300"
                      }`}>
                        {exposure[e.key] && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Duration</h3>
                <p className="text-sm text-slate-500 mb-8">How long have you been feeling these symptoms?</p>
                <div className="max-w-md mx-auto text-center space-y-8">
                  <div className="text-6xl font-black text-brand-600">{durationDays}</div>
                  <div className="text-lg font-medium text-slate-400 uppercase tracking-widest">Days</div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>1 DAY</span>
                    <span>30 DAYS</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={() => step > 1 && setStep(step - 1)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              step === 1
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-white hover:shadow-sm"
            }`}
            disabled={step === 1}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-100 transition-all flex items-center gap-2"
            >
              Next Step
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Run AI Analysis"
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-600 shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-brand-900">Privacy Note</h4>
          <p className="text-xs text-brand-700">Your data is encrypted and used only for the purpose of this screening.</p>
        </div>
      </div>
    </div>
  );
}
