const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/initiate', paymentController.initiatePayment);
router.post('/callback', paymentController.paymentCallback);
router.post('/confirm-cash', paymentController.confirmCashReceipt);

module.exports = router;
