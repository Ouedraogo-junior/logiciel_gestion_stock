# Allo Electronics — Gestion de Stock & Ventes

Application web de gestion de boutique (produits, variantes, stock, ventes, dettes clients, reçus) avec catalogue public en ligne. Conçue pour un commerce d'électronique/téléphonie (produits déclinés par couleur, stockage et état).

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)

---

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Modèle de données](#modèle-de-données)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage](#démarrage)
- [Authentification et rôles](#authentification-et-rôles)
- [Modules fonctionnels](#modules-fonctionnels)
- [Aperçu de l'API](#aperçu-de-lapi)
- [PWA](#pwa)
- [Licence](#licence)

---

## Architecture

```
Navigateur (PWA)
        ↓
Next.js 16 (App Router) — Server Components + Route Handlers /api/*
        ↓
Supabase (PostgreSQL + Auth + Storage)
```

Application full-stack Next.js : les pages back-office sont rendues côté serveur, les mutations passent par des routes API internes (`app/api/*`) qui utilisent à la fois le client Supabase lié à la session (RLS) et un client `service_role` (`lib/supabase/admin.ts`) pour les opérations administratives.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript + TailwindCSS v4 |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage) |
| Génération PDF | @react-pdf/renderer |
| PWA | @ducanh2912/next-pwa (cache offline via Workbox) |
| Déploiement | Vercel |

---

## Structure du projet

```
logiciel_gestion_stock/
├── app/
│   ├── (public)/                    # Vitrine publique
│   │   ├── catalogue/               # Catalogue produits en ligne
│   │   └── contact/
│   ├── (auth)/login/                # Connexion
│   ├── (back-office)/               # Espace connecté
│   │   ├── dashboard/               # Tableau de bord (CA du jour, dettes, stock bas)
│   │   ├── products/                # Produits & variantes
│   │   ├── stock/                   # Mouvements de stock + historique
│   │   ├── orders/                  # Ventes / commandes
│   │   ├── debts/                   # Dettes clients (ventes à crédit)
│   │   ├── receipts/                # Reçus générés
│   │   ├── stats/                   # Statistiques (réservé admin)
│   │   └── settings/
│   │       ├── shop/                # Paramètres boutique (logo, coordonnées)
│   │       ├── account/             # Paramètres du compte connecté
│   │       └── users/               # Gestion des utilisateurs (réservé admin)
│   ├── api/                         # Route Handlers (voir « Aperçu de l'API »)
│   └── auth/signout/
├── components/                      # Composants partagés (sidebar, stats, reçu...)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Client Supabase (navigateur)
│   │   ├── server.ts                # Client Supabase (Server Components / Route Handlers, RLS)
│   │   └── admin.ts                 # Client service_role — usage serveur uniquement
│   └── receipt-pdf.tsx              # Gabarit PDF du reçu de vente
├── types/database.ts                # Types générés depuis le schéma Supabase
├── proxy.ts                         # Middleware Next.js — protection des routes + contrôle admin
└── supabase/                        # Config du projet Supabase lié (CLI)
```

---

## Modèle de données

Schéma principal (PostgreSQL / Supabase) :

| Table | Rôle |
|---|---|
| `profiles` | Comptes utilisateurs internes (rôle, statut actif, doit changer son mot de passe) |
| `products` / `product_variants` | Produits et leurs déclinaisons (couleur, stockage, état, prix d'achat/vente, seuil d'alerte) |
| `stock_movements` | Historique des entrées/sorties de stock |
| `orders` / `order_items` | Ventes et leurs lignes d'articles |
| `debt_payments` | Paiements partiels sur les ventes à crédit |
| `receipts` | Reçus générés pour chaque vente (numéro, cachet, PDF) |
| `shop_settings` | Informations de la boutique (nom, contact, logo) |
| `audit_logs` | Journal des actions sensibles |
| `bons` | Bons de commande/réservation (table présente en base, non encore reliée à une fonctionnalité de l'interface) |

Vues dédiées : `v_active_debts` (dettes en cours), `v_daily_revenue` (chiffre d'affaires par jour), `v_low_stock` (variantes sous le seuil d'alerte), `v_public_catalogue` (catalogue exposé publiquement).

---

## Prérequis

- Node.js 20+
- npm
- Un projet [Supabase](https://supabase.com) (PostgreSQL + Auth)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/Ouedraogo-junior/logiciel_gestion_stock.git
cd logiciel_gestion_stock
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

> La clé `SUPABASE_SERVICE_ROLE_KEY` contourne les règles RLS — à ne jamais exposer côté client ni committer.

### 4. Base de données

Le schéma (tables listées ci-dessus, vues, fonction `get_my_role`, RLS) est géré côté Supabase. Utiliser le CLI Supabase pour lier le projet et appliquer les migrations si un dossier `supabase/migrations` est fourni séparément, ou reconstruire le schéma directement depuis `types/database.ts` comme référence.

### 5. Créer le premier utilisateur admin

Créer l'utilisateur dans Supabase Auth (dashboard ou CLI), puis lui associer un profil admin :

```sql
insert into profiles (id, full_name, username, role, is_active)
values ('<uuid_auth_user>', 'Admin', 'admin', 'admin', true);
```

---

## Démarrage

```bash
npm run dev
```

Application accessible sur `http://localhost:3000`. Catalogue public sur `/catalogue`, back-office sur `/dashboard` après connexion (`/login`).

---

## Authentification et rôles

Authentification via Supabase Auth, protégée par le middleware `proxy.ts` :

- Routes publiques sans connexion : `/`, `/catalogue`, `/contact`, `/login`
- Toute autre route nécessite une session valide, sinon redirection vers `/login`
- `/settings/users` est réservée au rôle `admin` (vérifié via la table `profiles`)
- `/api/users`, `/api/stats` vérifient également le rôle admin côté serveur

| Rôle | Accès |
|---|---|
| Utilisateur standard | Produits, stock, ventes, dettes, reçus, paramètres boutique/compte |
| `admin` | Accès complet + statistiques + gestion des utilisateurs |

---

## Modules fonctionnels

- **Catalogue public** — vitrine en ligne des produits disponibles (`v_public_catalogue`), sans authentification
- **Produits & variantes** — fiche produit avec déclinaisons par couleur/stockage/état, prix d'achat et de vente, seuil d'alerte de stock
- **Stock** — entrées/sorties manuelles avec motif et note, historique complet des mouvements
- **Ventes (orders)** — création de vente avec vérification du stock disponible, calcul automatique du total, gestion des statuts (payée, livrée, dette...)
- **Dettes clients** — suivi des ventes à crédit (`DEBT`/`DELIVERED`), paiements partiels enregistrés dans `debt_payments`
- **Reçus** — génération automatique d'un reçu PDF à chaque vente, avec cachet selon le statut (payé/livré), remplacement possible d'un reçu
- **Statistiques** — chiffre d'affaires par période (mois/année), réservé aux admins
- **Paramètres boutique** — nom, logo, coordonnées affichés sur les reçus et le catalogue
- **Gestion des utilisateurs** — création de comptes internes, activation/désactivation, changement de mot de passe obligatoire à la première connexion

---

## Aperçu de l'API

Toutes les routes sont sous `/api` et nécessitent une session Supabase valide.

| Ressource | Méthodes | Description |
|---|---|---|
| `/api/products` | `POST` | Créer un produit avec ses variantes |
| `/api/products/[id]` | `GET`, `PATCH` | Détail / mise à jour d'un produit |
| `/api/products/variants` | `GET` | Variantes disponibles en stock (hors archivées) |
| `/api/stock` | `GET`, `POST` | Historique des mouvements / nouvel mouvement (`IN`/`OUT`) |
| `/api/orders` | `GET`, `POST`, `PUT` | Liste, création (vente + reçu auto) et mise à jour d'une commande |
| `/api/orders/[id]` | `GET`, `PATCH` | Détail / mise à jour d'une commande |
| `/api/debts` | `GET`, `POST`, `PATCH` | Ventes à crédit, ajout de dette, enregistrement d'un paiement |
| `/api/receipts` | `GET`, `POST`, `PATCH` | Reçus générés, création, mise à jour (remplacement) |
| `/api/dashboard` | `GET` | Données agrégées du tableau de bord (CA du jour, dettes, stock bas) |
| `/api/stats` | `GET` | Statistiques par mois/année *(admin)* |
| `/api/settings/shop` | `GET`, `PATCH`, `PUT` | Paramètres boutique |
| `/api/users` | `GET`, `POST` | Liste et création d'utilisateurs *(admin)* |
| `/api/users/[id]` | `PATCH` | Mise à jour d'un utilisateur *(admin)* |
| `/api/account` | `PATCH` | Changement du mot de passe du compte connecté |

---

## PWA

L'application est installable (manifest `Allo Electronics` / `AlloElec`) avec mise en cache offline via Workbox :
- Assets statiques et images Next.js en `CacheFirst`
- Stockage Supabase (logo, images) en `CacheFirst`
- API Supabase et routes internes `/api/*` en `NetworkFirst` (bascule sur le cache hors-ligne)
- Pages principales du back-office en `StaleWhileRevalidate`

Le service worker est désactivé en environnement de développement.

---

## Licence

Projet propriétaire. Tous droits réservés. Usage et distribution soumis à l'autorisation du propriétaire du projet.

---

*Allo Electronics — Gestion de Stock & Ventes — 2026*
