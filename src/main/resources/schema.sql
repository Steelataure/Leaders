-- NETTOYAGE DES ANCIENS TYPES (Crucial pour éviter ton erreur)
DROP TYPE IF EXISTS ability_type CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS game_mode CASCADE;
DROP TYPE IF EXISTS game_phase CASCADE;
DROP TYPE IF EXISTS victory_type CASCADE;
DROP TYPE IF EXISTS card_state CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;

-- 1. TABLES TECHNIQUES
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

-- 2. CRÉATION DES TYPES
CREATE TYPE ability_type AS ENUM ('ACTIVE', 'PASSIVE', 'SPECIAL');
CREATE TYPE game_status AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED_CAPTURE', 'FINISHED_ENCIRCLE');
CREATE TYPE game_mode AS ENUM ('CLASSIC', 'STRATEGIST');
CREATE TYPE game_phase AS ENUM ('BANISHMENT', 'ACTION', 'RECRUITMENT');
CREATE TYPE victory_type AS ENUM ('CAPTURE', 'ENCIRCLEMENT');
CREATE TYPE card_state AS ENUM ('IN_DECK', 'VISIBLE', 'RECRUITED', 'BANNED');
CREATE TYPE action_type AS ENUM ('MOVE', 'ABILITY', 'RECRUIT', 'BAN', 'PASS');

-- 3. TABLES MÉTIER
CREATE TABLE IF NOT EXISTS ability (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    ability_type ability_type NOT NULL,
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

CREATE TABLE IF NOT EXISTS game (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode game_mode NOT NULL DEFAULT 'CLASSIC',
    status game_status NOT NULL DEFAULT 'WAITING',
    phase game_phase NOT NULL DEFAULT 'ACTION',
    current_player_index SMALLINT NOT NULL DEFAULT 0,
    turn_number INT NOT NULL DEFAULT 1,
    winner_player_index SMALLINT,
    winner_victory_type victory_type,
    banishment_count SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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
    CONSTRAINT valid_hex_coords CHECK (ABS(q) <= 3 AND ABS(r) <= 3 AND ABS(q + r) <= 3),
    UNIQUE (game_id, q, r)
);

CREATE TABLE IF NOT EXISTS recruitment_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES game(id) ON DELETE CASCADE,
    character_id VARCHAR(30) NOT NULL REFERENCES ref_character(id),
    state card_state NOT NULL DEFAULT 'IN_DECK',
    deck_order INT,
    visible_slot SMALLINT CHECK (visible_slot BETWEEN 1 AND 3),
    recruited_by_index SMALLINT CHECK (recruited_by_index IN (0, 1)),
    banned_by_index SMALLINT CHECK (banned_by_index IN (0, 1))
);

CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);