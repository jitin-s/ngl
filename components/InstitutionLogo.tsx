'use client';

import React, { useState } from 'react';
import { GraduationCap, School, Briefcase, MapPin, Building2 } from 'lucide-react';

interface InstitutionLogoProps {
  name?: string;
  type?: 'university' | 'school' | 'workplace' | 'place' | 'organization' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Known domain mappings for popular universities, schools, and companies
const DOMAIN_MAP: Record<string, string> = {
  stanford: 'stanford.edu',
  harvard: 'harvard.edu',
  mit: 'mit.edu',
  oxford: 'ox.ac.uk',
  cambridge: 'cam.ac.uk',
  berkeley: 'berkeley.edu',
  ucla: 'ucla.edu',
  toronto: 'utoronto.ca',
  nus: 'nus.edu.sg',
  'iit bombay': 'iitb.ac.in',
  'iit delhi': 'iitd.ac.in',
  'iit madras': 'iitm.ac.in',
  'iit kharagpur': 'iitkgp.ac.in',
  'iit kanpur': 'iitk.ac.in',
  'iit roorkee': 'iitr.ac.in',
  'university of delhi': 'du.ac.in',
  du: 'du.ac.in',
  'delhi university': 'du.ac.in',
  'st. stephen': 'ststephens.edu',
  'hindu college': 'hinducollege.ac.in',
  srcc: 'srcc.edu',
  lsr: 'lsr.edu.in',
  'bits pilani': 'bits-pilani.ac.in',
  'nit trichy': 'nitt.edu',
  'nit surathkal': 'nitk.ac.in',
  iisc: 'iisc.ac.in',
  dps: 'dpsfamily.org',
  'delhi public school': 'dpsfamily.org',
  "st. xavier": 'xaviers.edu',
  doon: 'doonschool.com',
  'modern school': 'modernschool.net',
  google: 'google.com',
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  amazon: 'amazon.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  tcs: 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  deloitte: 'deloitte.com',
  mckinsey: 'mckinsey.com',
  'goldman sachs': 'goldmansachs.com',
  accenture: 'accenture.com',
  netflix: 'netflix.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  spotify: 'spotify.com',
};

function inferDomain(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (lower.includes(key)) {
      return domain;
    }
  }

  // If name contains a domain like xxx.edu or xxx.ac.in
  const domainMatch = name.match(/([a-zA-Z0-9-]+\.(edu|ac\.in|org|com|net|io|co\.uk|edu\.in))/i);
  if (domainMatch) {
    return domainMatch[1];
  }

  // Infer domain from clean alphanumeric name
  const clean = lower.replace(/[^a-z0-9]/g, '');
  if (lower.includes('univ') || lower.includes('college')) {
    return `${clean.slice(0, 15)}.edu`;
  }
  if (lower.includes('corp') || lower.includes('technologies') || lower.includes('inc') || lower.includes('ltd')) {
    return `${clean.slice(0, 15)}.com`;
  }

  return null;
}

function getCategoryIcon(type?: string, name?: string) {
  const t = type?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';

  if (t === 'university' || n.includes('univ') || n.includes('college') || n.includes('institute') || n.includes('campus') || n.includes('iit') || n.includes('nit')) {
    return <GraduationCap className="w-full h-full text-amber-300" />;
  }
  if (t === 'school' || n.includes('school') || n.includes('academy') || n.includes('vidyalaya') || n.includes('dps') || n.includes('high')) {
    return <School className="w-full h-full text-rose-300" />;
  }
  if (t === 'workplace' || n.includes('corp') || n.includes('company') || n.includes('technologies') || n.includes('google') || n.includes('microsoft') || n.includes('tcs')) {
    return <Briefcase className="w-full h-full text-cyan-300" />;
  }
  if (t === 'place' || n.includes('area') || n.includes('city') || n.includes('town') || n.includes('colony') || n.includes('nagar') || n.includes('sector')) {
    return <MapPin className="w-full h-full text-pink-300" />;
  }
  return <Building2 className="w-full h-full text-pink-300" />;
}

export function InstitutionLogo({
  name = '',
  type,
  size = 'md',
  className = '',
}: InstitutionLogoProps) {
  const [imgError, setImgError] = useState(false);
  const domain = inferDomain(name);

  // Size dimensions
  const sizeClasses = {
    xs: 'w-5 h-5 min-w-[20px] text-[9px] rounded-lg',
    sm: 'w-7 h-7 min-w-[28px] text-[10px] rounded-xl',
    md: 'w-9 h-9 min-w-[36px] text-xs rounded-2xl',
    lg: 'w-12 h-12 min-w-[48px] text-sm rounded-2xl',
  }[size];

  const iconPadding = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }[size];

  const firstLetter = (name.replace(/^(the|a|an)\s+/i, '').trim()[0] || '🏛️').toUpperCase();

  // Primary logo URL via Google Favicon Service
  const logoUrl = domain && !imgError
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center font-bold shrink-0 border border-white/20 bg-gradient-to-tr from-pink-900/60 via-purple-900/40 to-[#280520] shadow-md shadow-pink-500/10 ${sizeClasses} ${className}`}
      title={name || 'Institution Logo'}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name || 'Institution Logo'}
          className="w-full h-full object-cover p-1 transition-transform group-hover:scale-110"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${iconPadding}`}>
          {name && name.length > 0 ? (
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="bg-gradient-to-r from-pink-200 to-amber-200 bg-clip-text text-transparent font-black">
                {firstLetter}
              </span>
            </div>
          ) : (
            getCategoryIcon(type, name)
          )}
        </div>
      )}
    </div>
  );
}
