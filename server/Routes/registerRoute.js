const router = require('express').Router();
const { registerUser } = require('../Controllers/register');

router.post('/', registerUser);

module.exports = router;