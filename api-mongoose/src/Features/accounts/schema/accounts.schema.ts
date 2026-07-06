const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const AccountsSchema = new Schema({
    data: { type: String, required: false },
    status: {
        type: String,
        enum : ['ACTIVE','DEACTIVE'],
        default: 'ACTIVE',
    },
},  {timestamps: true})

const Accounts = mongoose.model('Accounts', AccountsSchema);

export default Accounts

       