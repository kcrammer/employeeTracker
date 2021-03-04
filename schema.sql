DROP DATABASE IF EXISTS employeeDB;
CREATE database employeeDB;

USE employeeDB;

CREATE TABLE department ( 
id int not null auto_increment primary key,
name varchar(30) not null

);
 CREATE TABLE role (
 id int not null auto_increment primary key,
 title varchar(30) not null, 
 salary decimal,
department_id int,
foreign key (department_id) references department(id) 
);
CREATE TABLE employee (
id int not null auto_increment primary key,
first_name varchar(30),
last_name varchar(30),
role_id int,
manager_id int,
foreign key (role_id) references role (id),
foreign key (manager_id) references employee(id) 
 
 )