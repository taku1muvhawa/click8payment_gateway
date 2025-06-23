const express = require('express');
const subscriptionsRouter = express.Router();
const subscriptionsDbOperations = require('../cruds/subscriptions');
const authenticateToken = require('../utilities/authenticateToken');


// Create a new subscription
subscriptionsRouter.post('/', async (req, res) => {
    console.log('Received request to create a new subscription');
    try { 
        const { 
            title, first_name, surname, gender, dob, id_number, physical_address, marital_status,
            telephone, phone, email, employer_name, ec_number, occupation, employer_address,
            employer_email, next_of_kin_name, next_of_kin_dob, next_of_kin_id, next_of_kin_relationship,
            next_of_kin_address, next_of_kin_phone, dependents, pending_cases, pending_cases_details,
            plan_type, payment_frequency, payment_method, amount_paid, payment_reference,
            terms_accepted, status, created_at 
        } = req.body;

        // Convert dependents array to JSON string if it exists
        const dependentsJson = dependents ? JSON.stringify(dependents) : null;
        
        const results = await subscriptionsDbOperations.postSubscription(
            title, first_name, surname, gender, dob, id_number, physical_address, marital_status,
            telephone || null, phone, email || null, employer_name || null, ec_number || null, 
            occupation || null, employer_address || null, employer_email || null,
            next_of_kin_name || null, next_of_kin_dob || null, next_of_kin_id || null, 
            next_of_kin_relationship || null, next_of_kin_address || null, next_of_kin_phone || null,
            dependentsJson, pending_cases, pending_cases_details || null,
            plan_type || null, payment_frequency || null, payment_method || null, 
            amount_paid || null, payment_reference || null,
            terms_accepted, status || 'Pending', created_at || new Date().toISOString()
        );
        
        res.json(results);
    } catch (e) {
        console.error('Error creating subscription:', e);
        res.status(500).json({ 
            error: 'Failed to create subscription',
            details: e.message 
        });
    }
});

module.exports = subscriptionsRouter;
