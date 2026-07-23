CREATE DATABASE rpg;
\c rpg;
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS hypopg;

-- CREATE DATABASE powa ;
-- \c powa
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- CREATE EXTENSION IF NOT EXISTS powa;
-- CREATE EXTENSION IF NOT EXISTS pg_qualstats;
-- CREATE EXTENSION IF NOT EXISTS pg_stat_kcache;

-- CREATE ROLE powa SUPERUSER LOGIN PASSWORD 'powa';

create schema if not exists partman;

create extension if not exists btree_gist;
create extension if not exists pg_partman with schema partman;
create extension if not exists pg_cron;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
