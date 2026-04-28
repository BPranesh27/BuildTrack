-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS buider_db;

-- Use the database
USE buider_db;

-- Note: The Spring Boot application (Hibernate) is configured with ddl-auto=update,
-- so it will automatically create the tables (users, houses, expenses, etc.) 
-- upon the first successful connection.

-- If you want to see the existing tables or verify progress, run:
-- SHOW TABLES;
