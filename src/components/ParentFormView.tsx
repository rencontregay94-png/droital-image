import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Eye,
  Info,
  PenTool,
  RotateCcw,
  Sparkles,
  School,
  Lock,
  Clock,
  Loader2,
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { PaperDocument } from './PaperDocument';
import { AutorisationChoice, FormulaireItem, SchoolConfig } from '../types';
import { generatePdfFromElement, printDocumentOrElement } from '../utils/pdfGenerator';

interface ParentFormViewProps {
  onOpenAdminLogin: () => void;
}

const DEFAULT_CLASSES = [
  '6ème A', '6ème B', '6ème C',
  '5ème A', '5ème B', '5ème C',
  '4ème A', '4ème B', '4ème C',
  '3ème A', '3ème B', '3ème C',
  '2nde 1', '2nde 2', '2nde 3',
  '1ère G1', '1ère G2', '1ère STMG',
  'Terminale 1', 'Terminale 2', 'Terminale STMG',
];

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

export const ParentFormView: React.FC<ParentFormViewProps> = ({ onOpenAdminLogin }) => {
  const [step, setStep] = useState<'welcome' | 'form' | 'success'>('welcome');

  // School configuration loaded from backend (classes, recipient, deadline)
  const [config, setConfig] = useState<SchoolConfig>({
    classes: DEFAULT_CLASSES,
    destPersonne: 'Mikael JOUBIN (Adjoint de direction)',
    dateLimite: '2026-09-18',
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.classes)) {
          setConfig({
            classes: data.classes,
            destPersonne: data.destPersonne || 'Mikael JOUBIN (Adjoint de direction)',
            dateLimite: data.dateLimite || '2026-09-18',
          });
        }
      })
      .catch((err) => {
        console.warn('Configuration de remise non chargée depuis le serveur:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Form states (No email or phone number requested per instructions)
  const [parentCivilite, setParentCivilite] = useState('Madame, Monsieur');
  const [parentNom, setParentNom] = useState('');
  const [parentPrenom, setParentPrenom] = useState('');
  const [eleveNom, setEleveNom] = useState('');
  const [elevePrenom, setElevePrenom] = useState('');
  const [classe, setClasse] = useState('');
  const [customClasse, setCustomClasse] = useState('');
  const [choix, setChoix] = useState<AutorisationChoice | ''>('');
  const [faitA, setFaitA] = useState('Charenton-le-Pont');
  const [faitLe, setFaitLe] = useState(new Date().toLocaleDateString('fr-FR'));

  const [activeTab, setActiveTab] = useState<'formulaire' | 'apercu'>('formulaire');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [submittedForm, setSubmittedForm] = useState<FormulaireItem | null>(null);

  const effectiveClasse = classe === 'AUTRE' ? customClasse : classe;

  const handleStart = () => {
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!parentNom.trim() || !parentPrenom.trim()) {
      setError('Veuillez renseigner le nom et le prénom du parent.');
      return;
    }
    if (!eleveNom.trim() || !elevePrenom.trim()) {
      setError('Veuillez renseigner le nom et le prénom de l’élève.');
      return;
    }
    if (!effectiveClasse.trim()) {
      setError('Veuillez sélectionner ou indiquer la classe de l’élève.');
      return;
    }
    if (!choix) {
      setError('Veuillez sélectionner l’une des 3 options d’autorisation (obligatoire).');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/formulaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentCivilite,
          parentNom,
          parentPrenom,
          eleveNom,
          elevePrenom,
          classe: effectiveClasse,
          choix,
          faitA,
          faitLe,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement du formulaire');
      }

      setSubmittedForm(data.formulaire);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l’envoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPrintFeedback(null);
    try {
      const targetId = document.getElementById('success-paper-document')
        ? 'success-paper-document'
        : submittedForm
        ? `paper-doc-${submittedForm.id}`
        : 'official-paper-document';

      const safeNom = (submittedForm?.eleveNom || eleveNom || 'ELEVE').toUpperCase();
      const safePrenom = submittedForm?.elevePrenom || elevePrenom || '';
      const safeId = submittedForm?.id || '2026';
      const filename = `NDM_Droit_Image_${safeNom}_${safePrenom}_${safeId}.pdf`;

      const blobUrl = await generatePdfFromElement(targetId, filename);
      setPdfDownloadUrl(blobUrl);
      setPrintFeedback('Votre document officiel A4 a été généré et téléchargé.');
    } catch (err: any) {
      console.error('Erreur PDF:', err);
      setPrintFeedback('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintFeedback(null);
    const targetId = document.getElementById('success-paper-document')
      ? 'success-paper-document'
      : submittedForm
      ? `paper-doc-${submittedForm.id}`
      : 'official-paper-document';

    const safeNom = (submittedForm?.eleveNom || eleveNom || 'ELEVE').toUpperCase();
    const safePrenom = submittedForm?.elevePrenom || elevePrenom || '';
    const safeId = submittedForm?.id || '2026';
    const filename = `NDM_Droit_Image_${safeNom}_${safePrenom}_${safeId}_A_IMPRIMER.pdf`;

    try {
      const res = await printDocumentOrElement(targetId, filename);
      if (res.blobUrl) {
        setPdfDownloadUrl(res.blobUrl);
      }
      setPrintFeedback(res.message || 'Document officiel A4 prêt pour impression.');
    } catch (err: any) {
      console.error('Erreur impression:', err);
      try {
        const blobUrl = await generatePdfFromElement(targetId, filename);
        setPdfDownloadUrl(blobUrl);
        setPrintFeedback('Document PDF A4 téléchargé pour impression directe.');
      } catch (e2) {
        setPrintFeedback("Erreur lors de la préparation de l'impression.");
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleResetForm = () => {
    setParentNom('');
    setParentPrenom('');
    setEleveNom('');
    setElevePrenom('');
    setClasse('');
    setCustomClasse('');
    setChoix('');
    setSubmittedForm(null);
    setPdfDownloadUrl(null);
    setPrintFeedback(null);
    setStep('form');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setStep('welcome')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <SchoolLogo size={36} showText={false} />
            </div>
            <div>
              <p className="font-serif font-bold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-blue-900 transition-colors">
                Notre Dame des Missions Saint Pierre
              </p>
              <p className="text-[11px] text-slate-500 font-sans leading-none">
                Portail officiel des formulaires administratifs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenAdminLogin}
              className="text-xs font-semibold px-3 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors border border-transparent hover:border-slate-300 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Accès Administration</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* STEP 1: WELCOME SCREEN (Section 3) */}
        {step === 'welcome' && (
          <div className="max-w-3xl mx-auto py-6 sm:py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
              {/* Institution Emblem */}
              <div className="flex flex-col items-center mb-6">
                <SchoolLogo size={130} showText={true} />
              </div>

              <div className="space-y-2 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 inline-block">
                  Année scolaire 2026 - 2027
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  Autorisation du droit à l'image
                </h1>
                <p className="text-sm font-medium text-slate-600">
                  Ensemble Scolaire Notre Dame des Missions Saint Pierre — Charenton-le-Pont
                </p>
              </div>

              {/* Deadline & Recipient Banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs sm:text-sm text-amber-950 font-medium flex items-center justify-center gap-2.5 mb-6 max-w-2xl mx-auto shadow-2xs">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <span>
                  Ce formulaire doit être remis à{' '}
                  <strong className="font-bold underline underline-offset-2">{config.destPersonne}</strong>{' '}
                  pour le{' '}
                  <strong className="font-bold underline underline-offset-2">{formatDisplayDate(config.dateLimite)}</strong>{' '}
                  au plus tard.
                </span>
              </div>

              {/* Explanatory text matching specs */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-left text-sm text-slate-700 leading-relaxed mb-8 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">
                      Ce formulaire permet aux parents ou représentants légaux de compléter en ligne l'autorisation relative à l'utilisation des photographies et vidéos des élèves.
                    </p>
                    <p className="text-slate-600 text-xs">
                      Conformément à la réglementation et à l'article 9 du code civil, le formulaire reprend 100 % du document papier officiel. Une fois complété, il génère un document PDF à l'identique, que vous imprimerez pour y apposer votre <strong>signature manuscrite</strong> avant de le transmettre à l'établissement.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Step Flow Explainer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-10 max-w-2xl mx-auto">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    1
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 mb-1">Remplir en ligne</h2>
                  <p className="text-xs text-slate-500 leading-normal">
                    Identité de l'élève, classe et choix d'autorisation.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    2
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 mb-1">Télécharger le PDF</h2>
                  <p className="text-xs text-slate-500 leading-normal">
                    Génération instantanée du modèle officiel conforme A4.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    3
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 mb-1">Signer et remettre</h2>
                  <p className="text-xs text-slate-500 leading-normal">
                    Signature manuscrite sur papier remis à l'école.
                  </p>
                </div>
              </div>

              {/* Primary Call to Action */}
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-8 py-4 bg-blue-800 hover:bg-blue-900 text-white text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 mx-auto cursor-pointer"
              >
                <span>Commencer le formulaire</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORM FILLING SCREEN (Section 4 to 8) */}
        {step === 'form' && (
          <div className="space-y-6">
            {/* Header / Mode Switch for desktop split / tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                  Formulaire d'autorisation — Droit à l'image
                </h1>
                <p className="text-xs text-slate-500">
                  Veuillez remplir l'ensemble des informations requises ci-dessous.
                </p>
              </div>

              {/* Toggle Formulaire / Aperçu direct */}
              <div className="flex bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('formulaire')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'formulaire'
                      ? 'bg-white text-blue-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Saisie du formulaire
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('apercu')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    activeTab === 'apercu'
                      ? 'bg-white text-blue-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Aperçu document A4
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Form View Tab */}
            {activeTab === 'formulaire' ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Remise Deadline Alert Banner */}
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs sm:text-sm text-amber-950 font-medium flex items-center gap-3 shadow-2xs">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>
                    Rappel : Ce formulaire doit être imprimé, signé et remis à{' '}
                    <strong className="font-bold underline underline-offset-2">{config.destPersonne}</strong>{' '}
                    pour le{' '}
                    <strong className="font-bold underline underline-offset-2">{formatDisplayDate(config.dateLimite)}</strong>{' '}
                    au plus tard.
                  </span>
                </div>

                {/* 1. Informations du parent (Section 4) */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Étape 1 sur 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      Informations du parent ou représentant légal
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Civilité
                      </label>
                      <select
                        value={parentCivilite}
                        onChange={(e) => setParentCivilite(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="Madame, Monsieur">Madame, Monsieur</option>
                        <option value="Madame">Madame</option>
                        <option value="Monsieur">Monsieur</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom du parent <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={parentNom}
                        onChange={(e) => setParentNom(e.target.value)}
                        placeholder="ex: DUPONT"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prénom du parent <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={parentPrenom}
                        onChange={(e) => setParentPrenom(e.target.value)}
                        placeholder="ex: Jean"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Informations de l'enfant (Section 4) */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Étape 2 sur 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      Informations concernant l'élève
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom de l'élève <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={eleveNom}
                        onChange={(e) => setEleveNom(e.target.value)}
                        placeholder="ex: DUPONT"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prénom de l'élève <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={elevePrenom}
                        onChange={(e) => setElevePrenom(e.target.value)}
                        placeholder="ex: Lucas"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Classe <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={classe}
                        onChange={(e) => setClasse(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Sélectionnez une classe...</option>
                        {config.classes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="AUTRE">Autre classe...</option>
                      </select>
                    </div>
                  </div>

                  {classe === 'AUTRE' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Précisez la classe <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customClasse}
                        onChange={(e) => setCustomClasse(e.target.value)}
                        placeholder="ex: Dispositif ULIS, BTS, etc."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Texte d'information juridique et Choix (Section 5 & 6) */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Étape 3 sur 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      Texte d'information et choix d'autorisation
                    </h2>
                  </div>

                  {/* Reproduce full legal notice matching paper scan */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 leading-relaxed font-serif space-y-3">
                    <p className="font-sans font-bold text-slate-800 text-[13px]">
                      Texte officiel de l'établissement :
                    </p>
                    <p>
                      Nous pouvons être amenés à utiliser, dans le cadre pédagogique, des photos et vidéos des élèves de l'établissement :
                    </p>
                    <div className="pl-6 space-y-0.5 text-slate-800 font-sans text-xs">
                      <p>• sur Internet</p>
                      <p>• dans différentes publications de l'école.</p>
                    </div>
                    <p>
                      La loi nous fait obligation d'avoir l'autorisation écrite des parents pour cette utilisation.
                    </p>
                    <div className="bg-white/80 p-3 rounded border border-slate-200 space-y-1 text-slate-900">
                      <p className="font-semibold font-sans">L'article 9 du code civil dispose :</p>
                      <p>« • Chacun a droit au respect de sa vie privée. »</p>
                      <p>« • ... Toute personne peut interdire la reproduction de ses traits... »</p>
                      <p>« • C'est à celui qui reproduit l'image d'apporter la preuve de l'autorisation... »</p>
                    </div>
                    <p>
                      S'agissant de mineurs, ce droit à l'image, mais aussi de façon plus générale, au respect de sa personne, est d'application stricte.
                    </p>
                    <p>
                      En conséquence, <strong>aucune photo ou vidéo d'élèves reconnaissables ne pourra être publiée sur le Web sans une autorisation écrite de ses parents</strong> (ou tuteurs, responsables), qui sera valable pour l'année scolaire 2026-2027.
                    </p>
                    <p className="italic text-slate-600">
                      Aussi nous vous demandons de bien vouloir cocher la case de votre choix ci-dessous.
                    </p>
                  </div>

                  {/* 3 Mutually Exclusive Choices (Section 6) */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Sélectionnez obligatoirement votre choix <span className="text-rose-600">*</span>
                    </label>

                    {/* Choix 1 */}
                    <label
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        choix === 'interne'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="autorisation_choice"
                          value="interne"
                          checked={choix === 'interne'}
                          onChange={() => setChoix('interne')}
                          className="mt-1 w-4 h-4 text-blue-700 focus:ring-blue-600"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900">
                            Choix 1 : Autorisation pour la communication interne
                          </p>
                          <p className="text-xs text-slate-700 leading-normal">
                            J'autorise l'établissement à diffuser ou reproduire pour sa communication{' '}
                            <span className="font-semibold underline">interne</span> (Journal INFO NDM, publications du collège/lycée/école...) les photos et/ou vidéos représentant mon enfant. Cette autorisation est donnée pour tout type de support écrit ou électronique et pour une durée d'un an.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Choix 2 */}
                    <label
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        choix === 'internet'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="autorisation_choice"
                          value="internet"
                          checked={choix === 'internet'}
                          onChange={() => setChoix('internet')}
                          className="mt-1 w-4 h-4 text-blue-700 focus:ring-blue-600"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900">
                            Choix 2 : Autorisation pour diffusion Internet et cours
                          </p>
                          <p className="text-xs text-slate-700 leading-normal">
                            J'autorise l'établissement à diffuser les photos et vidéos de mon enfant sur Internet pour l'année scolaire en cours.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Choix 3 */}
                    <label
                      className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        choix === 'refus'
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <input
                          type="radio"
                          name="autorisation_choice"
                          value="refus"
                          checked={choix === 'refus'}
                          onChange={() => setChoix('refus')}
                          className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-rose-900">
                            Choix 3 : Refus strict d'utilisation
                          </p>
                          <p className="text-xs text-rose-800 leading-normal">
                            Je refuse que l'établissement utilise des photos et vidéos de mon enfant.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Date, Lieu et Mention Signature Manuscrite (Section 7 & 8) */}
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      Étape 4 sur 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      Lieu, date et signature manuscrite
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fait à :
                      </label>
                      <input
                        type="text"
                        value={faitA}
                        onChange={(e) => setFaitA(e.target.value)}
                        placeholder="Charenton-le-Pont"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Le : (Date du jour)
                      </label>
                      <input
                        type="text"
                        value={faitLe}
                        onChange={(e) => setFaitLe(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Section 8 Mandate: Signature manuscrite obligatoire */}
                  <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
                    <PenTool className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-sm mb-0.5 text-amber-900">
                        Signature manuscrite requise après impression
                      </span>
                      <p className="text-amber-800 leading-normal">
                        Aucune signature électronique n'est demandée en ligne. Après validation, votre formulaire PDF conforme A4 sera généré. Vous devrez{' '}
                        <strong>l'imprimer, y apposer votre signature manuscrite à la main</strong> dans la zone réservée, puis le remettre à l'établissement ou à l'enseignant de votre enfant.
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('apercu')}
                      className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualiser le document avant validation
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Enregistrement en cours...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Valider et générer mon formulaire officiel</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Live Preview Tab */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>
                      Aperçu fidèle du document officiel A4 tel qu'il sera généré et imprimé.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('formulaire')}
                      className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                    >
                      Retourner au formulaire
                    </button>
                  </div>
                </div>

                <div className="flex justify-center p-2 sm:p-6 bg-slate-200/60 rounded-xl overflow-x-auto">
                  <PaperDocument
                    parentNom={parentNom}
                    parentPrenom={parentPrenom}
                    eleveNom={eleveNom}
                    elevePrenom={elevePrenom}
                    classe={effectiveClasse}
                    choix={choix}
                    faitA={faitA}
                    faitLe={faitLe}
                    destPersonne={config.destPersonne}
                    dateLimite={config.dateLimite}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS & DOWNLOAD SCREEN (Section 8 & 25) */}
        {step === 'success' && submittedForm && (
          <div className="max-w-4xl mx-auto py-4 space-y-6">
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-emerald-950">
                Votre formulaire a bien été enregistré
              </h2>
              <div className="inline-block bg-white px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-700 border border-emerald-200">
                RÉFÉRENCE N° {submittedForm.id}
              </div>
              <p className="text-sm text-emerald-900 max-w-xl mx-auto leading-relaxed">
                Votre document PDF officiel est maintenant disponible.
                <br />
                <strong className="font-bold">
                  Important : vous devez imprimer ce document et le signer manuellement avant de le remettre à l'établissement.
                </strong>
              </p>

              {/* Deadline reminder notice */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 max-w-xl mx-auto flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  À remettre à <strong>{config.destPersonne}</strong> pour le{' '}
                  <strong>{formatDisplayDate(config.dateLimite)}</strong> au plus tard.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf || isPrinting}
                  className="px-6 py-3.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  {isGeneratingPdf ? 'Génération du PDF...' : 'Télécharger le PDF (A4)'}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrinting || isGeneratingPdf}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-xl border border-slate-300 shadow-xs flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-700 animate-spin" />
                      <span>Préparation de l'impression...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 text-slate-700" />
                      <span>Imprimer le document (A4)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-3.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Remplir pour un autre enfant
                </button>
              </div>

              {printFeedback && (
                <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs px-4 py-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{printFeedback}</span>
                  </div>
                  {pdfDownloadUrl && (
                    <a
                      href={pdfDownloadUrl}
                      download={`NDM_Droit_Image_${(submittedForm?.eleveNom || eleveNom || 'ELEVE').toUpperCase()}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-blue-800 hover:text-blue-950 shrink-0 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-blue-200 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ouvrir / Ré-ouvrir le PDF</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Complete Official Paper Preview */}
            <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl shadow-inner">
              <p className="text-center text-xs font-semibold text-slate-600 mb-4 uppercase tracking-wider">
                Exemplaire prêt pour impression et signature manuscrite :
              </p>
              <div id="success-paper-document" className="flex justify-center overflow-x-auto">
                <PaperDocument
                  id={submittedForm.id}
                  parentNom={submittedForm.parentNom}
                  parentPrenom={submittedForm.parentPrenom}
                  eleveNom={submittedForm.eleveNom}
                  elevePrenom={submittedForm.elevePrenom}
                  classe={submittedForm.classe}
                  choix={submittedForm.choix}
                  faitA={submittedForm.faitA}
                  faitLe={submittedForm.faitLe}
                  destPersonne={config.destPersonne}
                  dateLimite={config.dateLimite}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hidden Paper Document Container used for PDF generation in Step 2 preview if needed */}
        {step !== 'success' && (
          <div className="fixed -left-[9999px] top-0 pointer-events-none print:hidden" aria-hidden="true">
            <div id="official-paper-document">
              <PaperDocument
                id="live-template-document"
                parentNom={parentNom}
                parentPrenom={parentPrenom}
                eleveNom={eleveNom}
                elevePrenom={elevePrenom}
                classe={effectiveClasse}
                choix={choix}
                faitA={faitA}
                faitLe={faitLe}
                destPersonne={config.destPersonne}
                dateLimite={config.dateLimite}
                isPrintOnly={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-700">
            Ensemble Scolaire Notre Dame des Missions Saint Pierre
          </p>
          <p className="text-[11px]">
            4 rue du Président Kennedy – 96 rue de Paris, 94220 Charenton-le-Pont • Tél : 01 43 68 05 28
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Conformité Droit à l'Image et Respect de la vie privée (Article 9 du Code civil)
          </p>
        </div>
      </footer>
    </div>
  );
};
