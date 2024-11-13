CREATE DATABASE IF NOT EXISTS debt_management;

USE debt_management;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL
);

CREATE TABLE debt_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO debt_types (name) VALUES 
    ('creditCard'),
    ('personalLoan'),
    ('medicalBill'),
    ('studentLoan'),
    ('other');

CREATE TABLE debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    debt_type_id INT NOT NULL,
    creditor_name VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (debt_type_id) REFERENCES debt_types(id)
);

CREATE TABLE additional_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    short_term_loss BOOLEAN NOT NULL,
    future_income_increase BOOLEAN NOT NULL,
    future_income_amount DECIMAL(10, 2),
    debt_situation ENUM('overwhelmed', 'struggling', 'managing', 'improving') NOT NULL,
    monthly_minimum_payments DECIMAL(10, 2) NOT NULL,
    has_savings BOOLEAN NOT NULL,
    savings_amount DECIMAL(10, 2),
    years_to_debt_free INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- Disconnect from any potential previous sessions to avoid errors
-- (Run these in your MySQL command-line tool if needed before creating a new user)

-- Create a new user 'sp' for managing the debt_management database
CREATE USER 'dealingwithdebt_dev'@'localhost' IDENTIFIED BY 'india@12345'; -- Replace 'password' with a secure password

-- Grant full access to the debt_management database to the new user
GRANT ALL PRIVILEGES ON debt_management.* TO 'dealingwithdebt_dev'@'localhost';

-- Apply the privilege changes
FLUSH PRIVILEGES;
