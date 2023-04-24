const express = require('express');
const app = express();
const mongoose=require("mongoose");

app.use(express.json());
const BASE_URL = process.env.BASE_URL;
const path = require('path')
app.use('/static', express.static(path.join(__dirname, 'public')))
const cors = require("cors");
app.use(cors());
const bcrypt=require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: false}));
const serveStatic = require('serve-static');
const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const { subtle } = require('crypto');
require('dotenv').config();
const JWT_SECRET = "haihdbuh487267348778734@#3489?fh92u348209382398094804urfhjs-3][hvuf";


const uri = process.env.DATABASE;
 mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));



require("./userDetails");

const User=mongoose.model("UserInfo");

app.post("/register",async(req,res)=>{
  const {fname, lname, email, password, userType} = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
      const oldUser = await User.findOne({ email });
  
      if (oldUser) {
        return res.json({ error: "User Exists" });
      }
      
      await User.create({
        fname,
        lname,
        email,
        password: encryptedPassword,
        userType,
      });
      res.send({ status: "ok" });
    } catch (error) {
      console.log(error);
      res.send({ status: "error" });
    }
});
app.get("/register", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.post("/login-user", async (req,res)=>{
  const {email, password} = req.body;
  const user = await User.findOne({email});
  if (!user) {
    return res.json({ error: "User Not Found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({email: user.email}, JWT_SECRET, {
      expiresIn: 10,
    });

    if(res.status(201)){
      return res.json({status:"ok", data: token});
    }
    else{
      return res.json({error:"error"});
    }
  }
  res.json({status:"error", error:"Invalid Password"});
})

app.post("/userData", async(req,res)=>{
  const {token} = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res)=>{
      if (err) {
        return "token expired";
      }
      return res;
    });
    console.log(user);
    if(user == "token expired"){
      return res.send({status: "ok", data: "token expired"});
    }
    const useremail = user.email;
    User.findOne({email: useremail}).then((data)=>{
      res.send({status:"ok", data: data});
    })
    .catch((error)=>{
      res.send({status:"error", data: error});
    });
  } catch (error) {
    
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
   
    const link = `http://localhost:5000/${oldUser._id}/${token}`;
    
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'akashmandal6297@gmail.com',
        pass: 'bwmhovtgqzzydgul'
      }
    });
    
    var mailOptions = {
      from: 'youremail@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: link
      
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) { }
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await User.find({});
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


