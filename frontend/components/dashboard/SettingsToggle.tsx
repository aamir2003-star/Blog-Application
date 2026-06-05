'use client';

interface SettingsToggleProps {
  autoDeleteTrashSetting: boolean;
  togglingAutoDelete: boolean;
  onToggle: () => void;
}

export default function SettingsToggle({
  autoDeleteTrashSetting,
  togglingAutoDelete,
  onToggle,
}: SettingsToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-primary/5 px-6 py-3 border-b border-outline-variant/10 select-none">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-primary">auto_delete</span>
        <span className="text-xs font-semibold text-on-surface/90">Auto-delete after 30 days</span>
        <button 
          onClick={onToggle}
          disabled={togglingAutoDelete}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 select-none border-none bg-transparent ${
            autoDeleteTrashSetting ? 'bg-primary' : 'bg-outline-variant/50'
          }`}
          title="Toggle automatic trash purging after 30 days"
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${
            autoDeleteTrashSetting ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
      </div>
      <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed">
        {autoDeleteTrashSetting 
          ? "🗑️ Trashed publications are purged automatically after 30 days." 
          : "🛡️ Trashed publications will remain in the trash bin indefinitely."}
      </p>
    </div>
  );
}
