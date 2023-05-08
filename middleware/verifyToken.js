const jwt = require('jsonwebtoken');
const config = require('../config/private');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/')
  }

  try {
    const decodedToken = jwt.verify(token, config.privateKey);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.redirect('/')
  }
};

module.exports = {
  verifyToken
};
