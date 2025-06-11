-- Script d'initialisation PostgreSQL
CREATE USER eco_user WITH PASSWORD 'eco_password';
CREATE DATABASE eco_database OWNER eco_user;
GRANT ALL PRIVILEGES ON DATABASE eco_database TO eco_user;
ALTER USER eco_user CREATEDB; 