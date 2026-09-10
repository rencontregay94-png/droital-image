import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

// Data storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface FormRecord {
  id: string;
  parentCivilite?: string;
  parentNom: string;
  parentPrenom: string;
  parentEmail?: string;
  parentTelephone?: string;
  eleveNom: string;
  elevePrenom: string;
  classe: string;
  choix: 'interne' | 'internet' | 'refus';
  faitA: string;
  faitLe: string;
  dateCreation: string;
  statut: 'a_imprimer' | 'a_recuperer' | 'signe_recu' | 'probleme';
  notes?: string;
  dateSignaturePrevue?: string;
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
const DEFAULT_DEST_PERSONNE = 'Mikael JOUBIN (Adjoint de direction)';
const DEFAULT_DATE_LIMITE = '2026-09-18';

interface DatabaseSchema {
  admin: {
    login: string;
    salt: string;
    passwordHash: string;
  };
  formulaires: FormRecord[];
  nextId: number;
  branding?: {
    logoUrl?: string | null;
    signatureUrl?: string | null;
  };
  config?: {
    classes?: string[];
    destPersonne?: string;
    dateLimite?: string;
  };
}

// Password hashing helper using SHA-256 with salt
function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Initialize seed data if db.json doesn't exist
function initDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      if (!loaded.config) {
        loaded.config = {
          classes: [...DEFAULT_CLASSES],
          destPersonne: DEFAULT_DEST_PERSONNE,
          dateLimite: DEFAULT_DATE_LIMITE,
        };
      } else {
        if (!Array.isArray(loaded.config.classes) || loaded.config.classes.length === 0) {
          loaded.config.classes = [...DEFAULT_CLASSES];
        }
        if (!loaded.config.destPersonne) {
          loaded.config.destPersonne = DEFAULT_DEST_PERSONNE;
        }
        if (!loaded.config.dateLimite) {
          loaded.config.dateLimite = DEFAULT_DATE_LIMITE;
        }
      }
      // Ensure admin credentials match requested admin / Gafa8432
      if (!loaded.admin) {
        const salt = crypto.randomBytes(16).toString('hex');
        loaded.admin = {
          login: 'admin',
          salt,
          passwordHash: hashPassword('Gafa8432', salt),
        };
      } else {
        loaded.admin.login = 'admin';
        loaded.admin.passwordHash = hashPassword('Gafa8432', loaded.admin.salt);
      }
      return loaded;
    } catch (e) {
      console.error('Failed to parse existing DB file, re-creating:', e);
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('Gafa8432', salt);

  const formulaires: FormRecord[] = [];
  const currentId = 1;

  const initialDb: DatabaseSchema = {
    admin: {
      login: 'admin',
      salt,
      passwordHash,
    },
    formulaires,
    nextId: currentId,
    config: {
      classes: [...DEFAULT_CLASSES],
      destPersonne: DEFAULT_DEST_PERSONNE,
      dateLimite: DEFAULT_DATE_LIMITE,
    },
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

// Session store (in-memory token map)
const activeSessions = new Map<string, { login: string; expires: number }>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Authentication middleware for /api/admin/* and secure endpoints
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token) as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Accès non autorisé : session administrateur requise' });
    return;
  }

  const session = activeSessions.get(token);
  if (!session || session.expires < Date.now()) {
    if (session) activeSessions.delete(token);
    res.status(401).json({ error: 'Session expirée ou invalide' });
    return;
  }

  // Extend session (4 hours)
  session.expires = Date.now() + 4 * 3600 * 1000;
  next();
}

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    res.status(400).json({ error: 'Identifiant et mot de passe requis' });
    return;
  }

  if (login !== db.admin.login) {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    return;
  }

  const computedHash = hashPassword(password, db.admin.salt);
  if (computedHash !== db.admin.passwordHash) {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    return;
  }

  const token = generateToken();
  // 4 hours validity
  activeSessions.set(token, {
    login,
    expires: Date.now() + 4 * 3600 * 1000,
  });

  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 4 * 3600 * 1000,
  });

  res.json({
    success: true,
    token,
    user: { login, nom: 'Secrétariat Administratif NDM' },
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = (req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token) as string | undefined;
  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }
  const session = activeSessions.get(token);
  if (!session || session.expires < Date.now()) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: { login: session.login, nom: 'Secrétariat Administratif NDM' },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers.authorization?.replace('Bearer ', '') || req.cookies?.admin_token) as string | undefined;
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Configuration & Classes endpoints
app.get('/api/config', (req, res) => {
  res.json({
    classes: db.config?.classes || DEFAULT_CLASSES,
    destPersonne: db.config?.destPersonne || DEFAULT_DEST_PERSONNE,
    dateLimite: db.config?.dateLimite || DEFAULT_DATE_LIMITE,
  });
});

app.put('/api/config', requireAdminAuth, (req, res) => {
  const { destPersonne, dateLimite, classes } = req.body;
  if (!db.config) {
    db.config = {
      classes: [...DEFAULT_CLASSES],
      destPersonne: DEFAULT_DEST_PERSONNE,
      dateLimite: DEFAULT_DATE_LIMITE,
    };
  }
  if (destPersonne !== undefined) {
    db.config.destPersonne = String(destPersonne).trim();
  }
  if (dateLimite !== undefined) {
    db.config.dateLimite = String(dateLimite).trim();
  }
  if (Array.isArray(classes)) {
    db.config.classes = classes.map((c: string) => String(c).trim()).filter(Boolean);
  }
  saveDatabase();
  res.json({
    success: true,
    config: db.config,
  });
});

app.post('/api/classes', requireAdminAuth, (req, res) => {
  const { classe, name: reqName } = req.body;
  const name = String(classe || reqName || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Le nom de la classe ne peut pas être vide.' });
    return;
  }
  if (!db.config) {
    db.config = {
      classes: [...DEFAULT_CLASSES],
      destPersonne: DEFAULT_DEST_PERSONNE,
      dateLimite: DEFAULT_DATE_LIMITE,
    };
  }
  if (!db.config.classes) {
    db.config.classes = [];
  }
  if (!db.config.classes.includes(name)) {
    db.config.classes.push(name);
    saveDatabase();
  }
  res.json({ success: true, classes: db.config.classes });
});

// Batch create or recreate classes
app.post('/api/classes/batch', requireAdminAuth, (req, res) => {
  const { classes: newClasses, replace } = req.body;
  if (!Array.isArray(newClasses)) {
    res.status(400).json({ error: 'Liste de classes invalide.' });
    return;
  }
  if (!db.config) {
    db.config = {
      classes: [...DEFAULT_CLASSES],
      destPersonne: DEFAULT_DEST_PERSONNE,
      dateLimite: DEFAULT_DATE_LIMITE,
    };
  }
  const cleanList = newClasses.map((c: string) => String(c).trim()).filter(Boolean);
  if (replace) {
    db.config.classes = cleanList;
  } else {
    for (const c of cleanList) {
      if (!db.config.classes.includes(c)) {
        db.config.classes.push(c);
      }
    }
  }
  saveDatabase();
  res.json({ success: true, classes: db.config.classes });
});

// Reset classes to default template
app.post('/api/classes/reset', requireAdminAuth, (req, res) => {
  if (!db.config) {
    db.config = {
      classes: [...DEFAULT_CLASSES],
      destPersonne: DEFAULT_DEST_PERSONNE,
      dateLimite: DEFAULT_DATE_LIMITE,
    };
  }
  db.config.classes = [...DEFAULT_CLASSES];
  saveDatabase();
  res.json({ success: true, classes: db.config.classes });
});

app.delete('/api/classes/:name', requireAdminAuth, (req, res) => {
  const name = decodeURIComponent(req.params.name).trim();
  if (!db.config || !db.config.classes) {
    res.json({ success: true, classes: [] });
    return;
  }
  db.config.classes = db.config.classes.filter((c) => c !== name);
  saveDatabase();
  res.json({ success: true, classes: db.config.classes });
});

// Branding settings endpoints (Logo and Mikael JOUBIN signature upload - Admin only)
app.get('/api/branding', (req, res) => {
  res.json({
    logoUrl: db.branding?.logoUrl || null,
    signatureUrl: db.branding?.signatureUrl || null,
  });
});

app.post('/api/branding', requireAdminAuth, (req, res) => {
  const { logoUrl, signatureUrl } = req.body;
  if (!db.branding) {
    db.branding = {};
  }
  if (logoUrl !== undefined) {
    db.branding.logoUrl = logoUrl;
  }
  if (signatureUrl !== undefined) {
    db.branding.signatureUrl = signatureUrl;
  }
  saveDatabase();
  res.json({
    success: true,
    branding: {
      logoUrl: db.branding.logoUrl || null,
      signatureUrl: db.branding.signatureUrl || null,
    },
  });
});

app.post('/api/branding/reset', requireAdminAuth, (req, res) => {
  const { target } = req.body || {};
  if (!db.branding) {
    db.branding = {};
  }
  if (target === 'logo' || !target || target === 'all') {
    db.branding.logoUrl = null;
  }
  if (target === 'signature' || !target || target === 'all') {
    db.branding.signatureUrl = null;
  }
  saveDatabase();
  res.json({
    success: true,
    branding: {
      logoUrl: db.branding.logoUrl || null,
      signatureUrl: db.branding.signatureUrl || null,
    },
  });
});

// Parent form submission endpoint (Public)
app.post('/api/formulaires', (req, res) => {
  const {
    parentCivilite,
    parentNom,
    parentPrenom,
    parentEmail,
    parentTelephone,
    eleveNom,
    elevePrenom,
    classe,
    choix,
    faitA,
    faitLe,
  } = req.body;

  if (!parentNom || !parentPrenom || !eleveNom || !elevePrenom || !classe || !choix) {
    res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés.' });
    return;
  }

  if (!['interne', 'internet', 'refus'].includes(choix)) {
    res.status(400).json({ error: 'Choix d’autorisation invalide.' });
    return;
  }

  const newId = db.nextId.toString().padStart(6, '0');
  db.nextId++;

  const newRecord: FormRecord = {
    id: newId,
    parentCivilite: parentCivilite || 'Madame, Monsieur',
    parentNom: parentNom.trim(),
    parentPrenom: parentPrenom.trim(),
    parentEmail: parentEmail?.trim(),
    parentTelephone: parentTelephone?.trim(),
    eleveNom: eleveNom.trim(),
    elevePrenom: elevePrenom.trim(),
    classe: classe.trim(),
    choix,
    faitA: faitA?.trim() || 'Charenton-le-Pont',
    faitLe: faitLe?.trim() || new Date().toLocaleDateString('fr-FR'),
    dateCreation: new Date().toISOString(),
    statut: 'a_imprimer',
    dateSignaturePrevue: faitLe?.trim() || new Date().toLocaleDateString('fr-FR'),
  };

  db.formulaires.unshift(newRecord);
  saveDatabase();

  res.status(201).json({
    success: true,
    formulaire: newRecord,
  });
});

// Admin formulaires list with search and filters
app.get('/api/formulaires', requireAdminAuth, (req, res) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const classe = (req.query.classe as string) || '';
  const choix = (req.query.choix as string) || '';
  const statut = (req.query.statut as string) || '';

  let results = db.formulaires;

  if (search) {
    results = results.filter((f) => {
      const parentFull = `${f.parentNom} ${f.parentPrenom}`.toLowerCase();
      const eleveFull = `${f.eleveNom} ${f.elevePrenom}`.toLowerCase();
      return (
        parentFull.includes(search) ||
        eleveFull.includes(search) ||
        f.id.includes(search) ||
        f.classe.toLowerCase().includes(search)
      );
    });
  }

  if (classe && classe !== 'ALL') {
    results = results.filter((f) => f.classe.toLowerCase() === classe.toLowerCase());
  }

  if (choix && choix !== 'ALL') {
    if (choix === 'autorisation') {
      results = results.filter((f) => f.choix === 'interne' || f.choix === 'internet');
    } else {
      results = results.filter((f) => f.choix === choix);
    }
  }

  if (statut && statut !== 'ALL') {
    results = results.filter((f) => f.statut === statut);
  }

  res.json({
    total: results.length,
    formulaires: results,
  });
});

// Admin stats endpoint
app.get('/api/stats', requireAdminAuth, (req, res) => {
  const total = db.formulaires.length;
  const autorisationsInterne = db.formulaires.filter((f) => f.choix === 'interne').length;
  const autorisationsInternet = db.formulaires.filter((f) => f.choix === 'internet').length;
  const autorisationsTotal = autorisationsInterne + autorisationsInternet;
  const refus = db.formulaires.filter((f) => f.choix === 'refus').length;

  const statuts = {
    a_imprimer: db.formulaires.filter((f) => f.statut === 'a_imprimer').length,
    a_recuperer: db.formulaires.filter((f) => f.statut === 'a_recuperer').length,
    signe_recu: db.formulaires.filter((f) => f.statut === 'signe_recu').length,
    probleme: db.formulaires.filter((f) => f.statut === 'probleme').length,
  };

  const parClasse: Record<string, { total: number; autorisations: number; refus: number }> = {};
  for (const f of db.formulaires) {
    if (!parClasse[f.classe]) {
      parClasse[f.classe] = { total: 0, autorisations: 0, refus: 0 };
    }
    parClasse[f.classe].total++;
    if (f.choix === 'refus') {
      parClasse[f.classe].refus++;
    } else {
      parClasse[f.classe].autorisations++;
    }
  }

  res.json({
    total,
    autorisationsInterne,
    autorisationsInternet,
    autorisationsTotal,
    refus,
    statuts,
    parClasse,
  });
});

// Get single formulaire (Admin or direct receipt link)
app.get('/api/formulaires/:id', (req, res) => {
  const item = db.formulaires.find((f) => f.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Formulaire introuvable' });
    return;
  }
  res.json(item);
});

// Update status (Admin only)
app.patch('/api/formulaires/:id/status', requireAdminAuth, (req, res) => {
  const { statut, notes } = req.body;
  const item = db.formulaires.find((f) => f.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Formulaire introuvable' });
    return;
  }

  if (statut && ['a_imprimer', 'a_recuperer', 'signe_recu', 'probleme'].includes(statut)) {
    item.statut = statut;
  }
  if (notes !== undefined) {
    item.notes = notes;
  }

  saveDatabase();
  res.json({ success: true, formulaire: item });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: ['droitsimages.test.ndmissions.fr', '.ndmissions.fr', 'localhost', '127.0.0.1'],
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
