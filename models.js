const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: '/tmp/database.db'
});
sequelize
    .authenticate()
    .then(()=> {
        console.log("Connected to local DB")
    });

module.exports = sequelize.define('attendee', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    address: {
        type: Sequelize.STRING,
        key: true
    },
    returnAddress: {
        type: Sequelize.STRING,
    },
    privateKey: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    sentEmail: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    checkedIn: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

