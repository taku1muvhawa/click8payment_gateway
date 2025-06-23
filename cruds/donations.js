require('dotenv').config();
const pool = require('./poolfile');

let donationsObj = {};

donationsObj.postDonation = (
    first_name, surname, phone, email, 
    amount, currency, payment_method, 
    payment_reference, donation_purpose,
    terms_accepted, status, created_at
) => {
    return new Promise((resolve, reject) => {
        // Convert boolean to MySQL compatible 1/0
        const termsAcceptedValue = terms_accepted ? 1 : 0;

        pool.query(
            `INSERT INTO donations
                (first_name, surname, phone, email, 
                 amount, currency, payment_method, 
                 payment_reference, donation_purpose,
                 terms_accepted, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, surname, phone, email,
                amount, currency, payment_method,
                payment_reference, donation_purpose,
                termsAcceptedValue, status, created_at
            ],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                return resolve({ 
                    status: '200', 
                    message: 'Donation record added successfully',
                    id: result.insertId,
                    payment_reference: payment_reference
                });
            }
        );
    });
};

module.exports = donationsObj;