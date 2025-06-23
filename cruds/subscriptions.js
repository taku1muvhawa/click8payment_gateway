require('dotenv').config();
const pool = require('./poolfile');

let subscriptionsObj = {};

subscriptionsObj.postSubscription = (
    title, first_name, surname, gender, dob, id_number, physical_address, marital_status, 
    telephone, phone, email, employer_name, ec_number, occupation, employer_address, 
    employer_email, next_of_kin_name, next_of_kin_dob, next_of_kin_id, next_of_kin_relationship, 
    next_of_kin_address, next_of_kin_phone, dependents, pending_cases, pending_cases_details, 
    plan_type, payment_frequency, payment_method, amount_paid, payment_reference, 
    terms_accepted, status, created_at
) => {
    return new Promise((resolve, reject) => {
        // Convert boolean values to MySQL compatible 1/0
        const pendingCasesValue = pending_cases ? 1 : 0;
        const termsAcceptedValue = terms_accepted ? 1 : 0;

        pool.query(
            `INSERT INTO membership_applications
                (title, first_name, surname, gender, dob, id_number, physical_address, marital_status, 
                 telephone, phone, email, employer_name, ec_number, occupation, employer_address, 
                 employer_email, next_of_kin_name, next_of_kin_dob, next_of_kin_id, next_of_kin_relationship, 
                 next_of_kin_address, next_of_kin_phone, dependents, pending_cases, pending_cases_details, 
                 plan_type, payment_frequency, payment_method, amount_paid, payment_reference, 
                 terms_accepted, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title, first_name, surname, gender, dob, id_number, physical_address, marital_status,
                telephone, phone, email, employer_name, ec_number, occupation, employer_address,
                employer_email, next_of_kin_name, next_of_kin_dob, next_of_kin_id, next_of_kin_relationship,
                next_of_kin_address, next_of_kin_phone, dependents, pendingCasesValue, pending_cases_details,
                plan_type, payment_frequency, payment_method, amount_paid, payment_reference,
                termsAcceptedValue, status, created_at
            ],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                return resolve({ 
                    status: '200', 
                    message: 'Subscription record added successfully',
                    id: result.insertId 
                });
            }
        );
    });
};

module.exports = subscriptionsObj;
