const express = require('express');
const donationsRouter = express.Router();
const donationsDbOperations = require('../cruds/donations');

// Create a new donation
donationsRouter.post('/', async (req, res) => {
    console.log('Received request to create a new donation');
    try { 
        const { 
            first_name, surname, phone, email, 
            amount, currency, payment_method, 
            payment_reference, donation_purpose,
            terms_accepted, status, created_at
        } = req.body;

        const results = await donationsDbOperations.postDonation(
            first_name, surname, phone || null, email || null,
            amount, currency || 'USD', payment_method,
            payment_reference, donation_purpose || null,
            terms_accepted, status || 'Pending', created_at || new Date().toISOString()
        );
        
        res.json(results);
    } catch (e) {
        console.error('Error creating donation:', e);
        res.status(500).json({ 
            error: 'Failed to create donation',
            details: e.message 
        });
    }
});

module.exports = donationsRouter;