-- ==================================================================================
-- 0. NETTOYAGE COMPLET
-- ==================================================================================
DROP TABLE IF EXISTS ref_character_ability CASCADE;
DROP TABLE IF EXISTS scenario_character CASCADE;
-- Les tables métier (game, piece, user_credentials) ne doivent PAS être supprimées à chaque démarrage
-- pour préserver les comptes et l'ELO.
-- DROP TABLE IF EXISTS recruitment_card CASCADE;
-- DROP TABLE IF EXISTS piece CASCADE;
-- DROP TABLE IF EXISTS game_player CASCADE;
-- DROP TABLE IF EXISTS game CASCADE;
DROP TABLE IF EXISTS ability CASCADE;
DROP TABLE IF EXISTS ref_character CASCADE;
DROP TABLE IF EXISTS ref_scenario CASCADE;
DROP TABLE IF EXISTS spring_session_attributes CASCADE;
DROP TABLE IF EXISTS spring_session CASCADE;
-- DROP TABLE IF EXISTS user_credentials CASCADE;

-- On supprime les anciens types ENUM s'ils existent encore, pour faire place nette
DROP TYPE IF EXISTS ability_type CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS game_mode CASCADE;
DROP TYPE IF EXISTS game_phase CASCADE;
DROP TYPE IF EXISTS victory_type CASCADE;
DROP TYPE IF EXISTS card_state CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;

-- ==================================================================================
-- 1. TABLES TECHNIQUES
-- ==================================================================================
CREATE TABLE IF NOT EXISTS SPRING_SESSION (
    PRIMARY_ID CHAR(36) NOT NULL,
    SESSION_ID CHAR(36) NOT NULL,
    CREATION_TIME BIGINT NOT NULL,
    LAST_ACCESS_TIME BIGINT NOT NULL,
    MAX_INACTIVE_INTERVAL INT NOT NULL,
    EXPIRY_TIME BIGINT NOT NULL,
    PRINCIPAL_NAME VARCHAR(100),
    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)
    );

CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36) NOT NULL,
    ATTRIBUTE_NAME VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES BYTEA NOT NULL,
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION(PRIMARY_ID) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    elo INT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );

-- ==================================================================================
-- 2. TABLES MÉTIER (Types ENUM remplacés par VARCHAR pour compatibilité JPA)
-- ==================================================================================

CREATE TABLE IF NOT EXISTS ability (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    ability_type VARCHAR(50) NOT NULL, -- Ex: 'ACTIVE', 'PASSIVE'
    description TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS ref_character (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    recruitment_slots INT DEFAULT 1,
    description TEXT
    );

CREATE TABLE IF NOT EXISTS ref_character_ability (
    character_id VARCHAR(30) REFERENCES ref_character(id),
    ability_id VARCHAR(30) REFERENCES ability(id),
    PRIMARY KEY (character_id, ability_id)
    );

CREATE TABLE IF NOT EXISTS ref_scenario (
                                            id SMALLINT PRIMARY KEY,
                                            name VARCHAR(100) NOT NULL,
    description TEXT
    );

CREATE TABLE IF NOT EXISTS scenario_character (
    scenario_id SMALLINT REFERENCES ref_scenario(id),
    character_id VARCHAR(30) REFERENCES ref_character(id),
    PRIMARY KEY (scenario_id, character_id)
    );

CREATE TABLE IF NOT EXISTS game (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(50) NOT NULL DEFAULT 'CLASSIC',     -- Ex: 'CLASSIC', 'STRATEGIST'
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',   -- Ex: 'IN_PROGRESS'
    phase VARCHAR(50) NOT NULL DEFAULT 'ACTION',     -- Ex: 'RECRUITMENT'
    current_player_index SMALLINT NOT NULL DEFAULT 0,
    turn_number INT NOT NULL DEFAULT 1,
    winner_player_index SMALLINT,
    winner_victory_type VARCHAR(50),                 -- Ex: 'CAPTURE'
    banishment_count SMALLINT DEFAULT 0,
    recruitment_count SMALLINT DEFAULT 0,
    remaining_time_p0 INT DEFAULT 300,
    remaining_time_p1 INT DEFAULT 300,
    last_timer_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    scenario_id SMALLINT REFERENCES ref_scenario(id),
    elo_change_p0 INT,
    elo_change_p1 INT,
    ai_difficulty VARCHAR(50) DEFAULT 'EASY'
    );

-- On s'assure que les colonnes ajoutées récemment existent (pour les environnements où la table est déjà créée)
ALTER TABLE game ADD COLUMN IF NOT EXISTS elo_change_p0 INT;
ALTER TABLE game ADD COLUMN IF NOT EXISTS elo_change_p1 INT;
ALTER TABLE game ADD COLUMN IF NOT EXISTS scenario_id SMALLINT REFERENCES ref_scenario(id);
ALTER TABLE game ADD COLUMN IF NOT EXISTS ai_difficulty VARCHAR(50) DEFAULT 'EASY';

CREATE TABLE IF NOT EXISTS game_player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game(id) ON DELETE CASCADE,
    user_id UUID,
    player_index SMALLINT NOT NULL CHECK (player_index IN (0, 1)),
    is_first_turn_completed BOOLEAN DEFAULT FALSE,
    pieces_count SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (game_id, player_index)
    );

CREATE TABLE IF NOT EXISTS piece (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game(id) ON DELETE CASCADE,
    character_id VARCHAR(30) NOT NULL REFERENCES ref_character(id),
    owner_index SMALLINT NOT NULL CHECK (owner_index IN (0, 1)),
    q SMALLINT NOT NULL,
    r SMALLINT NOT NULL,
    has_acted_this_turn BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_hex_coords CHECK (ABS(q) <= 3 AND ABS(r) <= 3 AND ABS(q + r) <= 3)
    );

CREATE TABLE IF NOT EXISTS recruitment_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game(id) ON DELETE CASCADE,
    character_id VARCHAR(30) NOT NULL REFERENCES ref_character(id),
    state VARCHAR(50) NOT NULL DEFAULT 'IN_DECK', -- Ex: 'VISIBLE'
    deck_order INT,
    visible_slot SMALLINT CHECK (visible_slot BETWEEN 1 AND 3),
    recruited_by_index SMALLINT CHECK (recruited_by_index IN (0, 1)),
    banned_by_index SMALLINT CHECK (banned_by_index IN (0, 1))
    );

-- ==================================================================================
-- 3. DONNÉES DE RÉFÉRENCE (IDs ANGLAIS pour Java)
-- ==================================================================================

-- A. PERSONNAGES
INSERT INTO ref_character (id, name, is_leader, recruitment_slots, description) VALUES
  ('LEADER', 'Leader', TRUE, 0, 'Votre champion. S''il est capturé ou encerclé, la partie est perdue.'),
  ('ACROBAT', 'Acrobate', FALSE, 1, 'Saute en ligne droite par-dessus un Personnage adjacent. Peut effectuer jusqu''à deux sauts consécutifs.'),
  ('ARCHER', 'Archère', FALSE, 1, 'Participe à la capture du Leader adverse à 2 cases en ligne droite. Ne participe pas s''il lui est adjacent.'),
  ('ASSASSIN', 'Assassin', FALSE, 1, 'Capture le Leader adverse, même sans autre allié participant à la capture.'),
  ('BRAWLER', 'Cogneur', FALSE, 1, 'Se déplace sur la case d''un ennemi adjacent et le pousse sur l''une des cases opposées.'),
  ('CAVALRY', 'Cavalier', FALSE, 1, 'Se déplace de deux cases en ligne droite.'),
  ('GRAPPLER', 'Lance-Grappin', FALSE, 1, 'Se déplace jusqu’à un Personnage visible en ligne droite ou l’attire jusqu''à lui.'),
  ('ILLUSIONIST', 'Illusionniste', FALSE, 1, 'Échange de position avec un Personnage visible en ligne droite et non-adjacent.'),
  ('INNKEEPER', 'Tavernier', FALSE, 1, 'Déplace d''une case un allié adjacent.'),
  ('JAILER', 'Geôlier', FALSE, 1, 'Les ennemis adjacents ayant une compétence active ne peuvent pas l''utiliser.'),
  ('MANIPULATOR', 'Manipulatrice', FALSE, 1, 'Déplace d’une case un ennemi visible en ligne droite et non-adjacent.'),
  ('NEMESIS', 'Némésis', FALSE, 1, 'Ne joue pas à son tour. DOIT se déplacer de 2 cases à la fin de toute action déplaçant le Leader adverse.'),
  ('OLD_BEAR', 'Vieil Ours', FALSE, 2, 'Recruté avec l''Ourson. Déplacez l''un ou les deux à la suite.'),
  ('CUB', 'Ourson', FALSE, 0, 'Vient avec le Vieil Ours. Ne participe pas à la capture du Leader.'),
  ('PROTECTOR', 'Protecteur', FALSE, 1, 'Les compétences des ennemis ne peuvent déplacer ni le protecteur, ni ses alliés adjacents.'),
  ('PROWLER', 'Rôdeuse', FALSE, 1, 'Se déplace sur n’importe quelle case non-adjacente à un ennemi.'),
  ('ROYAL_GUARD', 'Garde Royal', FALSE, 1, 'Se déplace sur une case adjacente à votre Leader, puis peut se déplacer d''une case.'),
  ('VIZIER', 'Vizir', FALSE, 1, 'Votre Leader peut se déplacer d’une case supplémentaire lors de son action.')
    ON CONFLICT (id) DO NOTHING;

-- B. SCÉNARIOS
INSERT INTO ref_scenario (id, name, description) VALUES
                                                     (1, 'Acrobates et Cavaliers', 'Mobilité extrême avec sauts et charges'),
                                                     (2, 'Illusionnistes', 'Manipulation et échanges de position'),
                                                     (3, 'Gardiens', 'Contrôle et protection du terrain'),
                                                     (4, 'Cogneurs', 'Déplacements forcés et contrôle agressif'),
                                                     (5, 'Némésis', 'Réaction automatique aux mouvements ennemis'),
                                                     (6, 'Rôdeurs', 'Déplacements stratégiques et support'),
                                                     (7, 'Chasseurs', 'Capture à distance et élimination directe'),
                                                     (8, 'Duo Animal', 'Maîtrisez le Vieil Ours et son Ourson')
    ON CONFLICT (id) DO NOTHING;

INSERT INTO scenario_character (scenario_id, character_id) VALUES
                                                               (1, 'LEADER'), (1, 'ACROBAT'), (1, 'CAVALRY'),
                                                               (2, 'LEADER'), (2, 'ILLUSIONIST'), (2, 'MANIPULATOR'),
                                                               (3, 'LEADER'), (3, 'JAILER'), (3, 'PROTECTOR'), (3, 'OLD_BEAR'),
                                                               (4, 'LEADER'), (4, 'BRAWLER'), (4, 'GRAPPLER'),
                                                               (5, 'LEADER'), (5, 'NEMESIS'),
                                                               (6, 'LEADER'), (6, 'PROWLER'), (6, 'INNKEEPER'), (6, 'OLD_BEAR'),
                                                               (7, 'LEADER'), (7, 'ARCHER'), (7, 'ASSASSIN'),
                                                               (8, 'LEADER'), (8, 'OLD_BEAR'), (8, 'BRAWLER')
    ON CONFLICT DO NOTHING;

-- C. COMPÉTENCES
INSERT INTO ability (id, name, ability_type, description) VALUES
                                                              ('ACROBAT_JUMP', 'Saut Acrobatique', 'ACTIVE', 'Saute en ligne droite par-dessus un Personnage adjacent.'),
                                                              ('CAVALRY_CHARGE', 'Charge', 'ACTIVE', 'Se déplace de deux cases en ligne droite.'),
                                                              ('BRAWLER_PUSH', 'Bousculade', 'ACTIVE', 'Se déplace sur la case d''un ennemi adjacent et le pousse.'),
                                                              ('ROYAL_GUARD_PROTECT', 'Protection Royale', 'ACTIVE', 'Se déplace sur une case adjacente au Leader.'),
                                                              ('ILLUSIONIST_SWAP', 'Échange', 'ACTIVE', 'Échange de position avec un personnage visible et non-adjacent.'),
                                                              ('GRAPPLE_HOOK', 'Grappin', 'ACTIVE', 'Se déplace jusqu''à une cible ou l''attire.'),
                                                              ('MANIPULATOR_MOVE', 'Manipulation', 'ACTIVE', 'Déplace d''une case un ennemi visible.'),
                                                              ('PROWLER_STEALTH', 'Furtivité', 'ACTIVE', 'Se déplace sur n''importe quelle case non-adjacente à un ennemi.'),
                                                              ('INNKEEPER_ASSIST', 'Assistance', 'ACTIVE', 'Déplace d''une case un allié adjacent.'),
                                                              ('ARCHER_RANGE', 'Tir à Distance', 'PASSIVE', 'Participe à la capture à une distance de 2 cases.'),
                                                              ('ASSASSIN_SOLO', 'Assassinat', 'PASSIVE', 'Capture le Leader adverse même sans autre allié.'),
                                                              ('JAILER_BLOCK', 'Blocage', 'PASSIVE', 'Les ennemis adjacents ne peuvent pas utiliser leur compétence active.'),
                                                              ('PROTECTOR_SHIELD', 'Bouclier', 'PASSIVE', 'Empêche le déplacement forcé des alliés adjacents.'),
                                                              ('VIZIER_BOOST', 'Conseil', 'PASSIVE', 'Le Leader peut se déplacer d''une case supplémentaire.'),
                                                              ('BEAR_DUO', 'Duo', 'SPECIAL', 'Vieil Ours et Ourson sont recrutés ensemble.'),
                                                              ('NEMESIS_REACT', 'Réaction', 'SPECIAL', 'Se déplace quand le Leader adverse bouge.')
    ON CONFLICT (id) DO NOTHING;

-- D. LIAISONS
INSERT INTO ref_character_ability (character_id, ability_id) VALUES
                                                                 ('ACROBAT', 'ACROBAT_JUMP'),
                                                                 ('CAVALRY', 'CAVALRY_CHARGE'),
                                                                 ('BRAWLER', 'BRAWLER_PUSH'),
                                                                 ('ROYAL_GUARD', 'ROYAL_GUARD_PROTECT'),
                                                                 ('ILLUSIONIST', 'ILLUSIONIST_SWAP'),
                                                                 ('GRAPPLER', 'GRAPPLE_HOOK'),
                                                                 ('MANIPULATOR', 'MANIPULATOR_MOVE'),
                                                                 ('PROWLER', 'PROWLER_STEALTH'),
                                                                 ('INNKEEPER', 'INNKEEPER_ASSIST'),
                                                                 ('ARCHER', 'ARCHER_RANGE'),
                                                                 ('ASSASSIN', 'ASSASSIN_SOLO'),
                                                                 ('JAILER', 'JAILER_BLOCK'),
                                                                 ('PROTECTOR', 'PROTECTOR_SHIELD'),
                                                                 ('VIZIER', 'VIZIER_BOOST'),
                                                                 ('OLD_BEAR', 'BEAR_DUO'),
                                                                 ('CUB', 'BEAR_DUO'),
                                                                 ('NEMESIS', 'NEMESIS_REACT')
    ON CONFLICT DO NOTHING;