# Leaders - API Documentation

Base URL: `http://localhost:8080/api`

---

## 🎮 Game Management

### Create Game

Crée une nouvelle partie avec un scénario spécifique.

**Endpoint:** `POST /games/create`

**Request Body:**

```json
{
  "scenarioId": 1,
  "player1UserId": "00000000-0000-0000-0000-000000000001",
  "player2UserId": "00000000-0000-0000-0000-000000000002"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "mode": "CLASSIC",
  "status": "WAITING",
  "phase": "ACTION",
  "currentPlayerIndex": 0,
  "turnNumber": 1,
  "scenarioId": 1
}
```

**Scénarios disponibles:**

- `1` - Acrobates et Cavaliers
- `2` - Illusionnistes
- `3` - Gardiens
- `4` - Cogneurs
- `5` - Némésis
- `6` - Rôdeurs
- `7` - Chasseurs

---

### Get Game State

Récupère l'état complet de la partie (joueurs, pièces, river).

**Endpoint:** `GET /games/{gameId}`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "mode": "CLASSIC",
  "status": "IN_PROGRESS",
  "phase": "ACTION",
  "currentPlayerIndex": 0,
  "turnNumber": 1,
  "scenarioId": 1,
  "winnerPlayerIndex": null,
  "winnerVictoryType": null,
  "players": [
    {
      "id": "uuid",
      "userId": "uuid",
      "playerIndex": 0,
      "isFirstTurnCompleted": false,
      "piecesCount": 2
    }
  ],
  "pieces": [
    {
      "id": "uuid",
      "characterId": "LEADER",
      "ownerIndex": 0,
      "q": 0,
      "r": 2,
      "hasActedThisTurn": false
    }
  ],
  "river": [
    {
      "id": "uuid",
      "characterId": "ACROBATE",
      "visibleSlot": 1
    }
  ],
  "deckCount": 0
}
```

**Game Status:**

- `WAITING` - En attente du placement des Leaders
- `IN_PROGRESS` - Partie en cours
- `FINISHED_CAPTURE` - Victoire par capture
- `FINISHED_ENCIRCLE` - Victoire par encerclement

**Game Phase:**

- `ACTION` - Phase d'action (mouvement ou capacité)
- `RECRUITMENT` - Phase de recrutement

---

### Place Leader

Place le Leader d'un joueur sur le plateau (phase initiale).

**Endpoint:** `POST /games/{gameId}/place-leader`

**Request Body:**

```json
{
  "playerIndex": 0,
  "q": 0,
  "r": 2
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "characterId": "LEADER",
  "ownerIndex": 0,
  "q": 0,
  "r": 2
}
```

**Notes:**

- Le premier joueur (playerIndex: 0) place son Leader en premier
- Après le placement des 2 Leaders, le statut passe à `IN_PROGRESS`

---

### End Turn

Termine le tour du joueur actuel et passe au joueur suivant.

**Endpoint:** `POST /games/{gameId}/end-turn`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "currentPlayerIndex": 1,
  "turnNumber": 1,
  "phase": "ACTION"
}
```

---

### Next Phase

Passe à la phase suivante (ACTION → RECRUITMENT → ACTION du joueur suivant).

**Endpoint:** `POST /games/{gameId}/next-phase`

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "phase": "RECRUITMENT",
  "currentPlayerIndex": 0
}
```

---

## 🎴 Recruitment

### Recruit Character

Recrute un personnage de la River et le place sur le plateau.

**Endpoint:** `POST /games/{gameId}/recruit`

**Request Body:**

```json
{
  "cardId": "uuid",
  "playerIndex": 0,
  "q": -3,
  "r": 2
}
```

**Response:** `200 OK`

```json
{
  "piece": {
    "id": "uuid",
    "characterId": "CAVALIER",
    "ownerIndex": 0,
    "q": -3,
    "r": 2
  },
  "message": "Character recruited successfully"
}
```

**Cases de recrutement valides:**

- **Joueur 0:** `(-3, 2)`, `(-2, 3)`, `(-3, 3)`
- **Joueur 1:** `(3, -2)`, `(2, -3)`, `(3, -3)`

**Limites:**

- Maximum 5 pièces par joueur
- La case doit être libre
- Le tour passe au joueur suivant après recrutement

---

## ♟️ Pieces Movement

### Move Piece

Déplace une pièce d'une case adjacente.

**Endpoint:** `POST /pieces/{pieceId}/move`

**Request Body:**

```json
{
  "toQ": 0,
  "toR": 1
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "characterId": "LEADER",
  "ownerIndex": 0,
  "q": 0,
  "r": 1,
  "hasActedThisTurn": true
}
```

**Avec victoire:**

```json
{
  "piece": { ... },
  "victory": {
    "winner": 0,
    "type": "CAPTURE"
  }
}
```

**Règles:**

- Déplacement d'une seule case adjacente
- La case de destination doit être libre
- La pièce ne doit pas avoir déjà agi ce tour
- Déplacer un Leader peut déclencher la réaction Némésis (Scénario 5)

---

## ✨ Abilities

### Use Active Ability

Utilise la capacité active d'un personnage.

**Endpoint:** `POST /games/{gameId}/pieces/{pieceId}/ability`

**Request Body (simple):**

```json
{
  "targetQ": 0,
  "targetR": 0
}
```

**Request Body (avec destination - Manipulatrice, Cogneur):**

```json
{
  "targetQ": 0,
  "targetR": 0,
  "destinationQ": 1,
  "destinationR": 0
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "characterId": "CAVALIER",
  "ownerIndex": 0,
  "q": -1,
  "r": 2,
  "hasActedThisTurn": true
}
```

---

### Capacités par Scénario

#### Scénario 1 - Acrobates et Cavaliers

- **Acrobate:** Saute par-dessus une pièce adjacente (jusqu'à 2 sauts consécutifs)

```json
{ "targetQ": 2, "targetR": 0 }
```

- **Cavalier:** Se déplace de 2 cases en ligne droite

```json
{ "targetQ": -1, "targetR": 2 }
```

---

#### Scénario 2 - Illusionnistes

- **Illusionniste:** Échange de position avec un personnage visible en ligne droite non-adjacent

```json
{ "targetQ": 0, "targetR": -1 }
```

- **Manipulatrice:** Déplace d'une case un ennemi visible en ligne droite non-adjacent

```json
{
  "targetQ": 0,
  "targetR": -1,
  "destinationQ": 1,
  "destinationR": -1
}
```

---

#### Scénario 3 - Gardiens (PASSIF)

- **Geôlier:** Les ennemis adjacents ne peuvent pas utiliser leur action
- **Protecteur:** Lui et ses alliés adjacents ne peuvent pas être déplacés par capacités ennemies

_Pas d'endpoint spécifique - logique appliquée automatiquement_

---

#### Scénario 4 - Cogneurs

- **Cogneur:** Se déplace sur la case d'un ennemi adjacent et le pousse

```json
{
  "targetQ": 0,
  "targetR": 0,
  "destinationQ": 0,
  "destinationR": -1
}
```

- **Lance-grappin:** Se déplace vers une pièce visible OU l'attire

```json
{ "targetQ": 0, "targetR": 0 }
```

---

#### Scénario 5 - Némésis (SPÉCIAL)

**Move Nemesis (forcé après mouvement du Leader adverse)**

**Endpoint:** `POST /games/{gameId}/pieces/{pieceId}/nemesis-move`

**Request Body:**

```json
{
  "targetQ": 1,
  "targetR": -2
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "characterId": "NEMESIS",
  "ownerIndex": 1,
  "q": 1,
  "r": -2,
  "hasActedThisTurn": true
}
```

**Règles:**

- Némésis ne peut PAS utiliser d'actions normales
- Doit se déplacer de 2 cases quand le Leader adverse bouge
- Peut bouger plusieurs fois dans le même tour

---

#### Scénario 6 - Rôdeurs

- **Rôdeuse:** Se déplace sur n'importe quelle case non-adjacente à un ennemi

```json
{ "targetQ": 2, "targetR": 1 }
```

- **Tavernier:** Déplace d'une case un allié adjacent

```json
{
  "targetQ": 0,
  "targetR": 1,
  "destinationQ": 0,
  "destinationR": 2
}
```

---

#### Scénario 7 - Chasseurs (PASSIF)

- **Archère:** Participe à la capture du Leader adverse à 2 cases en ligne droite
- **Assassin:** Capture le Leader adverse seul (sans autre allié)

_Pas d'endpoint spécifique - logique appliquée automatiquement lors de la détection de victoire_

---

## 🏆 Victory Conditions

La victoire est détectée automatiquement après chaque mouvement ou action.

### Capture

Le Leader est capturé si **2+ pièces ennemies** participent :

- Pièces adjacentes au Leader
- Archère à 2 cases en ligne droite (Scénario 7)
- Assassin seul suffit (Scénario 7)

### Encerclement

Le Leader est encerclé si **toutes les cases adjacentes** sont :

- Occupées par des pièces
- Hors du plateau (bord)

---

## 📐 Coordinate System

Le plateau utilise des **coordonnées axiales hexagonales** :

- Centre : `(0, 0)`
- Rayon : 3 (plateau de 37 cases)
- Contrainte : `|q| <= 3`, `|r| <= 3`, `|q + r| <= 3`

### Directions adjacentes

```
     (-1, 1)   (0, 1)
        \       /
(-1, 0) - (0,0) - (1, 0)
        /       \
     (0, -1)   (1, -1)
```

---

## 📊 Characters

### Tous les personnages disponibles

```
LEADER        - Présent dans tous les scénarios
ACROBATE      - Scénario 1
CAVALIER      - Scénario 1
ILLUSIONNISTE - Scénario 2
MANIPULATRICE - Scénario 2
GEOLIER       - Scénario 3
PROTECTEUR    - Scénario 3
COGNEUR       - Scénario 4
LANCE_GRAPPIN - Scénario 4
NEMESIS       - Scénario 5
RODEUSE       - Scénario 6
TAVERNIER     - Scénario 6
ARCHERE       - Scénario 7
ASSASSIN      - Scénario 7
```

---

## ⚠️ Error Responses

**400 Bad Request**

```json
{
  "error": "Cell already occupied"
}
```

**Common error messages:**

- `"Piece not found"`
- `"Not your turn"`
- `"Piece has already acted this turn"`
- `"Cell already occupied"`
- `"Invalid recruitment cell"`
- `"Max 5 pieces per player"`
- `"Target must be in line of sight"`
- `"Enemy must be adjacent"`

---

## 🔄 Game Flow Example

```
1. POST /games/create (scenarioId: 1)
2. POST /games/{id}/place-leader (player 0)
3. POST /games/{id}/place-leader (player 1)
   → Status: IN_PROGRESS

4. POST /games/{id}/recruit (player 0, Cavalier)
   → Tour passe à player 1

5. POST /games/{id}/recruit (player 1, Acrobate)
   → Tour passe à player 0

6. POST /pieces/{cavalier_id}/move
   → Déplacement normal

7. POST /games/{id}/pieces/{acrobate_id}/ability
   → Utilisation capacité

8. GET /games/{id}
   → Vérifier état + victoire
```

---

## 🚀 Notes d'implémentation

- CORS activé pour `origins: "*"`
- Authentification JWT désactivée pour `/api/games/**` et `/api/pieces/**`
- Transactions gérées automatiquement avec `@Transactional`
- Détection de victoire automatique après chaque action

---
