import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const ClinicalSafetyBanner = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-5xl">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          <strong className="font-semibold text-amber-800">Academic & Observational Surveillance Prototype:</strong> This platform evaluates statistical signals and patient reports. It does <em>not</em> provide certified autonomous diagnoses or clinical treatment orders. Always consult primary care physician judgment before adjusting medication regimens.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-amber-800/80 bg-amber-200/50 px-2 py-0.5 rounded">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
        <span>Synthetic Cohort V1.0</span>
      </div>
    </div>
  );
};
