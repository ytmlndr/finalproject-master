var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var patientSchema = new Schema({
    user_id: {type: Number, required: true, unique: true},
    phone_number: {type: String},
    address: {
        city: {type: String},
        street: {type: String},
        zip_code: {type: Number}
    },
    email: {type: String},
    minutes_to_be_notify_before: {type: Number},
    token_id: {type: String}
});

module.exports = mongoose.model('patient', patientSchema);
