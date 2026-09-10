import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, Clock, HelpCircle, Save, Loader2 } from 'lucide-react';
import { FormulaireItem, FormulaireStatut } from '../types';
import { PaperDocument } from './PaperDocument';
import { generatePdfFromElement, printDocumentOrElement } from '../utils/pdfGenerator';

interface FormulaireDetailModalProps {
  formulaire: FormulaireItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, statut: FormulaireStatut, notes?: string) => Promise<void>;
  destPersonne?: string;
  dateLimite?: string;
}

export const FormulaireDetailModal: React.FC<FormulaireDetailModalProps> = ({
  formulaire,
  isOpen,
  onClose,
  onUpdateStatus,
  destPersonne,
  dateLimite,
}) => {
  if (!isOpen || !formulaire) return null;

  const [currentStatut, setCurrentStatut] = useState<FormulaireStatut>(formulaire.statut);
  const [notes, setNotes] = useState<string>(formulaire.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus(formulaire.id, currentStatut, notes);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePdfFromElement(
        `paper-doc-detail-${formulaire.id}`,
        `NDM_Droit_Image_${formulaire.eleveNom}_${formulaire.elevePrenom}_${formulaire.id}.pdf`
      );
    } catch (e) {
      console.error('PDF error', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintModal = async () => {
    setIsPrinting(true);
    try {
      await printDocumentOrElement(
        `paper-doc-detail-${formulaire.id}`,
        `NDM_Droit_Image_${formulaire.eleveNom}_${formulaire.elevePrenom}_${formulaire.id}_A_IMPRIMER.pdf`
      );
    } catch (e) {
      console.error('Print modal error', e);
      try {
        await generatePdfFromElement(
          `paper-doc-detail-${formulaire.id}`,
          `NDM_Droit_Image_${formulaire.eleveNom}_${formulaire.elevePrenom}_${formulaire.id}.pdf`
        );
      } catch (e2) {
        console.error('PDF fallback error', e2);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const getChoixLabel = (c: string) => {
    switch (c) {
      case 'interne':
        return 'Autorisation interne (Journal INFO NDM, publications école)';
      case 'internet':
        return 'Autorisation Internet (diffusion sur le Web / cours)';
      case 'refus':
        return 'Refus d’utilisation photos et vidéos';
      default:
        return c;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                N° {formulaire.id}
              </span>
              <h2 className="text-lg font-bold">
                {formulaire.eleveNom} {formulaire.elevePrenom}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Classe : {formulaire.classe}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enregistré le {new Date(formulaire.dateCreation).toLocaleDateString('fr-FR')} • Fait à {formulaire.faitA} le {formulaire.faitLe}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'details' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Fiche administrative
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Aperçu document A4
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grow overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Main Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Représentant Légal
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">Nom complet :</span>
                      <span className="font-semibold text-slate-900">
                        {formulaire.parentCivilite} {formulaire.parentNom} {formulaire.parentPrenom}
                      </span>
                    </div>
                    {formulaire.parentEmail && (
                      <div>
                        <span className="text-slate-500 text-xs block">E-mail :</span>
                        <a href={`mailto:${formulaire.parentEmail}`} className="text-blue-700 hover:underline">
                          {formulaire.parentEmail}
                        </a>
                      </div>
                    )}
                    {formulaire.parentTelephone && (
                      <div>
                        <span className="text-slate-500 text-xs block">Téléphone :</span>
                        <span className="text-slate-800">{formulaire.parentTelephone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Élève Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Élève concerné
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">Élève :</span>
                      <span className="font-semibold text-slate-900">
                        {formulaire.eleveNom} {formulaire.elevePrenom}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Classe :</span>
                      <span className="inline-block font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {formulaire.classe}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Décision Choice Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Décision Droit à l'Image
                </h3>
                <div className="space-y-3">
                  <div
                    className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                      formulaire.choix === 'interne'
                        ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-medium'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="w-4 h-4 mt-0.5 border border-current rounded-xs flex items-center justify-center font-bold text-xs">
                      {formulaire.choix === 'interne' ? '✓' : ''}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Communication interne uniquement</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Diffusion ou reproduction pour la communication interne (Journal INFO NDM, publications du collège/lycée/école...).
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                      formulaire.choix === 'internet'
                        ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-medium'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="w-4 h-4 mt-0.5 border border-current rounded-xs flex items-center justify-center font-bold text-xs">
                      {formulaire.choix === 'internet' ? '✓' : ''}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Diffusion sur Internet et publications</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Diffusion des photos et vidéos de l'enfant sur Internet pour l'année scolaire en cours.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                      formulaire.choix === 'refus'
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-medium'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="w-4 h-4 mt-0.5 border border-current rounded-xs flex items-center justify-center font-bold text-xs">
                      {formulaire.choix === 'refus' ? '✓' : ''}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-rose-900">Refus d'utilisation</p>
                      <p className="text-xs text-rose-800 mt-0.5">
                        Refuse que l'établissement utilise des photos et vidéos de l'enfant.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suivi du Document Papier & Statut */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Suivi du document papier signé
                  </h3>
                  <span className="text-xs text-slate-500">
                    Statut actuel :{' '}
                    <strong className="text-slate-900">
                      {currentStatut === 'signe_recu'
                        ? '🟢 Signé reçu'
                        : currentStatut === 'a_recuperer'
                        ? '🔵 À récupérer'
                        : currentStatut === 'a_imprimer'
                        ? '🟠 À imprimer'
                        : '🔴 Problème'}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStatut('signe_recu')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      currentStatut === 'signe_recu'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">🟢 Signé reçu</p>
                      <p className="text-[10px] text-slate-500">Papier remis et signé</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStatut('a_recuperer')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      currentStatut === 'a_recuperer'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">🔵 À récupérer</p>
                      <p className="text-[10px] text-slate-500">En attente retour parent</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStatut('a_imprimer')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      currentStatut === 'a_imprimer'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">🟠 À imprimer</p>
                      <p className="text-[10px] text-slate-500">Rempli en ligne</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStatut('probleme')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                      currentStatut === 'probleme'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">🔴 Problème</p>
                      <p className="text-[10px] text-slate-500">Incomplet / à revoir</p>
                    </div>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Notes administratives internes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observations, relance effectuée, signature reçue par la vie scolaire..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Enregistrement...' : 'Mettre à jour le statut'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[210mm] shadow-lg rounded bg-white overflow-hidden p-2 mb-4">
                <PaperDocument
                  id={`detail-${formulaire.id}`}
                  parentNom={formulaire.parentNom}
                  parentPrenom={formulaire.parentPrenom}
                  eleveNom={formulaire.eleveNom}
                  elevePrenom={formulaire.elevePrenom}
                  classe={formulaire.classe}
                  choix={formulaire.choix}
                  faitA={formulaire.faitA}
                  faitLe={formulaire.faitLe}
                  destPersonne={destPersonne}
                  dateLimite={dateLimite}
                />
              </div>
            </div>
          )}

          {/* Hidden element for PDF capture when on details tab */}
          <div className="fixed -left-[9999px] top-0 pointer-events-none print:hidden" aria-hidden="true">
            <div id={`paper-doc-detail-${formulaire.id}`}>
              <PaperDocument
                id={`export-${formulaire.id}`}
                parentNom={formulaire.parentNom}
                parentPrenom={formulaire.parentPrenom}
                eleveNom={formulaire.eleveNom}
                elevePrenom={formulaire.elevePrenom}
                classe={formulaire.classe}
                choix={formulaire.choix}
                faitA={formulaire.faitA}
                faitLe={formulaire.faitLe}
                destPersonne={destPersonne}
                dateLimite={dateLimite}
                isPrintOnly={true}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Format officiel conforme A4 • Modèle Notre Dame des Missions
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPdf ? 'Génération...' : 'Télécharger le PDF'}
            </button>
            <button
              type="button"
              onClick={handlePrintModal}
              disabled={isPrinting || isGeneratingPdf}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {isPrinting ? 'Impression...' : 'Imprimer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
