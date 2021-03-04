// Dependencies
const inquirer = require('inquirer');
const mysql = require('mysql');
const cTable = require('console.table');

// mysql connection
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'employees',
    multipleStatements: true
});

// Intro screen
connection.connect((err) => {
    if (err) throw err;

    console.log(`\n==================================`)
    console.log(`\n   Welcome to Employee Tracker \n`);
    console.log(`==================================\n`)
    menu();
});

// Main menu
const menu = () => {
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "choice",
            choices: [
                "View All Employees", 
                "View All Employees By Deparment", 
                "View All Employees By Manager",
                "View All Roles",
                "View All Departments",
                "Add Employee",
                "Add Role",
                "Add Department",
                "Update Employee Role",
                "Update Employee Manager",
                "Delete Employee",
                "Delete Role",
                "Delete Department",
                "--Exit Application"
            ]
        }
    ]).then((x) => {
        switch (x.choice) {
            case "View All Employees":
                viewAllEmployees();
                break;
            case "View All Employees By Deparment":
                viewAllEmpDept();
                break;
            case "View All Employees By Manager":
                viewAllManager();
                break;
            case "View All Roles":
                viewAllRoles();
                break;
            case "View All Departments":
                viewAllDept();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Department":
                addDept();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Update Employee Manager":
                updateEmployeeManager();
                break;
            case "Delete Employee":
                delEmployee();
                break
            case "Delete Role":
                delRole();
                break
            case "Delete Department":
                delDept();
                break
            case "--Exit Application":
                exit();
                break
        }
    });
};

// Stops the application
const exit = () => {
    connection.end();
}

// Prints table of all employees sorted by ID; showing name, role, dept, salary, & manager
const viewAllEmployees = () => {
    connection.query("SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', role.title AS Title, department.name AS Department, role.salary AS Salary, CONCAT(manager.first_name, ' ', manager.last_name) AS Manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id", (err, res) => {
        if(err) return err;
        console.log("\n");
        console.table(res);
        console.log('--------------------------------------------------\n');
        menu();
    });
};

// Prints table of all employes sorted by department ID; showing dept, role, employee ID, & employee name
const viewAllEmpDept = () => {
    connection.query("SELECT department.id AS 'Dept ID', department.name AS Department, role.title AS Title, employee.id AS 'Employee ID', CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee' FROM employee LEFT JOIN role ON (role.id = employee.role_id) LEFT JOIN department ON (department.id = role.department_id) ORDER BY department.id", (err, res) => {
        if (err) throw err;
        console.log('\n');
        console.table(res);
        console.log('--------------------------------------------------\n');
        menu();
    });
};

// Prints table only showing employees with a manager; showing manager, dept, employee, & role
const viewAllManager = () => {
    connection.query("SELECT manager.id AS 'Manager ID', CONCAT(manager.first_name, ' ', manager.last_name) AS Manager, department.name AS Department, employee.id AS 'Employee ID', CONCAT(employee.first_name, ' ', employee.last_name) AS Employee, role.title AS Title FROM employee LEFT JOIN employee manager on manager.id = employee.manager_id INNER JOIN role ON (role.id = employee.role_id && employee.manager_id != 'NULL')INNER JOIN department ON (department.id = role.department_id) ORDER BY manager", (err, res) => {
        if (err) throw err;
        console.log('\n');
        console.table(res);
        console.log('--------------------------------------------------\n');
        menu();
    });
};

// Prints table showing all roles in the system; showing role, salary, & dept
const viewAllRoles = () => {
    connection.query('SELECT role.id, role.title AS "Role Title", role.salary AS Salary, department.name AS "Department Name" from role LEFT JOIN department ON (department.id = role.department_id)', (err, res) => {
        if (err) throw err;
        console.log('\n');
        console.table(res);
        console.log('--------------------------------------------------\n');
        menu();
    })
};

// Prints table showing all departments in the system
const viewAllDept = () => {
    connection.query('SELECT id, name AS "Department Name" FROM department ORDER BY id', (err, res) => {
        if (err) throw err;
        console.log('\n');
        console.table(res);
        console.log('--------------------------------------------------\n');
        menu();
    })
};

// Adds a new employee to the database, asks for name, role, & manager
const addEmployee = () => {
    connection.query('SELECT role.id, role.title FROM role ORDER BY role.id', async (err, res) => {
        if (err) throw err;
        const addName = await inquirer.prompt([
            {
                name: 'first',
                type: 'input',
                message: `What is the employee's first name?`
            },
            {
                name: 'last',
                type: 'input',
                message: `What is the employee's last name?`
            }
        ]);
        const { role } = await inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                choices: () => res.map(res => res.title),
                message: 'What is the employee role?: '
            }
        ]);

        // Loops through query result, links local variable roleId from queried role ID
        let roleId;
        for (const row of res) {
            if (row.title === role) {
                roleId = row.id;
                continue;
            };
        };

        connection.query('SELECT * FROM employee', async (err, res) => {
            if (err) throw err;
            
            // Array list of current employees
            let choices = res.map(res => `${res.first_name} ${res.last_name}`);
            // Adds 'none' option for if the new employee does not have a manager
            choices.push('-- none --');

            let { manager } = await inquirer.prompt([
                {
                    name: 'manager',
                    type: 'list',
                    choices: choices,
                    message: 'Choose the employee Manager: '
                }
            ]);

            // Loops through query result, links local variable managerId from queried manager ID
            let managerId;
            if (manager !== '-- none --') {
                for (const data of res) {
                    data.fullName = `${data.first_name} ${data.last_name}`;
                    if (data.fullName === manager) {
                        managerId = data.id;
                        continue;
                    }
                }
            };

            // Adds new employee information into table, manager ID set to null if there is no manager
            connection.query(
                'INSERT INTO employee SET ?',
                {
                    first_name: addName.first,
                    last_name: addName.last,
                    role_id: roleId,
                    manager_id: parseInt(managerId) || null
                },
                (err, res) => {
                    if (err) throw err;
                    console.log(`${"\n"}|| "${addName.first}'s" information has been added ||${"\n"}`);
                    menu();
                }
            );
        });
    });
};

// Adds a new role to the database, asks for name, salary, & department
const addRole = () => {
    connection.query('SELECT * FROM department', async (err, res) => {
        if (err) throw err;

        const roleInfo = await inquirer.prompt([
            {
                name: 'role',
                type: 'input',
                message: 'Enter role name:'
            },
            {
                name: 'salary',
                type: 'input',
                message: 'Enter salary:'
            }
        ]);
        
        inquirer.prompt([
            {
                name: 'dept',
                type: 'list',
                choices: () => res.map(res => `${res.name}`),
                message: 'Select the department for this role:'
            }
        ]).then((x) => {
            connection.query(`INSERT INTO role (title, salary, department_id) VALUES ("${roleInfo.role}", "${roleInfo.salary}", (SELECT id FROM department WHERE name = "${x.dept}"))`, (err, res) => {
                if (err) throw err;
                console.log(`${"\n"}|| The role "${roleInfo.role}" has been added ||${"\n"}`);
                menu();
            })
        });
    });

};

// Adds a new department to the database, asks for just the name
const addDept = () => {
    inquirer.prompt([
        {
            name: 'dept',
            type: 'input',
            message: 'Enter name of new department'
        }
    ]).then((x) => {
        connection.query(`INSERT INTO department (name) VALUES ("${x.dept}")`, (err, res) => {
            if (err) throw err;
            console.log(`${"\n"}|| "${x.dept}" department has been added ||${"\n"}`);
            menu();
        });
    });
};

// Changes the role of an employee
const updateEmployeeRole = () => {
    // Displays list of current employees and their roles
    connection.query(`SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS Employee, role.title AS Role FROM employee LEFT JOIN role ON (role.id = employee.role_id) ORDER BY role.id`, (err, res) => {
        if (err) throw err;
        console.table(res);
    
        connection.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM employee', (err, res) => {
            if (err) throw err;

            inquirer.prompt([
                {
                    name: 'name',
                    type: 'list',
                    message: 'Select employee to update',
                    choices: () => res.map(res => res.name)
                }
            ]).then((employee) => {
                // Selects all roles not including the employee's current role
                connection.query(`SELECT title FROM role WHERE (SELECT role_id FROM employee WHERE CONCAT(first_name, " ", last_name) = "${employee.name}") != id`, (err, res) => {
                    if (err) throw err;

                    inquirer.prompt([
                        {
                            name: 'role',
                            type: 'list',
                            message: `Select new role for ${employee.name}`,
                            choices: () => res.map(res => res.title)
                        }
                    ]).then((role) => {
                        // Assigns the new selected role for the employee
                        connection.query(`UPDATE employee SET role_id = (SELECT id FROM role WHERE title = "${role.role}") WHERE CONCAT(first_name, " ", last_name) = "${employee.name}"`, (err, res) => {
                        if (err) throw err;

                        console.log(`${"\n"}|| ${employee.name} has been moved to ${role.role} ||${"\n"}`);
                        menu();
                        });
                    });
                });
            });
        });
    });
};

// Assigns a new manager to an employee
const updateEmployeeManager = () => {
    // Initializing values for function
    var employeeID;
    var managerID;

    connection.query('SELECT CONCAT(first_name, " ", last_name) AS name FROM employee', (err, res) => {
        if (err) throw err;

        inquirer.prompt([
            {
                name: 'name',
                type: 'list',
                message: 'Select employee to update',
                choices: () => res.map(res => res.name)
            }
        ]).then((employee) => {
            // Shows list of employees not including the one previously selected
            connection.query(`SELECT CONCAT(first_name, " ", last_name) AS manager FROM employee WHERE (SELECT id FROM employee WHERE CONCAT(first_name, " ", last_name) = "${employee.name}") != employee.id;`, (err, res) => {
                if (err) throw err;

                inquirer.prompt([
                    {
                        name: 'name',
                        type: 'list',
                        message: `Select new manager for ${employee.name}`,
                        choices: () => res.map(res => res.manager)
                    }
                ]).then((manager) => {
                    // Grabs ID for both the selected employee and manager and assigns them to variables
                    connection.query(`SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) = '${employee.name}'; SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) = '${manager.name}'`, (err, res) => {
                        if (err) throw err;

                        employeeID = JSON.parse(JSON.stringify(res))[0][0].id;
                        managerID = JSON.parse(JSON.stringify(res))[1][0].id;

                        // Assigns the manager's ID into the employee's manager_id
                        connection.query(`UPDATE employee SET manager_id = '${managerID}' WHERE id = '${employeeID}'`, (err, res) => {
                            if (err) throw err;
        
                            console.log(`${"\n"}|| ${manager.name} has been assigned to ${employee.name} ||${"\n"}`);
                            menu();
                        });
                    });
                });
            });
        });
    });
};

// Selects an employee to delete from the database
const delEmployee = () => {
    // Prints table of all employees and their info for reference 
    connection.query("SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS Employee, role.title AS Title, department.name AS Department, role.salary AS Salary, CONCAT(manager.first_name, ' ', manager.last_name) AS Manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id", (err, res) => {
        if (err) throw err;

        console.log("\n");
        console.table(res);

        inquirer.prompt([
            {
                name: 'employee',
                type: 'list',
                message: 'Select employee to delete',
                choices: () => res.map(res => `${res.id} ${res['Employee']}`)
            }
        ]).then((x) => {
            connection.query(`DELETE FROM employee WHERE CONCAT(id, ' ', first_name, ' ', last_name) = "${x.employee}"`, (err, res) => {
                if (err) throw err;
                console.log(`${"\n"}|| Employee #${x.employee} has been removed ||${"\n"}`);
                menu();
            })
        })
    });
};

// Selects a role to delete from the database
const delRole = () => {
    connection.query('SELECT * FROM role', (err, res) => {
        if (err) throw err;

        inquirer.prompt([
            {
                name: 'role',
                type: 'list',
                message: 'Select role to delete',
                choices: () => res.map(res => res.title)
            }
        ]).then((x) => {
            connection.query(`DELETE FROM role WHERE title = "${x.role}"`, (err, res) => {
                if (err) throw err;
                console.log(`${"\n"}|| ${x.role} has been removed ||${"\n"}`);
                menu();
            })
        })
    });
};

// Selects a department to delete from the database
const delDept = () => {
    connection.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;

        inquirer.prompt([
            {
                name: 'dept',
                type: 'list',
                message: 'Select department to delete',
                choices: () => res.map(res => res.name)
            }
        ]).then((x) => {
            connection.query(`DELETE FROM department WHERE name = "${x.dept}"`, (err, res) => {
                if (err) throw err;
                console.log(`${"\n"}|| ${x.dept} has been removed ||${"\n"}`);
                menu();
            })
        })
    });
};