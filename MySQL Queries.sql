-- Use the SwiftCart database
USE SwiftCart;

-- Table for Products
CREATE TABLE IF NOT EXISTS Products (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    Category VARCHAR(255),
    Name VARCHAR(255),
    Description TEXT,
    Price DECIMAL(10, 2),
    Size VARCHAR(20),
    Quantity INT DEFAULT 0
);

-- Table for Users
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE,
    Password VARCHAR(255),  -- You should store hashed passwords in a real-world scenario
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Address VARCHAR(255),
    City VARCHAR(50),
    PostalCode VARCHAR(10),
    Phone VARCHAR(15)
);

-- Table for UserOrders
CREATE TABLE IF NOT EXISTS UserOrders (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    ProductID INT,
    Quantity INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Table for Contact Us Messages
CREATE TABLE IF NOT EXISTS ContactMessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(255),
    Message TEXT
);

-- Table for UserPayments
CREATE TABLE IF NOT EXISTS UserPayments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    CardNumber VARCHAR(20), -- In a real-world scenario, consider storing this securely and following PCI DSS guidelines
    CVV VARCHAR(4),
    CardholderName VARCHAR(100),
    ExpirationDate VARCHAR(7), -- Format: MM/YYYY
    BillingAddress VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Table for UserRoles
CREATE TABLE IF NOT EXISTS UserRoles (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) UNIQUE
);

-- Insert default roles (you can customize these as needed)
INSERT IGNORE INTO UserRoles (RoleName) VALUES ('Admin'), ('Customer');

-- Table for UserRolesMapping
CREATE TABLE IF NOT EXISTS UserRolesMapping (
    UserRoleID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    RoleID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoleID) REFERENCES UserRoles(RoleID)
);


-- Assign 'Customer' role to a user
INSERT INTO UserRolesMapping (UserID, RoleID)
VALUES (1, 2); -- Assuming the user's ID is 1 and 'Customer' role ID is 2

-- Assign 'Admin' role to a user
INSERT INTO UserRolesMapping (UserID, RoleID)
VALUES (2, 1); -- Assuming the user's ID is 2 and 'Admin' role ID is 1


-- Use the SwiftCart database
USE SwiftCart;

-- Dummy data for Products
INSERT INTO Products (Category, Name, Description, Price, Size, Quantity)
VALUES
    ('Shoes', 'Running Shoes', 'High-performance running shoes', 89.99, '9', 50),
    ('Shirts', 'Casual Shirt', 'Comfortable cotton shirt', 29.99, 'M', 30),
    ('Socks', 'Ankle Socks', 'Breathable ankle socks', 9.99, 'One Size', 100);

-- Dummy data for Users
INSERT INTO Users (Email, Password, FirstName, LastName, Address, City, PostalCode, Phone)
VALUES
    ('user1@example.com', 'hashed_password', 'John', 'Doe', '123 Main St', 'City1', '12345', '555-1234'),
    ('user2@example.com', 'hashed_password', 'Jane', 'Smith', '456 Oak St', 'City2', '67890', '555-5678');

-- Dummy data for UserOrders
INSERT INTO UserOrders (UserID, ProductID, Quantity)
VALUES
    (1, 1, 2),
    (1, 2, 1),
    (2, 3, 3);

-- Dummy data for ContactMessages
INSERT INTO ContactMessages (Name, Email, Message)
VALUES
    ('User3', 'user3@example.com', 'This is a test message.'),
    ('User4', 'user4@example.com', 'Another test message.');

-- Dummy data for UserPayments
INSERT INTO UserPayments (UserID, CardNumber, CVV, CardholderName, ExpirationDate, BillingAddress)
VALUES
    (1, '************1111', '123', 'John Doe', '12/25', '123 Main St'),
    (2, '************2222', '456', 'Jane Smith', '06/24', '456 Oak St');

-- Dummy data for UserRolesMapping
INSERT INTO UserRolesMapping (UserID, RoleID)
VALUES
    (1, 1), -- Assign 'Admin' role to User1
    (2, 2); -- Assign 'Customer' role to User2

ALTER TABLE Products ADD COLUMN ImagePath VARCHAR(255);
