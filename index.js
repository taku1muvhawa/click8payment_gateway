const express = require('express');
require('dotenv').config();
const cors = require('cors');
const https = require('https');
const pool = require('./cruds/poolapi');

// Peses pay
const { Pesepay } = require('pesepay');

//Payment Gateway

const resultUrl = 'https://clickeightlegalaid.tankak.tech/'; // Update with your result URL
const returnUrl = 'https://clickeightlegalaid.tankak.tech/'; // Update with your return URL
const pesepayInstance = new Pesepay("96aa2f37-063a-4b4f-ae30-c6332e985db8", "f3e0d62f7b6640f5b3fef5e8d545278e");

// Auth
const authenticateToken = require('./utilities/authenticateToken');

const multer = require('multer');
const axios = require('axios');

const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

const path = require('path');
const fs = require('fs');

// Route path
const subscriptionsRouter = require('./routes/subscriptions');
const donationsRouter = require('./routes/donations');

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

//App Route Usage
app.use('/subscriptions', subscriptionsRouter);
app.use('/donations', donationsRouter);

function generatePaymentReference() {
  return 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Payment initiation endpoint
app.get('/initiate-payment', async (req, res) => {
  try {
    const axios = require('axios');

    // Validate required fields
    const requiredFields = ['title', 'firstName', 'surname', 'gender', 'dob', 'idNumber',
      'physicalAddress', 'maritalStatus', 'phone'];
    const missingFields = requiredFields.filter(field => !req.query[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Prepare subscription data with proper null handling
    const subscriptionData = {
      title: req.query.title,
      first_name: req.query.firstName, // Map from frontend field name
      surname: req.query.surname,
      gender: req.query.gender,
      dob: req.query.dob,
      id_number: req.query.idNumber,
      physical_address: req.query.physicalAddress,
      marital_status: req.query.maritalStatus,
      telephone: req.query.telephone || null,
      phone: req.query.phone,
      email: req.query.email || null,
      employer_name: req.query.employerName || null,
      ec_number: req.query.ecNumber || null,
      occupation: req.query.occupation || null,
      employer_address: req.query.employerAddress || null,
      employer_email: req.query.employerEmail || null,
      next_of_kin_name: req.query.nextOfKinName || null,
      next_of_kin_dob: req.query.nextOfKinDob || null,
      next_of_kin_id: req.query.nextOfKinId || null,
      next_of_kin_relationship: req.query.nextOfKinRelationship || null,
      next_of_kin_address: req.query.nextOfKinAddress || null,
      next_of_kin_phone: req.query.nextOfKinPhone || null,
      dependents: req.query.dependents ? JSON.parse(req.query.dependents) : [],
      pending_cases: req.query.pendingCases === '1',
      pending_cases_details: req.query.pendingCasesDetails || null,
      plan_type: req.query.planType || null,
      payment_frequency: req.query.paymentFrequency || null,
      payment_method: req.query.paymentMethod || null,
      amount_paid: req.query.amountPaid || null,
      payment_reference: req.query.paymentReference || generatePaymentReference(),
      terms_accepted: req.query.termsAccepted === 'true',
      status: 'Pending',
      created_at: new Date().toISOString()
    };


    const currencyCode = 'USD'; // Update with the actual currency code
    const paymentReason = 'Click Eight Membership Subscription'; // Update with the actual payment reason

    const transaction = pesepayInstance.createTransaction(subscriptionData.amount_paid, currencyCode, paymentReason);

    pesepayInstance.resultUrl = resultUrl;
    pesepayInstance.returnUrl = returnUrl;

    pesepayInstance.initiateTransaction(transaction).then(response => {
      console.log(response);
      if (response.success) {
        const redirectUrl = response.redirectUrl;
        const referenceNumber = response.referenceNumber;
        const pollUrl = response.pollUrl;

        // Check payment status
        pesepayInstance.pollTransaction(pollUrl).then(response => {
          if (response.success) {
            if (response.paid) {
              console.log('Payment was successful');
            } else {
              console.log('Payment is pending');

              let loops = 0;
              let paymentProcessed = false; // Flag to prevent double posting
              const intervalId = setInterval(() => {
                pesepayInstance.checkPayment(referenceNumber).then(response => {
                  if (response.success) {
                    if (response.paid && !paymentProcessed) {
                      console.log('Payment was successful');

                      const axios = require('axios');                      

                      // Post request
                      axios.post(`${pool}/subscriptions/`, subscriptionData)
                        .then(response => {
                          console.log('Response Data:', response.data);
                        })
                        .catch(error => {
                          console.error('Error:', error);
                        });

                      paymentProcessed = true; // Set the flag to true to prevent further posting
                      clearInterval(intervalId);
                    }
                  } else {
                    console.error(`Error: ${response.message}`);
                  }
                }).catch(error => {
                  console.error(error);
                });
                loops++;
                if (loops >= 50) { // Stop after 50 checks (5 minutes)
                  clearInterval(intervalId);
                }
              }, 5000); // Check every 5 seconds
            }
          } else {
            console.error(`Error: ${response.message}`);
          }
        }).catch(error => {
          console.error(error);
        });

        res.redirect(redirectUrl);
      } else {
        console.error(`Error: ${response.message}`);
        res.status(500).send({ error: 'Failed to initiate payment' });
      }
    }).catch(error => {
      console.error(error);
      res.status(500).send({ error: 'Failed to initiate payment' });
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

// Add donation initiation endpoint
app.get('/initiate-donation', async (req, res) => {
  try {
    const axios = require('axios');

    // Prepare donation data
    const donationData = {
      first_name: req.query.first_name,
      surname: req.query.surname,
      phone: req.query.phone || null,
      email: req.query.email || null,
      amount: req.query.amount,
      currency: 'USD',
      payment_method: req.query.payment_method,
      payment_reference: req.query.payment_reference || generatePaymentReference(),
      donation_purpose: req.query.donation_purpose || null,
      terms_accepted: req.query.terms_accepted === 'true',
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    // Process payment with Pesepay
    const currencyCode = 'USD';
    const paymentReason = 'Global Association for Equalisation and Development Donation'; // Update with the actual payment reason
    // const paymentReason = donationData.donation_purpose 
    //   ? `GAED Donation - ${donationData.donation_purpose}`
    //   : 'GAED General Donation';

    const transaction = pesepayInstance.createTransaction(
      donationData.amount, 
      currencyCode, 
      paymentReason
    );

    pesepayInstance.resultUrl = "https://surgiveglobal.tankak.tech/";
    pesepayInstance.returnUrl = "https://surgiveglobal.tankak.tech/";

    pesepayInstance.initiateTransaction(transaction).then(response => {
      if (response.success) {
        const redirectUrl = response.redirectUrl;
        const referenceNumber = response.referenceNumber;
        const pollUrl = response.pollUrl;

        // Check payment status
        pesepayInstance.pollTransaction(pollUrl).then(response => {
          if (response.success) {
            if (response.paid) {
              console.log('Payment was successful');
              donationData.status = 'Completed';
              
              // Record donation in database
              axios.post(`${pool}/donations/`, donationData)
                .then(response => {
                  console.log('Donation recorded:', response.data);
                })
                .catch(error => {
                  console.error('Error recording donation:', error);
                });
            } else {
              console.log('Payment is pending');

              let loops = 0;
              let paymentProcessed = false;
              const intervalId = setInterval(() => {
                pesepayInstance.checkPayment(referenceNumber).then(response => {
                  if (response.success && response.paid && !paymentProcessed) {
                    console.log('Payment was successful');
                    donationData.status = 'Completed';
                    
                    axios.post(`${pool}/donations/`, donationData)
                      .then(response => {
                        console.log('Donation recorded:', response.data);
                      })
                      .catch(error => {
                        console.error('Error recording donation:', error);
                      });

                    paymentProcessed = true;
                    clearInterval(intervalId);
                  }
                }).catch(error => {
                  console.error(error);
                });
                
                loops++;
                if (loops >= 50) {
                  clearInterval(intervalId);
                }
              }, 5000);
            }
          } else {
            console.error(`Error: ${response.message}`);
          }
        }).catch(error => {
          console.error(error);
        });

        res.redirect(redirectUrl);
      } else {
        console.error(`Error: ${response.message}`);
        res.status(500).send({ error: 'Failed to initiate donation' });
      }
    }).catch(error => {
      console.error(error);
      res.status(500).send({ error: 'Failed to initiate donation' });
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});


// Load SSL certificates
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/srv702611.hstgr.cloud/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/srv702611.hstgr.cloud/fullchain.pem')
};

// Create HTTPS server
const PORT = process.env.APPPORT || '3021';
https.createServer(options, app).listen(PORT, () => {
  console.log(`App is listening on https://srv702611.hstgr.cloud:${PORT}`);
});


// app.listen(process.env.APPPORT || '3021', () => {
//   console.log('app is listening to port: ' + process.env.APPPORT);
// });