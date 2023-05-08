var mysql = require('mysql2');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'batuan2002',
  database: 'NodeJS_CRUD'
});
conn.connect();
module.exports = conn;
