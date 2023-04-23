const mongoose = require("mongoose")

const UserDetailsSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: {type:String, unique:true},
    password: String,
    userType: String,
},
// {
//     collation: "UserInfo",
// }
{ collation: { locale: 'en_US', strength: 1 } }
);

mongoose.model("UserInfo",UserDetailsSchema);
