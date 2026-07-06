const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const userSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true},
    password: { type: String, required: false },
    firstname: {type: String, default: null},
    lastname: {type: String, default: null},
    image: {type: String, default: null},
    otp: { type: String, required: true },
    status: {
        type: String,
        enum : ['ACTIVE','DEACTIVE'],
        default: 'ACTIVE',
    },
    plan: {
        type: String,
        enum: ['FREE', 'PRO'],
        default: 'FREE',
    },
    stripeCustomerId: { type: String, default: null },
    resetPasswordToken: { type: String, default: null, index: true, sparse: true },
    resetPasswordExpires: { type: Date, default: null },
},  {timestamps: true})

const User = mongoose.model('User', userSchema);

export default User