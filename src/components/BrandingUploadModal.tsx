import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  FileCheck,
  AlertCircle,
  Eye,
  Sliders,
  PenTool,
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { SchoolLogo } from './SchoolLogo';
import { SchoolSignature } from './SchoolSignature';

export const BrandingUploadModal: React.FC = () => {
  const {
    logoUrl,
    signatureUrl,
    updateLogo,
    updateSignature,
    resetBranding,
    isUploadModalOpen,
    activeUploadTab,
    closeUploadModal,
  } = useBranding();

  const [currentTab, setCurrentTab] = useState<'logo' | 'signature'>('logo');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isUploadModalOpen) {
      setCurrentTab(activeUploadTab);
      setLogoPreview(logoUrl);
      setSignaturePreview(signatureUrl);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isUploadModalOpen, activeUploadTab, logoUrl, signatureUrl]);

  // Support pasting image from clipboard anywhere inside modal
  useEffect(() => {
    if (!isUploadModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileProcess(file, currentTab);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isUploadModalOpen, currentTab]);

  if (!isUploadModalOpen) return null;

  const handleFileProcess = (file: File, target: 'logo' | 'signature') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('L’image est trop volumineuse (maximum 15 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (target === 'logo') {
        setLogoPreview(result);
        setSuccessMsg('Nouvelle image du logo chargée ! Cliquez sur « Enregistrer le logo » pour appliquer.');
      } else {
        setSignaturePreview(result);
        setSuccessMsg('Nouvelle image de signature chargée ! Cliquez sur « Enregistrer la signature » pour appliquer.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erreur lors de la lecture du fichier.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateLogo(logoPreview);
      setSuccessMsg('Logo mis à jour avec succès ! Il est désormais utilisé sur tous les formulaires et PDF.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la sauvegarde du logo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignature = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateSignature(signaturePreview);
      setSuccessMsg('Signature mise à jour avec succès ! Elle est désormais utilisée sur tous les formulaires et PDF.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la sauvegarde de la signature.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (target: 'logo' | 'signature') => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await resetBranding(target);
      if (target === 'logo') {
        setLogoPreview(null);
        setSuccessMsg('Logo réinitialisé au visuel vectoriel officiel.');
      } else {
        setSignaturePreview(null);
        setSuccessMsg('Signature réinitialisée au tracé manuscrit vectoriel officiel.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="branding-upload-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Personnalisation du Logo & de la Signature
              </h2>
              <p className="text-xs text-slate-300">
                Téléversez vos propres images (PNG, JPG) pour les appliquer directement aux formulaires et aux PDF
              </p>
            </div>
          </div>
          <button
            onClick={closeUploadModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setCurrentTab('logo');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              currentTab === 'logo'
                ? 'border-blue-700 text-blue-950'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. Logo de l'établissement</span>
            {logoUrl && (
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Personnalisé
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTab('signature');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              currentTab === 'signature'
                ? 'border-blue-700 text-blue-950'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>2. Signature de Mikael JOUBIN</span>
            {signatureUrl && (
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Personnalisée
              </span>
            )}
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* TAB 1: LOGO UPLOAD */}
          {currentTab === 'logo' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Téléverser l'image officielle du Logo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Glissez-déposez ou sélectionnez votre fichier image (ex. votre capture d'écran du logo avec le globe et la mention « Grandir Ensemble »).
                  </p>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleReset('logo')}
                    disabled={isSaving}
                    className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rétablir logo par défaut</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(true);
                }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0], 'logo');
                  }
                }}
                onClick={() => logoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDraggingLogo
                    ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0], 'logo');
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Glissez votre image ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, WebP ou SVG (Conseillé : fond transparent ou blanc)
                </p>
                <p className="text-[11px] text-blue-700 font-semibold mt-2">
                  Astuce : vous pouvez aussi coller une capture d'écran directement avec Ctrl+V
                </p>
              </div>

              {/* Live Comparison / Preview */}
              <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Aperçu du rendu du Logo dans les formulaires et PDF :
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 bg-white p-5 rounded-lg border border-slate-200">
                  <div className="text-center space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {logoPreview ? 'Votre Logo Téléversé (Actif)' : 'Logo Vectoriel par défaut'}
                    </span>
                    <div className="h-32 flex items-center justify-center p-2 border border-slate-100 rounded-lg bg-white shadow-2xs">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo personnalisé téléversé"
                          className="max-h-28 max-w-[170px] object-contain"
                        />
                      ) : (
                        <SchoolLogo size={105} showText={true} />
                      )}
                    </div>
                  </div>

                  <div className="text-left max-w-xs space-y-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Où apparaîtra ce logo ?
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>En-tête principal de la page d'accueil</li>
                      <li>Haut du formulaire de saisie des parents</li>
                      <li>Document officiel papier A4 à imprimer</li>
                      <li>Exportation en fichier PDF de haute qualité</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSaving || logoPreview === logoUrl}
                  onClick={handleSaveLogo}
                  className="px-6 py-2.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer le Logo'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGNATURE UPLOAD */}
          {currentTab === 'signature' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Téléverser l'image officielle de la Signature (Mikael JOUBIN)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Glissez-déposez ou sélectionnez votre fichier image (ex. votre capture d'écran du paraphe bleu manuscrit).
                  </p>
                </div>
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => handleReset('signature')}
                    disabled={isSaving}
                    className="text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rétablir signature par défaut</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingSignature(true);
                }}
                onDragLeave={() => setIsDraggingSignature(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSignature(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0], 'signature');
                  }
                }}
                onClick={() => signatureInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDraggingSignature
                    ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0], 'signature');
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <PenTool className="w-6 h-6" />
                </div>

                <p className="text-sm font-bold text-slate-800">
                  Glissez votre image de signature ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, WebP ou SVG (Conseillé : fond transparent ou blanc)
                </p>
                <p className="text-[11px] text-blue-700 font-semibold mt-2">
                  Astuce : vous pouvez aussi coller directement avec Ctrl+V
                </p>
              </div>

              {/* Live Comparison / Preview */}
              <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Aperçu du bloc signature officiel tel qu'imprimé sur le document A4 :
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 bg-white p-5 rounded-lg border border-slate-200">
                  <div className="text-center space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {signaturePreview ? 'Votre Signature Téléversée' : 'Signature vectorielle par défaut'}
                    </span>
                    <div className="p-4 border border-slate-100 rounded-lg bg-white shadow-2xs inline-block text-left min-w-[220px]">
                      <span className="font-bold text-[13px] text-black tracking-tight leading-tight block">
                        Mikael JOUBIN
                      </span>
                      <span className="text-[12px] text-black tracking-tight leading-tight block">
                        Responsable Informatique
                      </span>
                      <div className="mt-1">
                        {signaturePreview ? (
                          <img
                            src={signaturePreview}
                            alt="Signature personnalisée de Mikael JOUBIN"
                            className="max-h-20 max-w-[200px] object-contain"
                          />
                        ) : (
                          <SchoolSignature width={160} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left max-w-xs space-y-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Précision d'impression
                    </p>
                    <p>
                      La signature apparaît dans le cartouche gauche du document sous la mention <em>« Mikael JOUBIN / Responsable Informatique »</em>.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      La zone de droite reste quant à elle réservée à la signature manuscrite des parents après impression papier.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSaving || signaturePreview === signatureUrl}
                  onClick={handleSaveSignature}
                  className="px-6 py-2.5 bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer la Signature'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
