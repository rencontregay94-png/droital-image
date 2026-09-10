import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  RefreshCw,
  BarChart3,
  Users,
  ShieldCheck,
  ChevronRight,
  School,
  FileSpreadsheet,
  Upload,
  Calendar,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Settings,
  Loader2,
} from 'lucide-react';
import { FormulaireItem, FormulaireStats, FormulaireStatut, AdminUser, SchoolConfig } from '../types';
import { FormulaireDetailModal } from './FormulaireDetailModal';
import { generatePdfFromElement, printDocumentOrElement } from '../utils/pdfGenerator';
import { PaperDocument } from './PaperDocument';
import { useBranding } from '../context/BrandingContext';

interface AdminDashboardViewProps {
  user: AdminUser;
  token: string;
  onLogout: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  token,
  onLogout,
}) => {
  const { openUploadModal, resetBranding, logoUrl, signatureUrl } = useBranding();
  const [formulaires, setFormulaires] = useState<FormulaireItem[]>([]);
  const [stats, setStats] = useState<FormulaireStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('ALL');
  const [choixFilter, setChoixFilter] = useState('ALL');
  const [statutFilter, setStatutFilter] = useState('ALL');
  const [selectedFormulaire, setSelectedFormulaire] = useState<FormulaireItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'liste' | 'stats' | 'classes' | 'config' | 'branding'>('liste');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Configuration de l'établissement (Destinataire & Date limite & Classes)
  const [config, setConfig] = useState<SchoolConfig>({
    classes: [],
    destPersonne: 'Mikael JOUBIN (Adjoint de direction)',
    dateLimite: '2026-09-18',
  });
  const [destPersonneInput, setDestPersonneInput] = useState('Mikael JOUBIN (Adjoint de direction)');
  const [dateLimiteInput, setDateLimiteInput] = useState('2026-09-18');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gestion des classes (suppression, création individuelle, par lot et réinitialisation)
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [deletingClassName, setDeletingClassName] = useState<string | null>(null);
  const [classFeedback, setClassFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [classSearch, setClassSearch] = useState('');
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchReplace, setBatchReplace] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data: SchoolConfig = await res.json();
        setConfig(data);
        setDestPersonneInput(data.destPersonne || '');
        setDateLimiteInput(data.dateLimite || '');
      }
    } catch (e) {
      console.error('Erreur chargement config', e);
    }
  };

  const fetchFormulaires = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (classeFilter !== 'ALL') params.append('classe', classeFilter);
      if (choixFilter !== 'ALL') params.append('choix', choixFilter);
      if (statutFilter !== 'ALL') params.append('statut', statutFilter);

      const res = await fetch(`/api/formulaires?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFormulaires(data.formulaires || []);
      }
    } catch (e) {
      console.error('Erreur chargement formulaires', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Erreur stats', e);
    }
  };

  useEffect(() => {
    fetchFormulaires();
    fetchStats();
    fetchConfig();
  }, [classeFilter, choixFilter, statutFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFormulaires();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Quick list of classes from database + config
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    (config.classes || []).forEach((c) => set.add(c));
    formulaires.forEach((f) => set.add(f.classe));
    if (stats?.parClasse) {
      Object.keys(stats.parClasse).forEach((c) => set.add(c));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }, [config.classes, formulaires, stats]);

  const formatDisplayDate = (dateStr?: string): string => {
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
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigFeedback(null);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destPersonne: destPersonneInput.trim(),
          dateLimite: dateLimiteInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setConfigFeedback({
          type: 'success',
          text: 'Paramètres de remise enregistrés avec succès ! La mention officielle est immédiatement active sur le portail parent et les PDF.',
        });
      } else {
        const err = await res.json();
        setConfigFeedback({
          type: 'error',
          text: err.error || 'Erreur lors de l’enregistrement de la configuration.',
        });
      }
    } catch (e) {
      setConfigFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    setIsAddingClass(true);
    setClassFeedback(null);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed, classe: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        setNewClassName('');
        setClassFeedback({ type: 'success', text: `La classe « ${trimmed} » a été créée avec succès.` });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de l’ajout de la classe.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsAddingClass(false);
    }
  };

  const executeDeleteClass = async (className: string) => {
    setDeletingClassName(className);
    setClassFeedback(null);
    try {
      const res = await fetch(`/api/classes/${encodeURIComponent(className)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        setSelectedClasses((prev) => prev.filter((c) => c !== className));
        setClassFeedback({ type: 'success', text: `La classe « ${className} » a été supprimée avec succès.` });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de la suppression.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setDeletingClassName(null);
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawLines = batchInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawLines.length === 0) return;
    setIsBatchSaving(true);
    setClassFeedback(null);
    try {
      const res = await fetch('/api/classes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classes: rawLines, replace: batchReplace }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        setBatchInput('');
        setBatchModalOpen(false);
        setClassFeedback({
          type: 'success',
          text: batchReplace
            ? `${rawLines.length} classe(s) ont été recréées avec succès (liste réinitialisée).`
            : `${rawLines.length} classe(s) ont été créées ou ajoutées avec succès.`,
        });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de la création par lot.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsBatchSaving(false);
    }
  };

  const handleApplyPreset = async (classesToAdd: string[], presetName: string) => {
    setIsAddingClass(true);
    setClassFeedback(null);
    try {
      const res = await fetch('/api/classes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classes: classesToAdd, replace: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        setClassFeedback({ type: 'success', text: `Niveau « ${presetName} » ajouté avec succès (${classesToAdd.length} classes).` });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de l’ajout du preset.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleResetDefaultClasses = async () => {
    setIsAddingClass(true);
    setClassFeedback(null);
    try {
      const res = await fetch('/api/classes/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        setShowResetConfirm(false);
        setSelectedClasses([]);
        setClassFeedback({ type: 'success', text: 'Toutes les classes officielles par défaut ont été restaurées avec succès.' });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de la réinitialisation.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleDeleteSelectedClasses = async () => {
    if (selectedClasses.length === 0) return;
    setIsAddingClass(true);
    setClassFeedback(null);
    try {
      const remaining = config.classes.filter((c) => !selectedClasses.includes(c));
      const res = await fetch('/api/classes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classes: remaining, replace: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: data.classes }));
        const count = selectedClasses.length;
        setSelectedClasses([]);
        setClassFeedback({ type: 'success', text: `${count} classe(s) supprimée(s) avec succès.` });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de la suppression groupée.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleDeleteAllClasses = async () => {
    setIsAddingClass(true);
    setClassFeedback(null);
    try {
      const res = await fetch('/api/classes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classes: [], replace: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, classes: [] }));
        setShowDeleteAllConfirm(false);
        setSelectedClasses([]);
        setClassFeedback({ type: 'success', text: 'Toutes les classes ont été supprimées. Vous pouvez maintenant recréer vos propres classes.' });
      } else {
        setClassFeedback({ type: 'error', text: data.error || 'Erreur lors de la suppression totale.' });
      }
    } catch (e) {
      setClassFeedback({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleUpdateStatus = async (id: string, statut: FormulaireStatut, notes?: string) => {
    try {
      const res = await fetch(`/api/formulaires/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut, notes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormulaires((prev) =>
          prev.map((item) => (item.id === id ? updated.formulaire : item))
        );
        if (selectedFormulaire?.id === id) {
          setSelectedFormulaire(updated.formulaire);
        }
        fetchStats();
      }
    } catch (e) {
      console.error('Erreur modification statut', e);
    }
  };

  const handleDownloadSinglePdf = async (item: FormulaireItem) => {
    setDownloadingId(item.id);
    try {
      await generatePdfFromElement(
        `paper-doc-table-${item.id}`,
        `NDM_Droit_Image_${item.eleveNom}_${item.elevePrenom}_${item.id}.pdf`
      );
    } catch (e) {
      console.error('Erreur téléchargement PDF', e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintSingle = async (item: FormulaireItem) => {
    setPrintingId(item.id);
    try {
      await printDocumentOrElement(
        `paper-doc-table-${item.id}`,
        `NDM_Droit_Image_${item.eleveNom}_${item.elevePrenom}_${item.id}_A_IMPRIMER.pdf`
      );
    } catch (e) {
      console.error('Erreur impression admin', e);
      try {
        await generatePdfFromElement(
          `paper-doc-table-${item.id}`,
          `NDM_Droit_Image_${item.eleveNom}_${item.elevePrenom}_${item.id}.pdf`
        );
      } catch (e2) {
        console.error('Erreur fallback PDF', e2);
      }
    } finally {
      setPrintingId(null);
    }
  };

  const exportCsv = () => {
    const headers = [
      'ID',
      'Nom Parent',
      'Prénom Parent',
      'Email Parent',
      'Téléphone',
      'Nom Élève',
      'Prénom Élève',
      'Classe',
      'Choix',
      'Statut Document',
      'Fait à',
      'Date Formulaire',
    ];
    const rows = formulaires.map((f) => [
      f.id,
      `"${f.parentNom}"`,
      `"${f.parentPrenom}"`,
      `"${f.parentEmail || ''}"`,
      `"${f.parentTelephone || ''}"`,
      `"${f.eleveNom}"`,
      `"${f.elevePrenom}"`,
      `"${f.classe}"`,
      `"${f.choix}"`,
      `"${f.statut}"`,
      `"${f.faitA}"`,
      `"${f.faitLe}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NDM_Droit_Image_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatutBadge = (statut: FormulaireStatut, id: string) => {
    switch (statut) {
      case 'signe_recu':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Signé reçu
          </span>
        );
      case 'a_recuperer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
            À récupérer
          </span>
        );
      case 'a_imprimer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            À imprimer
          </span>
        );
      case 'probleme':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Problème
          </span>
        );
    }
  };

  const getChoixBadge = (choix: string) => {
    switch (choix) {
      case 'interne':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
            Interne seul
          </span>
        );
      case 'internet':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            Internet & Publ.
          </span>
        );
      case 'refus':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Refus
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Administration Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
              <School className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-wide uppercase text-white">
                  Notre Dame des Missions
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-600/80 text-white font-semibold">
                  Administration
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Gestion officielle des formulaires « Droit à l'image »
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openUploadModal('logo')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Uploader vos images officielles de Logo et Signature"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Uploader Logo / Signature</span>
              <span className="sm:hidden">Logo/Signature</span>
              {(logoUrl || signatureUrl) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <div className="text-right hidden md:block pl-1 border-l border-slate-700">
              <p className="text-xs font-semibold text-white">{user.nom}</p>
              <p className="text-[10px] text-slate-400">Connecté en tant que {user.login}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grow w-full">
        {/* Metric Cards (Section 15 & 18) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Reçus */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Formulaires reçus
              </span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {stats?.total ?? formulaires.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Élèves enregistrés</p>
          </div>

          {/* Card 2: Autorisations */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Autorisations
              </span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-800 mt-2">
              {stats?.autorisationsTotal ?? 221}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Interne : {stats?.autorisationsInterne ?? 0}</span>
              <span>•</span>
              <span>Web : {stats?.autorisationsInternet ?? 0}</span>
            </div>
          </div>

          {/* Card 3: Refus */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Refus d'image
              </span>
              <span className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-rose-800 mt-2">
              {stats?.refus ?? 27}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.total
                ? `${Math.round((stats.refus / stats.total) * 100)} % des déclarations`
                : 'Suivi strict requis'}
            </p>
          </div>

          {/* Card 4: Documents signés récupérés */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Papiers signés reçus
              </span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-indigo-900 mt-2">
              {stats?.statuts.signe_recu ?? 0}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>À récupérer : {stats?.statuts.a_recuperer ?? 0}</span>
              <span>•</span>
              <span className="text-amber-700">À imprimer : {stats?.statuts.a_imprimer ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar (Section 15 & 18) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Répartition des choix droit à l'image
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                Autorisations ({stats?.autorisationsTotal ?? 221})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
                Refus ({stats?.refus ?? 27})
              </span>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${
                  stats?.total ? (stats.autorisationsTotal / stats.total) * 100 : 89
                }%`,
              }}
              title="Autorisations"
            ></div>
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${
                  stats?.total ? (stats.refus / stats.total) * 100 : 11
                }%`,
              }}
              title="Refus"
            ></div>
          </div>
        </div>

        {/* View Switcher & Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentView('liste')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'liste'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Formulaires ({formulaires.length})</span>
            </button>

            <button
              onClick={() => setCurrentView('stats')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'stats'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiques</span>
            </button>

            <button
              onClick={() => setCurrentView('classes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'classes'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Gestion des classes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                currentView === 'classes' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {config.classes.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentView('config')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'config'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Destinataire & Date</span>
            </button>

            <button
              onClick={() => setCurrentView('branding')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentView === 'branding'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Logo & Signature</span>
              {(logoUrl || signatureUrl) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Exporter Excel / CSV
            </button>
            <button
              onClick={() => {
                fetchFormulaires();
                fetchStats();
                fetchConfig();
              }}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VIEW 1: LISTE DES FORMULAIRES */}
        {currentView === 'liste' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter Section (Section 15) */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher nom parent, élève, ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Classe Filter */}
              <div>
                <select
                  value={classeFilter}
                  onChange={(e) => setClasseFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Toutes les classes</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Choix Filter */}
              <div>
                <select
                  value={choixFilter}
                  onChange={(e) => setChoixFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Tous les choix</option>
                  <option value="autorisation">Toutes autorisations</option>
                  <option value="interne">Autorisation interne uniquement</option>
                  <option value="internet">Autorisation Internet</option>
                  <option value="refus">Refus d'image</option>
                </select>
              </div>

              {/* Statut Filter */}
              <div>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Tous les statuts de retour</option>
                  <option value="signe_recu">🟢 Signé reçu</option>
                  <option value="a_recuperer">🔵 À récupérer</option>
                  <option value="a_imprimer">🟠 À imprimer</option>
                  <option value="probleme">🔴 Problème</option>
                </select>
              </div>
            </div>

            {/* Table (Section 15 & 16) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">N° ID</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Élève</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Décision</th>
                    <th className="px-4 py-3">Document Papier</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Chargement des formulaires...
                      </td>
                    </tr>
                  ) : formulaires.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Aucun formulaire ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    formulaires.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedFormulaire(item);
                          setDetailModalOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {item.id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block">
                            {item.parentNom}
                          </span>
                          <span className="text-slate-500 text-[11px]">{item.parentPrenom}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block">
                            {item.eleveNom}
                          </span>
                          <span className="text-slate-500 text-[11px]">{item.elevePrenom}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                            {item.classe}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getChoixBadge(item.choix)}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {getStatutBadge(item.statut, item.id)}
                            {item.statut !== 'signe_recu' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'signe_recu')}
                                title="Marquer comme signé et reçu"
                                className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-300 font-medium transition-opacity cursor-pointer"
                              >
                                + Reçu
                              </button>
                            )}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedFormulaire(item);
                                setDetailModalOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Voir la fiche détaillée"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintSingle(item)}
                              disabled={printingId === item.id || downloadingId === item.id}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                              title="Imprimer le formulaire officiel"
                            >
                              {printingId === item.id ? (
                                <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
                              ) : (
                                <Printer className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadSinglePdf(item)}
                              disabled={downloadingId === item.id || printingId === item.id}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                              title="Télécharger le PDF A4"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{formulaires.length} formulaire(s) affiché(s)</span>
              <span>Ensemble Scolaire Notre Dame des Missions Saint Pierre</span>
            </div>
          </div>
        )}

        {/* VIEW 2: STATS PAR CLASSE */}
        {currentView === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Tableau de bord par classe
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Suivi du taux d'autorisation et de retour des formulaires par division scolaire.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.parClasse &&
                  Object.entries(stats.parClasse).map(([classeName, classData]) => {
                    const data = classData as { total: number; autorisations: number; refus: number };
                    const pctAuth = data.total ? Math.round((data.autorisations / data.total) * 100) : 0;
                    return (
                      <div
                        key={classeName}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-slate-900">{classeName}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {data.total} élèves
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                          <div className="flex justify-between">
                            <span>Autorisations :</span>
                            <span className="font-semibold text-emerald-700">{data.autorisations}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Refus :</span>
                            <span className="font-semibold text-rose-700">{data.refus}</span>
                          </div>
                        </div>
                        {/* mini bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${pctAuth}%` }}
                          ></div>
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${100 - pctAuth}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 text-right">
                          {pctAuth}% autorisations
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: GESTION DES CLASSES (Section demandée par l'utilisateur) */}
        {currentView === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                      <School className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Gestion des classes de l'établissement
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Supprimez, créez individuellement ou recréez en lot les classes de votre établissement. Synchronisé en temps réel avec le portail familles.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Add Class Form */}
                  <form onSubmit={handleAddClass} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="ex: 6ème D, CP B, Terminale 4..."
                      className="px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-48 sm:w-56"
                    />
                    <button
                      type="submit"
                      disabled={isAddingClass || !newClassName.trim()}
                      className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingClass ? 'Ajout...' : 'Créer'}</span>
                    </button>
                  </form>

                  {/* Batch button */}
                  <button
                    type="button"
                    onClick={() => {
                      setBatchInput('');
                      setBatchModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Créer par lot...</span>
                  </button>
                </div>
              </div>

              {/* Feedback message */}
              {classFeedback && (
                <div
                  className={`mt-4 p-3 rounded-lg text-xs flex items-center justify-between ${
                    classFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {classFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{classFeedback.text}</span>
                  </div>
                  <button
                    onClick={() => setClassFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Quick Presets for Recreating Classes */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Récréation rapide par niveau / Réinitialisation :
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ajoutez en 1 clic un cycle complet ou réinitialisez les classes
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        ['6ème A', '6ème B', '6ème C', '5ème A', '5ème B', '5ème C', '4ème A', '4ème B', '4ème C', '3ème A', '3ème B', '3ème C'],
                        'Collège'
                      )
                    }
                    disabled={isAddingClass}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    + Cycle Collège (6ème à 3ème)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        ['2nde 1', '2nde 2', '2nde 3', '1ère G1', '1ère G2', '1ère STMG', 'Terminale 1', 'Terminale 2', 'Terminale STMG'],
                        'Lycée'
                      )
                    }
                    disabled={isAddingClass}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    + Cycle Lycée (2nde, 1ère, Terminale)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        ['CP A', 'CP B', 'CE1 A', 'CE1 B', 'CE2 A', 'CE2 B', 'CM1 A', 'CM1 B', 'CM2 A', 'CM2 B'],
                        'Primaire'
                      )
                    }
                    disabled={isAddingClass}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    + Cycle Primaire (CP à CM2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium transition-colors cursor-pointer ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                    Restaurer modèle par défaut
                  </button>
                </div>
              </div>

              {/* Search, select & delete bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 mb-4">
                <div className="flex items-center gap-2 grow max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      placeholder="Filtrer une classe (ex: 6ème, 2nde)..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedClasses.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedClasses}
                      disabled={isAddingClass}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer la sélection ({selectedClasses.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClasses.length === config.classes.length) {
                        setSelectedClasses([]);
                      } else {
                        setSelectedClasses([...config.classes]);
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {selectedClasses.length === config.classes.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Vider toutes les classes pour repartir de zéro"
                  >
                    Vider tout
                  </button>

                  <div className="text-xs text-slate-500 font-medium pl-2 border-l border-slate-200">
                    <strong>{config.classes.length}</strong> active{config.classes.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Grid of classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {config.classes
                  .filter((c) => c.toLowerCase().includes(classSearch.toLowerCase()))
                  .map((c) => {
                    const count = stats?.parClasse?.[c]?.total || 0;
                    const isChecked = selectedClasses.includes(c);
                    return (
                      <div
                        key={c}
                        className={`group p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClasses((prev) => [...prev, c]);
                              } else {
                                setSelectedClasses((prev) => prev.filter((item) => item !== c));
                              }
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900 truncate">{c}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {count} formulaire{count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setClassToDelete(c)}
                          disabled={deletingClassName === c}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          title={`Supprimer la classe ${c}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>

              {config.classes.filter((c) => c.toLowerCase().includes(classSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2">
                  {config.classes.length === 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-700">Aucune classe n'est actuellement enregistrée.</p>
                      <p className="text-slate-500">
                        Utilisez les boutons ci-dessus pour créer des classes ou restaurer le modèle officiel.
                      </p>
                    </div>
                  ) : (
                    <p>Aucune classe ne correspond à la recherche « {classSearch} ».</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: DESTINATAIRE & DATE LIMITE (Section demandée par l'utilisateur) */}
        {currentView === 'config' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-6">
                <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Paramètres de remise du formulaire
                  </h3>
                  <p className="text-xs text-slate-500">
                    Indiquez à qui le formulaire doit être remis et la date limite impérative de remise.
                  </p>
                </div>
              </div>

              {/* Feedback */}
              {configFeedback && (
                <div
                  className={`mb-6 p-3.5 rounded-xl text-xs flex items-center justify-between ${
                    configFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {configFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{configFeedback.text}</span>
                  </div>
                  <button
                    onClick={() => setConfigFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Inputs */}
                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. Formulaire à remettre à (Nom de la personne) :
                    </label>
                    <input
                      type="text"
                      value={destPersonneInput}
                      onChange={(e) => setDestPersonneInput(e.target.value)}
                      placeholder="ex: Mikael JOUBIN (Adjoint de direction) ou Professeur principal"
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Zone de champs pour indiquer le nom et la fonction de la personne destinataire.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Pour le (Date limite de remise au plus tard) :
                    </label>
                    <input
                      type="date"
                      value={dateLimiteInput}
                      onChange={(e) => setDateLimiteInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sélecteur de date pour choisir l'échéance : elle s'affiche sous la forme « <strong>{formatDisplayDate(dateLimiteInput)}</strong> au plus tard ».
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSavingConfig || !destPersonneInput.trim() || !dateLimiteInput}
                      className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingConfig ? 'Enregistrement...' : 'Enregistrer les paramètres de remise'}</span>
                    </button>
                  </div>
                </form>

                {/* Live Visual Preview */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Aperçu de la mention officielle générée
                  </h4>
                  <p className="text-xs text-slate-500">
                    Voici la consigne exacte qui apparaît instantanément pour les parents et sur les documents :
                  </p>

                  <div className="bg-white border-2 border-amber-300 rounded-xl p-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Mention officielle</span>
                    </div>
                    <p className="text-sm text-slate-900 font-medium leading-relaxed">
                      Ce formulaire doit être remis au{' '}
                      <strong className="text-blue-900 font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                        {destPersonneInput || '(Nom de la personne)'}
                      </strong>{' '}
                      pour le{' '}
                      <strong className="text-amber-900 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                        {formatDisplayDate(dateLimiteInput) || '(Date limite)'}
                      </strong>{' '}
                      au plus tard.
                    </p>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1.5">
                    <p className="font-semibold">Diffusion automatique sur :</p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-800">
                      <li>La page d'accueil du portail parent</li>
                      <li>L'écran de confirmation et téléchargement du PDF</li>
                      <li>Le document officiel A4 généré en PDF</li>
                      <li>L'exemplaire papier imprimé avant signature</li>
                    </ul>
                  </div>

                  {/* Shortcut to Classes Management */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <School className="w-4 h-4 text-blue-700 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">Gestion des classes</p>
                        <p className="text-[11px] text-slate-500">{config.classes.length} classes enregistrées</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentView('classes')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Gérer les classes →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: LOGO & SIGNATURE (Uniquement sur la page d'admin) */}
        {currentView === 'branding' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                      <Upload className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Gestion du Logo et de la Signature Officielle
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    L'upload du logo et de la signature est strictement réservé à la page d'administration. Il n'est pas accessible aux familles.
                  </p>
                </div>

                <button
                  onClick={resetBranding}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurer les visuels officiels</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Card Logo */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Logo de l'Établissement</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      logoUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {logoUrl ? 'Logo personnalisé actif' : 'Logo officiel par défaut'}
                    </span>
                  </div>

                  <div className="h-32 bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={logoUrl || '/logo.png'}
                      alt="Logo établissement"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Ce logo s'affiche dans l'en-tête du document officiel A4 et sur l'en-tête du portail public.
                  </p>

                  <button
                    type="button"
                    onClick={() => openUploadModal('logo')}
                    className="w-full px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Uploader un nouveau Logo</span>
                  </button>
                </div>

                {/* Card Signature */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Signature & Cachet de Direction</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      signatureUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {signatureUrl ? 'Signature personnalisée active' : 'Signature officielle par défaut'}
                    </span>
                  </div>

                  <div className="h-32 bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={signatureUrl || '/signature.png'}
                      alt="Signature officielle"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Apposée automatiquement dans le bloc de signature de la direction (M. JOUBIN).
                  </p>

                  <button
                    type="button"
                    onClick={() => openUploadModal('signature')}
                    className="w-full px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Uploader une nouvelle Signature</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden PDF rendering containers for direct download */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none print:hidden" aria-hidden="true">
          {formulaires.map((item) => (
            <div key={item.id} id={`paper-doc-table-${item.id}`}>
              <PaperDocument
                id={`table-export-${item.id}`}
                parentNom={item.parentNom}
                parentPrenom={item.parentPrenom}
                eleveNom={item.eleveNom}
                elevePrenom={item.elevePrenom}
                classe={item.classe}
                choix={item.choix}
                faitA={item.faitA}
                faitLe={item.faitLe}
                destPersonne={config.destPersonne}
                dateLimite={config.dateLimite}
                isPrintOnly={true}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Formulaire Detail Modal */}
      <FormulaireDetailModal
        formulaire={selectedFormulaire}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        destPersonne={config.destPersonne}
        dateLimite={config.dateLimite}
      />

      {/* MODAL 1: In-App Single Class Delete Confirmation (Replaces blocked window.confirm) */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <span className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Supprimer la classe</h3>
                <p className="text-xs text-slate-500">Action irréversible sur la liste</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2 mb-5">
              <p>
                Êtes-vous sûr de vouloir supprimer la classe <strong className="text-slate-900 text-sm">« {classToDelete} »</strong> ?
              </p>
              {stats?.parClasse?.[classToDelete]?.total ? (
                <div className="font-medium text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{stats.parClasse[classToDelete].total} formulaire(s)</strong> ont été enregistrés pour cette classe.
                    Les formulaires existants ne seront pas effacés de la base de données.
                  </span>
                </div>
              ) : (
                <p className="text-slate-500">
                  Cette classe sera immédiatement retirée du menu déroulant public accessible aux parents.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = classToDelete;
                  setClassToDelete(null);
                  executeDeleteClass(target);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Oui, supprimer la classe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Create or Recreate Classes */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <School className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Créer ou importer des classes en lot</h3>
                  <p className="text-xs text-slate-500">Ajoutez rapidement plusieurs divisions à la fois</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Liste des classes (séparées par une virgule ou retour à la ligne) :
                </label>
                <textarea
                  rows={6}
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  placeholder={`Exemple :\n6ème A\n6ème B\n5ème A\n4ème B\n3ème C\n2nde 1`}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Vous pouvez copier-coller directement depuis un fichier Excel, Word ou une liste brute.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchReplace}
                    onChange={(e) => setBatchReplace(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <span>
                    <strong className="text-slate-900">Remplacer toute la liste actuelle</strong> (attention : effacera les autres classes et ne gardera que cette liste).
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Si décoché, ces classes seront simplement ajoutées à la liste existante.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isBatchSaving || !batchInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isBatchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isBatchSaving ? 'Enregistrement...' : batchReplace ? 'Remplacer et enregistrer' : 'Ajouter les classes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Default Classes Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <RotateCcw className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Restaurer les classes par défaut</h3>
                <p className="text-xs text-slate-500">Réinitialisation du catalogue de divisions</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Voulez-vous restaurer la liste des <strong>21 classes officielles</strong> de l'établissement (de la 6ème A jusqu'à la Terminale STMG) ?
              Toute personnalisation manuelle sera remplacée par ce jeu officiel.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetDefaultClasses}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer les 21 classes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete All Classes Confirmation */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <span className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Vider toutes les classes</h3>
                <p className="text-xs text-slate-500">Repartir de zéro</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Êtes-vous sûr de vouloir <strong>supprimer l'intégralité des classes</strong> ?
              La liste sera vide et vous pourrez recréer vos propres classes manuellement ou par lot.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAllClasses}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmer et tout supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
