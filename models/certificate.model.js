// models/certificate.model.js
const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  learningId: {
    type: String,
    required: true,
    unique: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
