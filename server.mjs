import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const app = express();
const PORT = 4000;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "agent_hub";

/** @type {import("mongodb").Db} */
let db;
/** @type {import("mongodb").Collection} */
let usersCol;
/** @type {import("mongodb").Collection} */
let userLogsCol;
/** @type {import("mongodb").Collection} */
let partenariatsCol;

/** Roles: admin (tout, toutes entreprises), editor (créer/modifier/supprimer son entreprise), spectate (lecture son entreprise), ajouter/modifier/suppression (action unique, son entreprise) */
const ROLES = ["admin", "editor", "spectate", "ajouter", "modifier", "suppression"];

function roleToPermissions(role) {
  switch (role) {
    case "admin":
      return { canCreatePartenariat: true, canEditPartenariat: true, canDeletePartenariat: true };
    case "editor":
      return { canCreatePartenariat: true, canEditPartenariat: true, canDeletePartenariat: true };
    case "ajouter":
      return { canCreatePartenariat: true, canEditPartenariat: false, canDeletePartenariat: false };
    case "modifier":
      return { canCreatePartenariat: false, canEditPartenariat: true, canDeletePartenariat: false };
    case "suppression":
      return { canCreatePartenariat: false, canEditPartenariat: false, canDeletePartenariat: true };
    default:
      return { canCreatePartenariat: false, canEditPartenariat: false, canDeletePartenariat: false };
  }
}

function normalizeRole(doc) {
  const r = doc.role;
  if (ROLES.includes(r)) return r;
  return "spectate";
}

function serializeUser(doc, includeStatus = false) {
  const role = normalizeRole(doc);
  const perms = roleToPermissions(role);
  const u = {
    id: String(doc._id),
    email: doc.email,
    fullName: doc.full_name ?? "",
    role,
    nickname: doc.nickname ?? doc.full_name ?? doc.email ?? "",
    companyName: doc.company_name ?? null,
    ...perms,
  };
  if (includeStatus) u.status = doc.status ?? "approved";
  return u;
}

const ADMIN_EMAILS = ["admin@local", "ilyas@local"];

function isAdminDoc(user) {
  if (!user) return false;
  return user.role === "admin" || (user.email && ADMIN_EMAILS.includes(user.email));
}

function setReqUser(req, user) {
  req.user = user;
  req.userId = String(user._id);
  req.isAdmin = isAdminDoc(user);
  const role = normalizeRole(user);
  const perms = req.isAdmin ? roleToPermissions("admin") : roleToPermissions(role);
  req.canCreatePartenariat = perms.canCreatePartenariat;
  req.canEditPartenariat = perms.canEditPartenariat;
  req.canDeletePartenariat = perms.canDeletePartenariat;
  req.canEditPartenariats = req.canCreatePartenariat || req.canEditPartenariat || req.canDeletePartenariat;
}

/** Résout l'utilisateur depuis Authorization: Bearer <jwt> ou X-User-Id. À appeler avant requireUser/requireAdmin. */
async function resolveAuth(req, res, next) {
  const authz = req.headers.authorization || req.headers.Authorization;
  const bearer = authz && String(authz).startsWith("Bearer ");
  const token = bearer ? String(authz).slice(7).trim() : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const userId = payload.sub;
      if (userId) {
        const user = await usersCol.findOne(
          { _id: new ObjectId(String(userId)), status: "approved" },
          { projection: { password_hash: 0 } }
        );
        if (user) {
          setReqUser(req, user);
          next();
          return;
        }
      }
    } catch (_e) {}
  }
  const userId = req.headers["x-user-id"] || req.headers["X-User-Id"];
  const userEmail = req.headers["x-user-email"] || req.headers["X-User-Email"];
  if (userId) {
    try {
      const user = await usersCol.findOne(
        { _id: new ObjectId(String(userId)), status: "approved" },
        { projection: { password_hash: 0 } }
      );
      if (user) {
        setReqUser(req, user);
        next();
        return;
      }
    } catch (_e) {}
  }
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    const user = await usersCol.findOne(
      { email: userEmail, status: "approved" },
      { projection: { password_hash: 0 } }
    );
    if (user) {
      setReqUser(req, user);
      next();
      return;
    }
  }
  next();
}

async function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Non connecté." });
  }
  next();
}

async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé." });
  }
  if (!isAdminDoc(req.user)) {
    return res.status(403).json({ message: "Accès réservé à l'administrateur." });
  }
  next();
}

function serializePartenariat(doc) {
  return {
    id: String(doc._id),
    titre: doc.titre,
    type_partenariat: doc.type_partenariat,
    nature: doc.nature,
    domaine: doc.domaine,
    entite_cnss: doc.entite_cnss,
    entite_concernee: doc.entite_concernee || null,
    partenaire: doc.partenaire,
    date_debut: doc.date_debut,
    date_fin: doc.date_fin,
    date_prise_effet: doc.date_prise_effet ?? null,
    statut: doc.statut,
    description: doc.description,
    company_name: doc.company_name ?? null,
    created_by: doc.created_by != null ? String(doc.created_by) : null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

function toObjectId(id, res) {
  try {
    return new ObjectId(id);
  } catch (_e) {
    res.status(400).json({ message: "Identifiant invalide." });
    return null;
  }
}

app.use(cors());
app.use(express.json());

// Résolution utilisateur pour toutes les routes /api (Bearer JWT ou X-User-Id)
app.use("/api", resolveAuth);

// ---------- AUTH ----------
app.post("/api/register", async (req, res) => {
  res.status(403).json({
    message: "Inscription désactivée. Contactez l'administrateur pour créer votre compte.",
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await usersCol.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Identifiants invalides." });
  }

  if (user.status !== "approved") {
    return res.status(403).json({
      message: "Votre compte n'est pas encore approuvé. Contactez l'administrateur.",
    });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(400).json({ message: "Identifiants invalides." });
  }

  const now = new Date().toISOString();
  await userLogsCol.insertOne({
    user_id: String(user._id),
    action: "login",
    details: email,
    created_at: now,
  }).catch(() => {});

  const token = jwt.sign(
    { sub: String(user._id), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  res.json({ ...serializeUser(user), token });
});

app.get("/api/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non connecté." });
  }
  res.json(serializeUser(req.user));
});

// ---------- ADMIN: USERS ----------
app.post("/api/users", requireAdmin, async (req, res) => {
  const { email, password, fullName, companyName, role, nickname, partenariatIds } = req.body ?? {};
  if (!email || !password || !fullName || !companyName) {
    return res.status(400).json({
      message: "Champs obligatoires: email, mot de passe, nom complet, nom d'entreprise.",
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanFullName = String(fullName).trim();
  const cleanCompanyName = String(companyName).trim();
  const cleanNickname = nickname != null ? String(nickname).trim() : "";
  const cleanRole = ROLES.includes(role) ? role : "spectate";

  if (!cleanEmail || !cleanFullName || !cleanCompanyName) {
    return res.status(400).json({ message: "Champs invalides." });
  }

  const existing = await usersCol.findOne({ email: cleanEmail }, { projection: { _id: 1 } });
  if (existing) {
    return res.status(400).json({ message: "Cet email est déjà utilisé." });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const now = new Date().toISOString();
  const doc = {
    email: cleanEmail,
    full_name: cleanFullName,
    password_hash: passwordHash,
    role: cleanRole,
    nickname: cleanNickname || cleanFullName || cleanEmail,
    status: "approved",
    company_name: cleanCompanyName,
    created_at: now,
  };
  const result = await usersCol.insertOne(doc);
  const row = await usersCol.findOne({ _id: result.insertedId }, { projection: { password_hash: 0 } });
  const adminUserId = req.headers["x-user-id"] || req.headers["X-User-Id"];
  await userLogsCol.insertOne({
    user_id: adminUserId || "system",
    action: "create_user",
    details: `Création: ${cleanEmail} (${cleanRole})`,
    created_at: now,
  }).catch(() => {});

  // Affecter les partenariats sélectionnés à l'entreprise du nouvel utilisateur
  const ids = Array.isArray(partenariatIds) ? partenariatIds : [];
  if (ids.length > 0) {
    const objectIds = ids
      .filter((id) => id != null && String(id).trim())
      .map((id) => {
        try {
          return new ObjectId(String(id));
        } catch (_e) {
          return null;
        }
      })
      .filter(Boolean);
    if (objectIds.length > 0) {
      await partenariatsCol.updateMany(
        { _id: { $in: objectIds } },
        { $set: { company_name: cleanCompanyName, updated_at: now } }
      ).catch(() => {});
    }
  }

  res.status(201).json(serializeUser(row, true));
});

app.get("/api/users", requireAdmin, async (req, res) => {
  const cursor = usersCol.aggregate([
    {
      $lookup: {
        from: "user_logs",
        let: { uid: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$user_id", "$$uid"] }, action: "login" } },
          { $sort: { created_at: -1 } },
          { $limit: 1 },
          { $project: { created_at: 1 } },
        ],
        as: "last_login_doc",
      },
    },
    {
      $addFields: {
        last_login: { $arrayElemAt: ["$last_login_doc.created_at", 0] },
      },
    },
    { $sort: { status: -1, _id: 1 } },
  ]);
  const rows = await cursor.toArray();
  res.json(
    rows.map((r) => {
      const u = serializeUser(r, true);
      u.lastLogin = r.last_login || null;
      u.createdAt = r.created_at || null;
      return u;
    })
  );
});

app.get("/api/users/pending", requireAdmin, async (req, res) => {
  const rows = await usersCol
    .find({ status: "pending" })
    .sort({ _id: 1 })
    .toArray();
  res.json(rows.map((r) => serializeUser(r, true)));
});

app.get("/api/logs", requireAdmin, async (req, res) => {
  const logs = await userLogsCol
    .aggregate([
      {
        $lookup: {
          from: "users",
          let: { uid: { $toObjectId: "$user_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { email: 1, nickname: 1, full_name: 1 } },
          ],
          as: "u",
        },
      },
      { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
      { $sort: { created_at: -1 } },
      { $limit: 500 },
      {
        $project: {
          id: { $toString: "$_id" },
          userId: "$user_id",
          action: 1,
          details: 1,
          createdAt: "$created_at",
          userEmail: "$u.email",
          userNickname: { $ifNull: ["$u.nickname", "$u.full_name", "$u.email"] },
        },
      },
    ])
    .toArray();
  res.json(logs);
});

app.patch("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const oid = toObjectId(id, res);
  if (!oid) return;
  const { status, role, nickname, companyName } = req.body;

  const existing = await usersCol.findOne({ _id: oid }, { projection: { _id: 1, status: 1 } });
  if (!existing) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }

  const update = {};
  if (status !== undefined && ["pending", "approved", "rejected"].includes(status)) update.status = status;
  if (role !== undefined && ROLES.includes(role)) update.role = role;
  if (nickname !== undefined) update.nickname = String(nickname).trim() || null;
  if (companyName !== undefined) update.company_name = String(companyName).trim() || null;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "Aucune modification fournie." });
  }

  await usersCol.updateOne({ _id: oid }, { $set: update });
  const adminUserId = req.headers["x-user-id"] || req.headers["X-User-Id"];
  await userLogsCol.insertOne({
    user_id: adminUserId || "system",
    action: "update_user",
    details: `Modification utilisateur ${id}: ${JSON.stringify(update)}`,
    created_at: new Date().toISOString(),
  }).catch(() => {});
  const row = await usersCol.findOne({ _id: oid }, { projection: { password_hash: 0 } });
  res.json(serializeUser(row, true));
});

/** Affecter des partenariats à l'entreprise d'un utilisateur (admin). Met à jour company_name des partenariats. */
app.put("/api/users/:id/partenariats", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const oid = toObjectId(id, res);
  if (!oid) return;
  const { partenariatIds } = req.body ?? {};
  const targetUser = await usersCol.findOne({ _id: oid }, { projection: { company_name: 1 } });
  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }
  const companyName = targetUser.company_name != null && String(targetUser.company_name).trim()
    ? String(targetUser.company_name).trim()
    : null;
  const ids = Array.isArray(partenariatIds) ? partenariatIds : [];
  const objectIds = ids
    .filter((id) => id != null && String(id).trim())
    .map((id) => {
      try {
        return new ObjectId(String(id));
      } catch (_e) {
        return null;
      }
    })
    .filter(Boolean);
  const now = new Date().toISOString();
  if (objectIds.length > 0) {
    await partenariatsCol.updateMany(
      { _id: { $in: objectIds } },
      { $set: { company_name: companyName, updated_at: now } }
    ).catch(() => {});
  }
  const adminUserId = req.userId || "system";
  await userLogsCol.insertOne({
    user_id: adminUserId,
    action: "update_user",
    details: `Affectation partenariats utilisateur ${id} (${objectIds.length} partenariats)`,
    created_at: now,
  }).catch(() => {});
  res.json({ ok: true, count: objectIds.length });
});

const SEED_ADMINS = [
  { email: "admin@local", password: "admin1234", fullName: "Administrateur", nickname: "Admin" },
  { email: "ilyas@local", password: "ilyas123", fullName: "Ilyas", nickname: "Ilyas" },
];

async function seedAdmins() {
  const now = new Date().toISOString();
  for (const a of SEED_ADMINS) {
    const hash = bcrypt.hashSync(a.password, 10);
    const existing = await usersCol.findOne({ email: a.email });
    if (!existing) {
      await usersCol.insertOne({
        email: a.email,
        full_name: a.fullName,
        password_hash: hash,
        role: "admin",
        nickname: a.nickname,
        status: "approved",
        created_at: now,
      });
      console.log(`Admin créé: ${a.email} / ${a.password}`);
    } else {
      await usersCol.updateOne(
        { email: a.email },
        { $set: { role: "admin", nickname: a.nickname, status: "approved", full_name: a.fullName, password_hash: hash } }
      );
      console.log(`Admin mis à jour: ${a.email} / ${a.password}`);
    }
  }
}

// Liste des entreprises (noms distincts des utilisateurs) pour affecter un partenariat (admin).
app.get("/api/companies", requireAdmin, async (req, res) => {
  const companies = await usersCol.distinct("company_name", { company_name: { $exists: true, $ne: null, $ne: "" } });
  res.json(companies.filter(Boolean).sort());
});

// ---------- PARTENARIATS ----------
// Admin: tous les partenariats. Autres rôles: uniquement ceux de leur entreprise (company_name).
app.get("/api/partenariats", requireUser, async (req, res) => {
  const company = req.user && typeof req.user.company_name === "string" ? req.user.company_name.trim() : "";
  const filter = req.isAdmin ? {} : (company ? { company_name: company } : { created_by: req.userId });
  const rows = await partenariatsCol.find(filter).sort({ created_at: -1 }).toArray();
  res.json(rows.map(serializePartenariat));
});

function validatePartenariatDates(date_debut, date_fin, date_prise_effet) {
  if (date_debut && date_fin && date_fin < date_debut) {
    return "La date de fin ne peut pas être antérieure à la date de début.";
  }
  if (date_debut && date_prise_effet && date_prise_effet < date_debut) {
    return "La date de prise d'effet ne peut pas être antérieure à la date de début.";
  }
  return null;
}

app.post("/api/partenariats", requireUser, async (req, res) => {
  if (!req.canCreatePartenariat) {
    return res.status(403).json({ message: "Vous n'avez pas le droit de créer un partenariat." });
  }
  const {
    titre,
    type_partenariat,
    nature,
    domaine,
    entite_cnss,
    entite_concernee = null,
    partenaire,
    date_debut = null,
    date_fin = null,
    date_prise_effet = null,
    statut,
    description = null,
    company_name: bodyCompany,
  } = req.body;

  if (!titre || !type_partenariat || !nature || !domaine || !entite_cnss || !partenaire || !statut) {
    return res.status(400).json({ message: "Champs obligatoires manquants." });
  }
  const dateErr = validatePartenariatDates(date_debut, date_fin, date_prise_effet);
  if (dateErr) return res.status(400).json({ message: dateErr });

  let company = req.user && typeof req.user.company_name === "string" ? req.user.company_name.trim() : null;
  if (req.isAdmin && bodyCompany !== undefined) {
    company = typeof bodyCompany === "string" && bodyCompany.trim() ? bodyCompany.trim() : null;
  }
  const existing = await partenariatsCol.findOne({ titre, company_name: company });
  if (existing) {
    return res.status(400).json({ message: "Un partenariat avec ce titre existe déjà." });
  }

  const now = new Date().toISOString();
  const doc = {
    titre,
    type_partenariat,
    nature,
    domaine,
    entite_cnss,
    entite_concernee,
    partenaire,
    date_debut,
    date_fin,
    date_prise_effet,
    statut,
    description,
    created_by: req.userId,
    company_name: company,
    created_at: now,
    updated_at: now,
  };
  const result = await partenariatsCol.insertOne(doc);
  await userLogsCol.insertOne({
    user_id: req.userId,
    action: "create_partenariat",
    details: titre,
    created_at: now,
  }).catch(() => {});
  const row = await partenariatsCol.findOne({ _id: result.insertedId });
  res.status(201).json(serializePartenariat(row));
});

app.put("/api/partenariats/:id", requireUser, async (req, res) => {
  if (!req.canEditPartenariat) {
    return res.status(403).json({ message: "Vous n'avez pas le droit de modifier un partenariat." });
  }
  const { id } = req.params;
  const oid = toObjectId(id, res);
  if (!oid) return;
  const existing = await partenariatsCol.findOne({ _id: oid });
  if (!existing) {
    return res.status(404).json({ message: "Non trouvé" });
  }
  const company = req.user && typeof req.user.company_name === "string" ? req.user.company_name.trim() : "";
  const isOwnerById = String(existing.created_by || "") === req.userId;
  const isOwnerByCompany = company && String(existing.company_name || "") === company;
  if (!req.isAdmin && !isOwnerById && !isOwnerByCompany) {
    return res.status(403).json({ message: "Accès interdit." });
  }

  const {
    titre = existing.titre,
    type_partenariat = existing.type_partenariat,
    nature = existing.nature,
    domaine = existing.domaine,
    entite_cnss = existing.entite_cnss,
    entite_concernee = existing.entite_concernee,
    partenaire = existing.partenaire,
    date_debut = existing.date_debut,
    date_fin = existing.date_fin,
    date_prise_effet = existing.date_prise_effet,
    statut = existing.statut,
    description = existing.description,
    company_name: bodyCompany,
  } = req.body;

  let companyName = existing.company_name ?? null;
  if (req.isAdmin && bodyCompany !== undefined) {
    companyName = typeof bodyCompany === "string" && bodyCompany.trim() ? bodyCompany.trim() : null;
  }

  const duplicate = await partenariatsCol.findOne({
    titre,
    company_name: companyName,
    _id: { $ne: oid },
  });
  if (duplicate) {
    return res.status(400).json({ message: "Un partenariat avec ce titre existe déjà pour cette entreprise." });
  }
  const dateErr = validatePartenariatDates(date_debut, date_fin, date_prise_effet ?? existing.date_prise_effet);
  if (dateErr) return res.status(400).json({ message: dateErr });

  const now = new Date().toISOString();
  await partenariatsCol.updateOne(
    { _id: oid },
    {
      $set: {
        titre,
        type_partenariat,
        nature,
        domaine,
        entite_cnss,
        entite_concernee,
        partenaire,
        date_debut,
        date_fin,
        date_prise_effet: date_prise_effet ?? null,
        statut,
        description,
        created_by: existing.created_by != null ? String(existing.created_by) : null,
        company_name: companyName,
        updated_at: now,
      },
    }
  );
  await userLogsCol.insertOne({
    user_id: req.userId,
    action: "update_partenariat",
    details: `${existing.titre} (id: ${id})`,
    created_at: now,
  }).catch(() => {});
  const row = await partenariatsCol.findOne({ _id: oid });
  res.json(serializePartenariat(row));
});

app.delete("/api/partenariats/:id", requireUser, async (req, res) => {
  if (!req.canDeletePartenariat) {
    return res.status(403).json({ message: "Vous n'avez pas le droit de supprimer un partenariat." });
  }
  const { id } = req.params;
  const oid = toObjectId(id, res);
  if (!oid) return;
  const existing = await partenariatsCol.findOne(
    { _id: oid },
    { projection: { created_by: 1, company_name: 1, titre: 1 } }
  );
  if (!existing) {
    return res.status(404).json({ message: "Non trouvé" });
  }
  const company = req.user && typeof req.user.company_name === "string" ? req.user.company_name.trim() : "";
  const isOwnerById = String(existing.created_by || "") === req.userId;
  const isOwnerByCompany = company && String(existing.company_name || "") === company;
  if (!req.isAdmin && !isOwnerById && !isOwnerByCompany) {
    return res.status(403).json({ message: "Accès interdit." });
  }
  const result = await partenariatsCol.deleteOne({ _id: oid });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Non trouvé" });
  }
  await userLogsCol.insertOne({
    user_id: req.userId,
    action: "delete_partenariat",
    details: `${existing.titre || id} (id: ${id})`,
    created_at: new Date().toISOString(),
  }).catch(() => {});
  res.status(204).end();
});

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  usersCol = db.collection("users");
  userLogsCol = db.collection("user_logs");
  partenariatsCol = db.collection("partenariats");

  await usersCol.createIndex({ email: 1 }, { unique: true });
  await usersCol.updateMany(
    { status: { $in: [null, ""] } },
    { $set: { status: "approved" } }
  );
  await seedAdmins();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (MongoDB: ${DB_NAME})`);
  });
}

main().catch((err) => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});
