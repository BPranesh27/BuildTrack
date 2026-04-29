-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS builder_db;

-- Use the database
USE builder_db;

-- Note: The Spring Boot application (Hibernate) is configured with ddl-auto=update,
-- so it will automatically create the tables (users, houses, expenses, etc.) 
-- upon the first successful connection.

-- If you want to see the existing tables or verify progress, run:
-- SHOW TABLES;
