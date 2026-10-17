# French Connection - ATLAS

[![Linux](https://img.shields.io/badge/OS-Linux-success?style=flat-square&logo=linux)](https://www.linux.org/)
[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-blue?style=flat-square&logo=dotnet)](https://dotnet.microsoft.com/)
[![React 3D](https://img.shields.io/badge/Three.js-React--Three--Fiber-blueviolet?style=flat-square&logo=threejs)](https://docs.pmnd.rs/react-three-fiber)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Active-orange?style=flat-square&logo=ai)](https://modelcontextprotocol.io)
[![Docker](https://img.shields.io/badge/Docker-Compatible-blue?style=flat-square&logo=docker)](https://www.docker.com/)

Un jumeau numérique 3D temps réel d’infrastructure et de terminaux de conteneurs, conçu comme une maquette d’ingénierie animée. 

Ce système permet de visualiser l'état, l'activité et l'interconnexion de conteneurs de manière spatiale et ludique (Docker/Proxmox), tout en intégrant un agent mobile autonome robotisé supervisé par IA via le protocole MCP.

---

## Aperçu & Métaphores de l'Infrastructure

L'application transpose votre architecture Docker ou Proxmox sous la forme d’un **Terminal Maritime et Logistique** :
* **Les Quais (Docks)** : Représentent vos sous-réseaux (e.g. DMZ, LAN Backend, LAN Data).
* **Les Conteneurs Maritimes & ISO Tanks** : Modélisent vos applications et bases de données en temps réel (Maersk Blue pour les apps, White/Teal pour les DB).
* **Le Navire Ingress (WAN Cargo)** : Visualise le trafic internet et les requêtes externes entrantes.
* **La Capitainerie / Phare (HQ / DNS)** : Symbolisent les serveurs d'administration et de résolution DNS.
* **Le Robot Quadrupède Spot-01 (Mcp Agent)** : Un jumeau robotique autonome inspiré de Boston Dynamics qui se déplace en patrouille ou en mission d'intervention/reconfiguration (Allure, Lidar & Scanners fonctionnels).
* **Les AGV Autonomes & Éoliennes** : Matérialisent les pipelines d'intégration (CI/CD) et l'alimentation énergétique (Ressources CPU/RAM) de vos hyperviseurs.

```text
   [ WAN / Cargo Vessel ] 
            │ (Requêtes)
            ▼
  ┌───────────────────┐
  │   QUAI 1: DMZ     │ (nginx, waf, proxy...)
  └─────────┬─────────┘
            │
     [ Spot-01 MCP ] (Inspections & Réparations physiques)
            │
  ┌─────────▼─────────┐
  │  QUAI 2: BACKEND  │ (APIs, legacy workers...)
  └─────────┬─────────┘
            │
  ┌─────────▼─────────┐
  │   QUAI 3: DATA    │ (postgres, redis...)
  └───────────────────┘
```

---

## Fonctionnalités UI & UX (Silicon Valley Standard)

* **Rendu 3D Isométrique & Performance** : Moteur Three.js optimisé, éclairage studio architectural diurne et ombres de contact fluides.
* **Camera Preset Rig** : Basculement en un clic entre la vue 3D Isométrique, la vue Plan d'Architecte 2D, et le suivi dynamique en temps réel de Spot-01 (`CAM SPOT-01`).
* **Sélecteurs & Menus Progressifs** : Une interface moderne ultra-allégée (esprit Linear/Palantir). Rien ne bloque la vue.
* **Tiroir Inspecteur (Drawers)** : Visualisation de la consommation CPU (avec mini Sparklines SVG) et flux en direct `STDOUT` lors d’un clic sur un conteneur.
* **Console d’ordre "Spot"** : Barre de commande style Raycast (accessible via `⌘K` ou `/`) pour interagir avec l’IA et déclencher des runbooks (Auto-Heal, Chaos Monkey, Diagnostic, Dépêcher Spot).

---

## Stack Technique

* **Frontend 3D / HUD** : React 18, `@react-three/fiber`, `@react-three/drei`, TailwindCSS, Lucide Icons, Vite.
* **Backend / API (Nexus)** : C# .NET 8, WebSockets pour le pushing d’événements en temps réel, client Docker.Net pour l’interface système.
* **Supervision IA** : Model Context Protocol (MCP) pour la connexion d'agents intelligents.

---

## Installation & Lancement

### Prérequis (Linux / macOS)

Avoir d'installé Node.js (v18+), .NET SDK 8.0, et Docker/Docker-compose.

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y nodejs npm dotnet-sdk-8.0 docker.io docker-compose
```

### 1️Étape 1 : Lancer le Backend Nexus (API & Monitoring)

Depuis la racine du dépôt :
```bash
# Se rendre dans le dossier du backend
cd nexus/src/Nexus.Api/

# Restaurer les dépendances NuGet
dotnet restore

# Option A : Lancer avec simulation de conteneurs (parfait pour le développement)
dotnet run --UseMockDocker=true

# Option B : Lancer en connexion directe sur votre Docker local
dotnet run --UseMockDocker=false
```

### Étape 2 : Lancer l'Interface 3D (Atlas)

Ouvrir un nouveau terminal :
```bash
# Aller dans le dossier frontend
cd atlas/

# Installer les dépendances Node
npm install

# Lancer en mode de développement
npm run dev
```

Accéder à l'interface sur `http://localhost:5173`.

---

## Raccourcis Clavier Globaux

* **⌘K ou Ctrl+K** : Focus instantané sur la barre d'ordres pour interagir avec le robot Spot et le Nexus.
* **ESC** : Fermer l'inspecteur de conteneur, désélectionner ou masquer les menus déroulants ouverts.
* **Espace (ou bouton HUD)** : Activer / masquer le mode d’affichage permanent de toutes les étiquettes 3D.
