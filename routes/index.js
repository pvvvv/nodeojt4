var express = require('express');
var router = express.Router();
var scheduleController = require('../routes/schedule-controller');

router.post('/insert', scheduleController.insertSchedule);

module.exports = router;
