import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import { SchoolSignature } from './SchoolSignature';
import { AutorisationChoice } from '../types';

interface PaperDocumentProps {
  id?: string;
  parentNom?: string;
  parentPrenom?: string;
  eleveNom?: string;
  elevePrenom?: string;
  classe?: string;
  choix?: AutorisationChoice | '';
  faitA?: string;
  faitLe?: string;
  destPersonne?: string;
  dateLimite?: string;
  isPrintOnly?: boolean;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '18 septembre 2026';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
  }
  return dateStr;
}

export const PaperDocument: React.FC<PaperDocumentProps> = ({
  id,
  parentNom = '',
  parentPrenom = '',
  eleveNom = '',
  elevePrenom = '',
  classe = '',
  choix = '',
  faitA = 'Charenton-le-Pont',
  faitLe = '7 septembre 2026',
  destPersonne = 'Mikael JOUBIN (Adjoint de direction)',
  dateLimite = '2026-09-18',
  isPrintOnly = false,
}) => {
  const parentFullName = [parentNom.toUpperCase(), parentPrenom].filter(Boolean).join(' ');
  const eleveFullName = [eleveNom.toUpperCase(), elevePrenom].filter(Boolean).join(' ');

  return (
    <div
      id={id ? `paper-doc-${id}` : 'official-paper-document'}
      className={`official-sheet-document bg-white text-black font-serif text-[13px] leading-[1.35] selection:bg-blue-100 ${
        isPrintOnly ? '' : 'shadow-xl rounded-sm border border-slate-300'
      } mx-auto print:shadow-none print:border-none print:m-0 print:p-0`}
      style={{
        width: '100%',
        maxWidth: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        padding: '16mm 18mm 14mm 18mm',
        fontFamily: "'EB Garamond', 'Times New Roman', Times, serif",
      }}
    >
      {/* Document Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Logo Left */}
        <div className="w-[100px] shrink-0 pt-1">
          <SchoolLogo size={90} showText={true} />
        </div>

        {/* Institution Details Right */}
        <div className="text-right">
          <p className="font-bold text-[14px] uppercase tracking-wide leading-tight">
            ENSEMBLE SCOLAIRE
          </p>
          <p className="font-bold text-[15px] uppercase tracking-tight leading-tight text-slate-900">
            NOTRE DAME DES MISSIONS SAINT PIERRE
          </p>
          <p className="italic text-[12px] text-slate-700 leading-tight">
            Sous contrat d'Association
          </p>
          <p className="text-[12px] text-slate-800 leading-tight mt-0.5">
            4 rue du Président Kennedy – 96 rue de Paris
          </p>
          <p className="text-[12px] text-slate-800 leading-tight">
            94220 Charenton-le-Pont
          </p>

          <p className="text-[13px] text-slate-900 mt-5 font-normal">
            Charenton le Pont le , {faitLe || '7 septembre 2026'}
          </p>
        </div>
      </div>

      {/* Body Notice */}
      <div className="text-[13.5px] leading-[1.4] text-justify space-y-3.5 mb-5 text-slate-900">
        <p>
          Nous pouvons être amenés à utiliser, dans le cadre pédagogique, des photos et vidéos des élèves de
          l'établissement :
        </p>

        <div className="pl-16 space-y-0.5 -mt-1 text-[13px]">
          <p>-sur Internet</p>
          <p>-dans différentes publications de l'école.</p>
        </div>

        <p>
          La loi nous fait obligation d'avoir l'autorisation écrite des parents pour cette utilisation.
        </p>

        <div>
          <p className="font-medium">L'article 9 du code civil dispose :</p>
          <div className="pl-6 space-y-0.5 mt-1 font-semibold text-[13px]">
            <p>« • Chacun a droit au respect de sa vie privée. »</p>
            <p>« • ... Toute personne peut interdire la reproduction de ses traits... »</p>
            <p>« • C'est à celui qui reproduit l'image d'apporter la preuve de l'autorisation... »</p>
          </div>
        </div>

        <p>
          S'agissant de mineurs, ce droit à l'image, mais aussi de façon plus générale, au respect de sa personne,
          est d'application stricte.
        </p>

        <p>
          En conséquence, <span className="font-bold italic">aucune photo ou vidéo d'élèves reconnaissables ne pourra être publiée sur le Web sans une autorisation écrite de ses parents</span> ( ou tuteurs, responsables), qui sera valable pour l'année scolaire 2026-2027.
        </p>

        <p className="italic pl-6">
          Aussi nous vous demandons de bien vouloir remplir le bas de cette feuille, en cochant les cases de votre choix.
        </p>
      </div>

      {/* Identity Fields with precise dotted / underline alignment */}
      <div className="border-t border-slate-200 pt-3 space-y-3 mb-5 text-[13.5px]">
        <div className="flex items-end">
          <span className="shrink-0 font-normal mr-2">Madame, Monsieur :</span>
          <div className="grow border-b border-dotted border-slate-700 pb-0.5 pl-2 font-mono text-[14px] font-semibold text-blue-950 uppercase tracking-wide">
            {parentFullName || <span className="text-slate-300 font-serif italic text-xs tracking-normal font-normal">Nom et prénom du parent</span>}
          </div>
        </div>

        <div className="flex items-end gap-3">
          <span className="shrink-0 font-normal">parent(s) de l'élève :</span>
          <div className="grow border-b border-dotted border-slate-700 pb-0.5 pl-2 font-mono text-[14px] font-semibold text-blue-950 uppercase tracking-wide">
            {eleveFullName || <span className="text-slate-300 font-serif italic text-xs tracking-normal font-normal">Nom et prénom de l'élève</span>}
          </div>
          <span className="shrink-0 font-normal pl-2">en classe de :</span>
          <div className="w-28 shrink-0 border-b border-dotted border-slate-700 pb-0.5 pl-2 font-mono text-[14px] font-semibold text-blue-950 text-center">
            {classe || <span className="text-slate-300 font-serif italic text-xs tracking-normal font-normal">Ex: 5ème B</span>}
          </div>
        </div>
      </div>

      {/* Choice Options */}
      <div className="space-y-3.5 mb-6 text-[13px] leading-snug">
        {/* Choice 1 */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-4 h-4 border border-black flex items-center justify-center font-bold text-[13px] bg-white">
            {choix === 'interne' ? '✕' : ''}
          </div>
          <div className="text-justify">
            <span>
              Autorise(nt) l'établissement à diffuser ou reproduire pour sa communication{' '}
              <span className="border border-black px-1 py-0.5 font-semibold inline-block text-[12px] leading-none">
                interne
              </span>{' '}
              (Journal INFO NDM, publications du collège/lycée/école...) les photos et/ou vidéos représentant mon enfant. Cette autorisation est donnée pour tout type de support écrit ou électronique et pour une durée d'un an.
            </span>
          </div>
        </div>

        {/* Choice 2 */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-4 h-4 border border-black flex items-center justify-center font-bold text-[13px] bg-white">
            {choix === 'internet' ? '✕' : ''}
          </div>
          <div className="text-justify">
            <span>
              Autorise(nt) l'établissement à diffuser, les photos et vidéos de mon enfant sur Internet pour l'année scolaire en cours.
            </span>
          </div>
        </div>

        {/* Choice 3 */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-4 h-4 border border-black flex items-center justify-center font-bold text-[13px] bg-white">
            {choix === 'refus' ? '✕' : ''}
          </div>
          <div className="text-justify font-normal">
            <span>Refuse que l'établissement utilise des photos et vidéos de mon enfant.</span>
          </div>
        </div>
      </div>

      {/* Dates and Signatures */}
      <div className="pt-2 mb-6">
        <div className="flex items-baseline mb-4 text-[13.5px]">
          <span className="shrink-0">Fait à :</span>
          <span className="font-mono text-[14px] font-semibold text-blue-950 px-2 min-w-[120px] border-b border-dotted border-slate-700">
            {faitA || 'Charenton-le-Pont'}
          </span>
          <span className="shrink-0 ml-4">le :</span>
          <span className="font-mono text-[14px] font-semibold text-blue-950 px-2 min-w-[100px] border-b border-dotted border-slate-700">
            {faitLe || '7 septembre 2026'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start pt-1">
          {/* Parent Signature Box - Strictly blank for manual handwriting */}
          <div className="pr-4">
            <p className="text-[13px] font-normal leading-tight mb-2">
              Signature des parents ( ou tuteurs, responsables):
            </p>
            <div className="border border-dashed border-slate-300 rounded p-2 h-24 flex flex-col justify-end bg-slate-50/40 print:border-none print:bg-transparent">
              <span className="text-[10px] text-slate-400 italic text-center print:hidden">
                (Signature manuscrite obligatoire après impression)
              </span>
            </div>
          </div>

          {/* School Signature Right */}
          <div className="pl-6 flex flex-col items-start">
            <SchoolSignature width={155} />
          </div>
        </div>
      </div>

      {/* Official Remise Deadline Box */}
      <div className="border border-black bg-slate-50/70 p-2 text-center text-[12.5px] leading-snug my-2.5">
        <p className="font-medium text-slate-900">
          Ce formulaire doit être remis à{' '}
          <strong className="underline underline-offset-2 font-bold">{destPersonne || 'Mikael JOUBIN'}</strong>{' '}
          pour le{' '}
          <strong className="underline underline-offset-2 font-bold">{formatDisplayDate(dateLimite)}</strong>{' '}
          au plus tard.
        </p>
      </div>

      {/* Trombinoscope N.B. notice */}
      <div className="text-[11.5px] leading-tight text-justify text-slate-800 border-t border-slate-200 pt-2.5 mb-4">
        <p>
          <span className="font-bold">N.B :</span> Nous vous informons que le « Trombinoscope » réalisé en début de chaque année scolaire, bien que constituant une donnée personnelle, est un outil indispensable au bon fonctionnement des services administratifs.
        </p>
      </div>

      {/* Bottom Footer Section */}
      <div className="text-[11px] text-slate-700 pt-1">
        <div className="text-[11px] font-bold text-slate-600 mb-1">ED</div>
        <div className="border-t border-black mb-2"></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-[11px]">
          <div>
            <span className="font-bold text-black">TELEPHONE :</span> 01 43 68 05 28
          </div>
          <div>
            <span className="font-bold text-black">TELECOPIE :</span> 01 48 93 57 39
          </div>
          <div>
            <span className="font-bold text-black">E-MAIL :</span>{' '}
            <span className="text-blue-900 underline">service.informatique@notredamedesmissions.fr</span>
          </div>
          <div>
            <span className="font-bold text-black">SITE :</span>{' '}
            <span className="text-blue-900 underline">http://www.notredamedesmissions.fr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
