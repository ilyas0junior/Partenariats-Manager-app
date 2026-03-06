Étapes côté backend
Corps de la requête
Le front envoie email et password en JSON. Le backend lit req.body.
Recherche de l’utilisateur
usersCol.findOne({ email }) cherche un document dans MongoDB dont le champ email correspond.
Aucun utilisateur → réponse 400 avec « Identifiants invalides. »
Vérification du statut
Seuls les comptes avec status === "approved" peuvent se connecter.
Sinon → 403 avec « Votre compte n'est pas encore approuvé... »
Vérification du mot de passe
bcrypt.compare(password, user.password_hash) compare le mot de passe envoyé au hash stocké.
Pas de correspondance → 400 « Identifiants invalides. »
Enregistrement du login
Une entrée est créée dans user_logs : action: "login", user_id, details (email), created_at.
Utilisé pour l’historique des connexions (et éventuellement « dernière connexion »).
Réponse en cas de succès
Le backend renvoie un objet utilisateur sans mot de passe, via serializeUser(user) (id, email, fullName, role, nickname, companyName, permissions).
Le front stocke cet objet (et surtout l’id) pour les appels suivants.