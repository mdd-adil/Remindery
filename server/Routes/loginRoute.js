const router = require('express').Router();
const loginUser = require('../Controllers/login');

router.post('/', loginUser);

module.exports = router;