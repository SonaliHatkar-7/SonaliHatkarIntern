const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
var XLSX = require('xlsx');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require('multer');
var nodemailer = require('nodemailer');
const studData = require('./Schema2');
const moment = require('moment');
const winston = require('winston')
const { DatabaseError } = require('sequelize');

const app = express();
app.use(express.json());
app.use(cors());

secretKey = 'abcde123456fghij4567r7fhjzcnzvnvxn'

// mongoose.connect('mongodb://localhost:27017/Classrooms');
// mongoose.connect('mongodb://localhost:27017/task21')
//     .then(() => console.log('Connected to MongoDB'))
//     .catch(error => console.error('MongoDB connection error:', error));

// const connectDb = async () => {
//     try {
//         await mongoose.connect(dbConfig.url, dbConfigOptions)

//         console.info(`Connected to database on Worker process: ${process.pid}`)
//     } catch (error) {
//         console.error(`Connection error: ${error.stack} on Worker process: ${process.pid}`)
//         process.exit(1)
//     }
// }

getConnection = async () => {
    try {
        await mongoose.connect(
            'mongodb://localhost:27017/task21'
            // ,
            // { useCreateIndex: true, useNewUrlParser: true }
        );
        console.log('Connection to DB Successful');
    } catch (err) {
        console.log('Connection to DB Failed');
    }
};
getConnection();


// var now = new Date(); 
// console.log(now);

// now.setDate(now.getDate() + 1);

// var formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
// console.log(formattedDate);

// var dateObject = new Date(formattedDate);
// console.log(dateObject);

// var now = new Date();
// console.log(now);
// now.setDate(now.getDate() + 1);
// var formattedDate = now.toLocaleString('en-US', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: true
// });
// console.log(formattedDate);
// var dateObject = new Date(formattedDate);
// console.log(dateObject);

app.post('/insertone', async (req, res) => {
    console.log('Triggered');
    const data1 = new studData(req.body);
    let result = await data1.save();
    console.log(result);
    res.send(result);
});

app.post('/delete', async (req, res) => {
    console.log('Triggered');
    studModel.destroy();
})

const upload = multer({ dest: 'Mongo/uploaded/' });

app.post('/upload', upload.single('newSheet'), async function (req, res) {
    var workbook = XLSX.readFile(req.file.path);

    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    console.log(xlData);

    // for(i=0; i<xlData.length; i++){
    //     if(i===Password){
    //         bcrypt.hash(Password, 10)
    //         .then(hash => {
    //             const insert1 = data.bulkCreate(xlData)        
    //         }).catch(err => console.log(err.message))
    //     }
    // }

    for (let i = 0; i < xlData.length; i++) {
        const encryptPass = await bcrypt.hash(xlData[i].Password, 10);
        xlData[i].Password = encryptPass;
    }

    const insert1 = await studData.insertMany(xlData)
    // console.log(insert1)
    // res.json(xlData);
    res.json("Received successfully")
});

//for login
app.post('/login', async (req, res) => {
    try {
        console.log("login triggered")
        const record = req.body;
        // const { Email, Password } = req.body; 
        const user = await studData.findOne({ Email: record.Email });
        console.log(user)
        if (!user) {
            return res.json({ message: "User does not exist" });
        }
        bcrypt.compare(record.Password, user.Password, async (err, result) => {
            if (err) {
                return res.json({ error: 'Server Error' });
            }
            if (result) {
                const token = jwt.sign({ Email: user.Email, Role: user.Role }, secretKey, { expiresIn: "2d" });
                await studData.updateOne({ Email: record.Email }, { "$set": { lastLogin: new Date() } })
                res.json({
                    message: "successfully log in",
                    token,
                    user: {
                        Roll_No: user.Roll_No,
                        First_Name: user.First_Name,
                        Middle_Name: user.Middle_Name,
                        Last_Name: user.Last_Name,
                        Date_of_Birth: user.Date_of_Birth,
                        Gender: user.Gender,
                        Address: user.Address,
                        Contact_No: user.Contact_No,
                        Email: user.Email,
                        Role: user.Role
                    }
                });
            } else {
                res.json({ message: "Invalid password" });
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.json({ error: 'login failed' });
    }
});

app.put('/update', async (req, res) => {
    console.log("triggered")
    try {
        console.log(req.body)
        const newPasswordHash = await bcrypt.hash(req.body.Password, 10);
        console.log(newPasswordHash)
        await studData.updateOne(
            {
                Email: req.body.Email
            },
            {
                Password: newPasswordHash,
                confirmPassword: newPasswordHash
            }
        );
        res.json({
            message: "Password updated."
        })
    } catch (error) {
        console.error(error);
        res.json({
            message: "Failed to update password."
        })
    }
})

app.post("/sendmail", async (req, res) => {

    console.log("triggered")
    let reqmail = req.body;
    console.log(req.body);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "hatkar01sonali@gmail.com",
            pass: "iofs bmuf fimn ubjb"
            // user : process.env.USER,
            // pass : process.env.PASS
        }
    });

    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.gmail.com',
    //     port: 3000,
    //     secure: true, // use SSL
    //     auth: {
    //         user: "i.sonalihatkar@hostedminds.com",
    //         pass: "Sonali@123"
    //     }
    // });
    let otp1 = Math.floor(Math.random() * 100000);
    const mailOptions = {
        from: 'hatkar01sonali@gmail.com',
        to: `${reqmail.Email}`,
        subject: 'Email sending for reset password',
        text: `OTP for reset Email: ${otp1}`,

    };
    var now = moment().format(`${'DD/MM/YYYY'} ${'h:mm:ss a'}`);
    // now.add(3,'minutes')
    // var current = now.format(`${'DD/MM/YYYY'} ${'h:mm:ss a'}`);
    console.log(now)
    var dateObject = moment(now, 'DD/MM/YYYY h:mm:ss a').toDate();

    await studData.updateOne({ Email: req.body.Email }, { "$set": { otp: otp1, otptimeout: dateObject } })

    // studData.updateOne(
    //     {
    //         Email: req.body.Email 
    //     },
    //     {'$set':
    //       { otp: otp1}
    //     })
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
            res.status(500).send('Error sending email');
        } else {
            console.log('Email sent: ' + info.response);
            res.send('Email sent successfully');
        }
    });
});

// app.post('/verifyotp', async (req, res) => {
//     console.log("triggered")
//     try {
//         const salt = 10;

//         var newdata = req.body;
//         console.log(newdata);
//         // let user = await data.findOne({ where: { Email: newdata.Email } });
//         // if (!user) {
//         //     console.log("User not found");
//         //     return res.json({ message: "User not found" });
//         // }
//         // if (newdata.otp !== data.otp) {
//         //     console.log("Incorrect OTP");
//         //     return res.json({ message: "Incorrect OTP" });
//         // }
//         // else{
//         const newPasswordHash = await bcrypt.hash(req.body.newPassword, salt);
//         console.log(newPasswordHash)
//         await studData.updateOne(
//             {
//                 otp: newdata.otp
//                 // confirmPassword: newPasswordHash
//             },
//             {
//                 Password: newPasswordHash,
//                 confirmPassword: newPasswordHash
//             }
//         );
//         console.log("Password updated.");
//         res.json({ message: "Password updated." });
//     }

//     catch (error) {
//         console.error(error);
//         res.json({ message: "Failed to update password." });
//     }
// });

app.post('/verifyotp', async (req, res) => {
    console.log("Triggered");
    try {
        const salt = 10;
        const newdata = req.body;
        console.log(newdata);

        const currentTime = moment()/*.format(`${'DD/MM/YYYY'} ${'h:mm:ss a'}`);*/
        console.log(currentTime)
        const user = await studData.findOne({ otp: newdata.otp });
        if (!user) {
            console.log("User not found or OTP expired");
            return res.json({ message: "User not found or OTP expired" });
        }
        const otptimeout = moment(user.otptimeout);
        const diffMinutes = currentTime.diff(otptimeout, 'minutes');
        if (diffMinutes > 1) {
            console.log("OTP expired");
            return res.json({ message: "OTP expired" });
        }

        const newPasswordHash = await bcrypt.hash(req.body.newPassword, salt);
        console.log(newPasswordHash);

        await studData.updateOne(
            { otp: newdata.otp },
            { Password: newPasswordHash, confirmPassword: newPasswordHash }
        );

        console.log("Password updated.");
        res.json({ message: "Password updated." });
    } catch (error) {
        console.error(error);
        res.json({ message: "Failed to update password." });
    }
});

app.listen(9000, () => {
    console.log('Server is running on port 9000');
});
