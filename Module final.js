const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    "email":{
        type : String,
        unique: true
    },
    "password":String,
});

  let User;

  module.exports.startDB = function () {
    return new Promise(function (resolve, reject) {

        let db = mongoose.createConnection("mongodb+srv://Pewster:Hugh753300!@senecaweb.miuxsdx.mongodb.net/web322-finalTest", { useNewUrlParser: true });

        db.on('error', function(err){
            console.log("Cannot connect to DB.");
        });

        db.once('open', function(){
           User = mongoose.model("users", userSchema);
           console.log("DB connection successful.");
           resolve();

        });

    });
};

module.exports.register = function(userData) {
    return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(userData.password, salt, function(err, hash) {
                    if (err) {
                        reject("error encrypting password");
                    }
                    else {
                        userData.password = hash;
                        let newUser = new User(userData);
                        newUser.save((err) => {
                            if (err) {
                                if (err.code === 11000) {
                                    reject("Error: "+ userData.userEmail);
                                }
                                else {
                                    reject( "Error: cannot create the user.");
                                }
                            }
                            else {
                                resolve();
                            }
                        })
                    }
                })
            })
        }
    )
};

module.exports.signin = function(userData) {
    return new Promise((resolve, reject) => {
        User.find({userName: userData.userName})
        .exec()
        .then(users => {
            bcrypt.compare(userData.password, users[0].password).then(res => {
                if(res === true) {   
                    User.update(
                        { userEmail: users[0].userEmail },
                        { $set: {loginHistory: users[0].loginHistory} },
                        { multi: false }
                    )
                    .exec()
                    .then(() => {resolve(users[0])})
                    .catch(err => {reject("There was an error verifying the user: " + err)})
                }
                else {
                    reject("Incorrect Password for user: " + userData.userEmail); 
                }
            })
        })
        .catch(() => { 
            reject("Cannot find the user: " + userData.userEmail); 
        }) 
    })
};