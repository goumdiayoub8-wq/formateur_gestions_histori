import React from 'react';
import backgroundImage from '../../style/photos/background.png';
import casablancaSettatLogo from '../../style/photos/Casablanca-Settat_VF.png';
import ofpptLogo from '../../style/photos/logo1 (1).png';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="theme-auth-shell min-h-screen p-3 sm:p-5 lg:p-6">
      <div className="theme-auth-panel mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1920px] overflow-hidden rounded-[30px] sm:min-h-[calc(100vh-2.5rem)]">
        <section className="theme-auth-hero relative hidden w-[42%] overflow-hidden px-10 py-16 text-white lg:flex lg:flex-col">
          <div className="absolute right-16 top-16 h-28 w-28 rounded-[30px] bg-white/12 [clip-path:polygon(25%_6%,75%_6%,100%_28%,100%_72%,75%_94%,25%_94%,0_72%,0_28%)]" />
          <div className="absolute bottom-16 left-12 h-20 w-20 rounded-[28px] bg-white/10 [clip-path:polygon(25%_6%,75%_6%,100%_28%,100%_72%,75%_94%,25%_94%,0_72%,0_28%)]" />

          <div className="relative z-10 text-center">
            <h1 className="text-[72px] font-extrabold tracking-[-0.04em] leading-[0.95]">Gestion des Heures</h1>
            <p className="mx-auto mt-8 max-w-[520px] text-[28px] font-light leading-[1.6] text-white/88">
              Plateforme pour la gestion des formateurs
            </p>
          </div>

          <div className="relative z-10 mt-16 flex flex-1 items-center justify-center">
            <div className="w-full max-w-[640px] overflow-hidden rounded-[28px] bg-white/10 p-0 shadow-[0_24px_60px_rgba(18,54,104,0.18)] backdrop-blur-[2px]">
              <img src={backgroundImage} alt="Campus" className="h-[480px] w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-14">
          <div className="w-full max-w-[760px]">
            <div className="mb-10 flex items-start justify-between gap-4">
              <img src={casablancaSettatLogo} alt="Casablanca Settat" className="h-[88px] w-[88px] object-contain sm:h-[104px] sm:w-[104px]" />
              <img src={ofpptLogo} alt="OFPPT" className="h-[92px] w-[92px] rounded-full object-contain sm:h-[116px] sm:w-[116px]" />
            </div>

            <div className="mb-10 text-center">
              <h2 className="theme-auth-title text-[56px] font-bold tracking-[-0.03em] sm:text-[64px]">{title}</h2>
              <p className="theme-auth-subtitle mt-4 text-[24px] sm:text-[26px]">{subtitle}</p>
            </div>

            {children}

            <p className="theme-auth-muted mt-8 text-center text-[15px]">
              Plateforme EduPlan v1.0 - Institut de Formation
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
