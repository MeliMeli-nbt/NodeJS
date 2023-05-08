var express = require('express');
var router = express.Router();
var dbConnect = require('../config/connect');
var { verifyToken } = require('../middleware/verifyToken');
const { render } = require('../app');
const jwt = require('jsonwebtoken');
const config = require('../config/private');
const bcrypt = require('bcrypt');

router.get('/', function(req, res) {
  res.clearCookie('token');
  res.render('login');
});

router.post('/', function(req, res, next) {
  const { username, password } = req.body;
  const query = 'SELECT * FROM NodeJS_CRUD.accounts WHERE username = ?';
  const values = [username];
  dbConnect.query(query, values, function(error, results) {
    if (error) {
      return next(error);
    }
    if (results.length === 0) {
      return res.redirect('/login');
    } else {
      bcrypt.compare(password, results[0].password, function(error, result) {
        if (error) {
          return next(error);
        }
        if (!result) {
          return res.redirect('/login');
        } else {
          const payload = {
            username,
            account_id: results[0].account_id,
            role: results[0].role
          };
          const token = jwt.sign(payload, config.privateKey, { expiresIn: config.expiresIn });
          res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
          return res.redirect('/home');
        }
      });
    }
  });
});


// GET home page
router.get('/home', verifyToken, function(req, res) {
  const user = req.user;
  if (user.role === 'admin'){
    dbConnect.query("SELECT * FROM NodeJS_CRUD.employees;", function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { message: 'An error occurred while fetching data.' });
      }
      return res.render('home', { data: data });
    });
  }
  else if (user.role === 'user'){
    dbConnect.query("SELECT * FROM NodeJS_CRUD.employees WHERE account_id = ?;", [user.account_id], function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { message: 'An error occurred while fetching data.' });
      }
      return res.render('home', { data: data });
    });
  }
});

router.get('/check', verifyToken, function(req, res){
  const user = req.user;
  return res.status(200).json({ user });
})

router.get('/addAccount', verifyToken, function(req, res){
  const user = req.user;
  const query = 'SELECT * FROM NodeJS_CRUD.accounts;'
  if (user.role === 'admin'){
    dbConnect.query(query, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { message: 'An error occurred while fetching data.' });
      }
      return res.render('addAccount', { data: data });
    });
  }
});

router.post('/addAccount', function(req, res){
  const { username, password, email } = req.body;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash){
      dbConnect.query(`INSERT INTO NodeJS_CRUD.accounts (username, password, email) VALUES('${username}','${hash}','${email}')`, function(err){
        if(err) throw err;
        res.cookie('username', username, { httpOnly: true, secure: true, sameSite: 'strict' });
        return res.redirect('/add');
      });
    });
  });
});

// ADD new employee
router.get('/add', function(req, res) {
  const query = 'SELECT account_id FROM NodeJS_CRUD.accounts WHERE username = ?';
  const username = req.cookies.username;
  const values = [username];
  dbConnect.query(query, values, function(err, data) {
    if (err) {
      // handle query error
      console.error(err);
      res.status(500).send('Database error');
      return;
    }
    if (!data || !data.length || !data[0].account_id) {
      // handle missing account_id
      console.error('Missing account_id');
      res.status(400).send('User not found');
      return;
    }
    res.clearCookie('username');
    res.cookie('id', data[0].account_id, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.render('add', { data: data });
  });
});

router.post('/add', function(req, res) {
  const id = req.cookies.id;
  dbConnect.query(`INSERT INTO NodeJS_CRUD.employees (name, age, gender, address, email, phone, account_id) VALUES('${req.body.nameInput}','${req.body.ageInput}','${req.body.genderInput}','${req.body.addressInput}','${req.body.emailInput}','${req.body.phoneInput}','${id}')`, function(err){
    if(err) throw err;
    res.clearCookie('id');
    res.redirect('/home')
  })
});

// DELETE employee
router.get('/delete/:employee_id', function(req, res) {
  dbConnect.query(`DELETE FROM NodeJS_CRUD.employees WHERE employee_id = ${req.params.employee_id};`, function(err) {
    if(err) throw err;
    res.redirect("/home");
  })
});

// EDIT employee
router.get('/edit/:employee_id', function(req, res) {
  var data = dbConnect.query(`SELECT * FROM NodeJS_CRUD.employees WHERE employee_id=${req.params.employee_id};`, function(err, result){
    if(err) throw err;
    data = {
      employee_id: result[0].employee_id,
      name: result[0].name,
      age: result[0].age,
      gender: result[0].gender,
      address: result[0].address,
      email: result[0].email,
      phone: result[0].phone,
      account_id: result[0].account_id
    }
    res.render('edit', { data });
  });
});

router.post('/edit/:employee_id', function(req, res) {
  dbConnect.query(`UPDATE NodeJS_CRUD.employees SET name = '${req.body.nameInput}', email = '${req.body.ageInput}', gender = '${req.body.genderInput}', address = '${req.body.addressInput}',email = '${req.body.emailInput}',phone = '${req.body.phoneInput}',account_id = '${req.body.account_idInput}' WHERE employee_id=${req.params.employee_id};`, function(err){
    if(err) throw err;
    res.redirect('/home');
  })
});

router.get('/deleteAccount/:account_id', function(req, res) {
  dbConnect.query(`
    DELETE FROM NodeJS_CRUD.employees 
    WHERE account_id = ${req.params.account_id};
    `, function(err) {
    if(err) throw err;
    dbConnect.query(`
      DELETE FROM NodeJS_CRUD.accounts WHERE account_id = ${req.params.account_id};
      `, function(err) {
      if(err) throw err;
      res.redirect("/addAccount");
    })
  })
});




router.get('/logout', function(req, res) {
  res.clearCookie('token');
  res.redirect('/');
});
module.exports = router;
