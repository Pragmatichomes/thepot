require('dotenv').config();
var {MongoClient,ObjectID} = require('mongodb');

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



var cors = require('cors')
const app = express();


const mongoClient = require('mongodb').MongoClient;
const url = process.env.DATABASE_URL;

const port = process.env.PORT || 3000;

//Middleware
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(cors());

/*
app.get('/', (req, res) => {
    console.log("The first route entered");
    res.status(200).send("result is fine");
});
*/

//This is the script
mongoClient.connect(url, { useUnifiedTopology: true }, (err, db) => {
    if (err) {
        console.log("Error creating database "+err);
    }
    else{
        console.log("Mongodb connected finally");
        const myDb = db.db('pragmatic');
        const accountCollection = myDb.collection('Accounting');
        const activitiesCollection = myDb.collection('Activities');
        const adminCollection = myDb.collection('Admin');
        const blogCollection = myDb.collection('Blog');
        const consultantCollection = myDb.collection('Consultant');
        const finalregistrationCollection = myDb.collection('Finalregistration');
        const landCollection = myDb.collection('Land');
        const landDetailsCollection = myDb.collection('LandDetails');
        const landUploadCollection = myDb.collection('LandUpload');
        const houseCollection = myDb.collection('House');
        const houseDetailsCollection = myDb.collection('HouseDetails');
        const houseUploadCollection = myDb.collection('HouseUpload');
        const messageCollection = myDb.collection('Message');
        const propertyCollection = myDb.collection('Property');
        const staffCollection = myDb.collection('Staff');
        const subscribersCollection = myDb.collection('Subscribers');

        //Admin
        //Admin login
        //Admin create

        app.get('/sendmail', (req, res) => {
            const msg = {
                to: 'giddxy@gmail.com',
                from: "contact@pragmatichomeslimited.com",
                subject: "Update from Technical Department",
                
                html: "Good afternoon, <br><br> We received your complaint that you’ve not been able to login to your portal after reseting your login details. We’ve traced the fault and it was a technical issue from our server. We are very sorry for the inconveniences this would have cost you. Please bear with us.<br><br>You can check the reset email you received from us earlier to retrieve your reset password and login to your portal. <br><br>Please if you have or encounter any other issue, don’t hesitate to contact us. We are at your service. Thank you for your understanding.<br><br>Technical Department",
            };
            
            sgMail.send(msg);

            const objToSend = {
                status: "Sent",
                statusMsg: "Please check your email for your reset password",
                user: {
                
                }
            }
            res.status(200).send(JSON.stringify(objToSend));
        });

        //admin get all
        app.get('/admin/all', (req, res) => {
            
            adminCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    
                    res.status(200).send(result);
                }
            })
        })
        
        //accounting create
        app.post('/admin/create', (req, res) => {

            const query = { department: req.body.department }

            adminCollection.findOne(query, (err, result) => {
                const newAdmin = {
                    department : req.body.department,
                    category : req.body.category,
                    date : req.body.date,
                    password: bcrypt.hashSync(req.body.password, 10)
                }

                if(result == null){
                    adminCollection.insertOne(newAdmin, (err, result) => {
                        res.status(200).send(result);
                    })
                }
                else {
                    res.status(400).send();
                }
            })

        })

        app.post('/admin/auth', (req, res) => {
            
            const password = req.body.password;
            
            const query = {
                //email : req.body.email,
                department : req.body.department
            }

            adminCollection.findOne(query, (err, result) => {
                
                if (result !== null){
                    
                    const user = {
                        department: result.department
                    }
                    
                    bcrypt.compare(password, result.password, (err, isMatch) => {
                        
                        if (err){
                            const objToSend = {
                                token: "Nil",
                                statusMsg: "Problem authenticating login",
                                user: {
                                    category: ''
                                }
                            }
                            res.status(200).send(JSON.stringify(objToSend));
                        }
                        if (isMatch) {
                            const token = jwt.sign({user: user}, process.env.JWT_SECRET, {
                                expiresIn: '1d'
                            });

                            const objToSend = {
                                token: token,
                                statusMsg: "Nil",
                                user: {
                                    department: user.department
                                }
                            }
                            
                            res.status(200).send(JSON.stringify(objToSend));
                        }
                        else {
                            const objToSend = {
                                token: "Nil",
                                statusMsg: "Wrong Password",
                                user: {
                                    category: ''
                                }
                            }
                            res.status(200).send(JSON.stringify(objToSend));
                        }
                    })

                } else {
                    const objToSend = {
                        token: "Nil",
                        statusMsg: "Account not found",
                        user: {
                            category: ''
                        }
                    }
                    res.status(200).send(JSON.stringify(objToSend));
                }

            })

        })

        app.post('/auth/register', (req, res) => {

            const query = { email: req.body.email }

            usersCollection.findOne(query, (err, result) => {

                if(err){
                    const objToSend = {
                        token: "Nil",
                        statusMsg: "Account with same details already exists",
                        user: {
                            id: '',
                            name: '',
                            email: '',
                            phone: '',
                            location: '',
                            images: '',
                            category: '',
                            token: ''
                        }
                    }
                    res.status(200).send(JSON.stringify(objToSend));
                }

                else {
                    const newUser = {
                        name : req.body.name,
                        email : req.body.email,
                        phone : req.body.phone,
                        location : req.body.location,
                        token : req.body.token,
                        password: bcrypt.hashSync(req.body.password, 10),
                        images : req.body.images,
                        category: 'Student'
                    }
                    
                    if(result == null){
                        usersCollection.insertOne(newUser, (err, res) => {

                            const user = {
                                id: res._id,
                                name : res.name,
                                email : res.email,
                                phone : res.phone,
                                location : res.location,
                                token : res.token,
                                images : res.images,
                                category: 'Student'
                            }

                            const token = jwt.sign({user: user}, process.env.JWT_SECRET, {
                                expiresIn: '1d'
                            });

                            const objToSend = {
                                token: token,
                                statusMsg: "Login successful",
                                user: user
                            }
                            
                            res.status(200).send(JSON.stringify(objToSend));
                        })
                    }
                    else {
                        const objToSend = {
                            token: "Nil",
                            statusMsg: "Account with same details already exists",
                            user: {
                                id: '',
                                name: '',
                                email: '',
                                phone: '',
                                location: '',
                                images: '',
                                category: '',
                                token: ''
                            }
                        }
                        res.status(200).send(JSON.stringify(objToSend));
                    }
                }
            })

        })


        app.post('/auth', (req, res) => {
             
            const password = req.body.password;
            
            const query = {
                email : req.body.email,
                //category : req.body.category
            }

            finalregistrationCollection.findOne(query, (err, result) => {
                
                if (result != null){
                    
                    const user = {
                        id: result._id,
                        surname: result.name,
                        email: result.email,
                        firstname: result.firstname,
                        phone: result.phone,
                        agent: result.agent
                    }
                    
                    bcrypt.compare(password, result.password, (err, isMatch) => {
                        
                        if (err){
                            const objToSend = {
                                token: "Nil",
                                statusMsg: "Problem authenticating login",
                                user: {
                                    id: '',
                                    surname: '',
                                    email: '',
                                    firstname: '',
                                    phone: '',
                                    agent: ''
                                }
                            }

                            var d = new Date(); 
                            const activities = {
                                email: user.email,
                                category: 'Traffic',
                                comment: 'Problem authenticating; unable to login',
                                date: new Date(),
                                time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                            }
                            activitiesCollection.insertOne(activities, (err, result) => {
                                
                            });

                            res.status(200).send(JSON.stringify(objToSend));
                        }
                        if (isMatch) {
                            const token = jwt.sign({user: user}, process.env.JWT_SECRET, {
                                expiresIn: '1d'
                            });

                            const objToSend = {
                                token: token,
                                user: user
                            }

                            var d = new Date(); 
                            const activities = {
                                email: user.email,
                                category: 'Traffic',
                                comment: 'Login successfully',
                                date: new Date(),
                                time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                            }
                            activitiesCollection.insertOne(activities, (err, result) => {
                                
                            });

                            
                            res.status(200).send(JSON.stringify(objToSend));
                        }
                        else {
                            const objToSend = {
                                token: "Nil",
                                statusMsg: "Wrong Password",
                                user: {
                                    id: '',
                                    surname: '',
                                    email: '',
                                    firstname: '',
                                    phone: '',
                                    agent: ''
                                }
                            }
                            res.status(200).send(JSON.stringify(objToSend));
                        }
                    })

                } else {
                    const objToSend = {
                        token: "Nil",
                        statusMsg: "Account not found",
                        user: {
                            surname: '',
                            email: '',
                            firstname: '',
                            phone: '',
                            agent: ''
                        }
                    }
                    res.status(200).send(JSON.stringify(objToSend));
                }

            })

        })



        app.post('/auth/send_reset', (req, res) => {
            
            const query = { email: req.body.email }
            console.log(req.body.email)

            finalregistrationCollection.findOne(query, (err, result) => {

                if(err){
                    const objToSend = {
                        status: "No Account",
                        statusMsg: "This email is not registered here",
                        user: {
                           
                        }
                    }
                    res.status(200).send(JSON.stringify(objToSend));
                }
                else {
                    if (result !== null){
                        //console.log("resul is set "+result.password);
                        const ObjectId  = require('mongodb').ObjectID;
                        const query = {
                            _id: ObjectId(result._id)
                        }

                        const newSet = {$set : {password : bcrypt.hashSync(req.body.password, 10), oripass: req.body.password} }
                    
                        finalregistrationCollection.updateOne(query, newSet, {upsert:true}, (err, result2) => {
                            if (err) {
                                const objToSend = {
                                    status: "Server Error",
                                    statusMsg: "Possible server issue, you can try again later",
                                    user: {
                                    
                                    }
                                }
                                res.status(200).send(JSON.stringify(objToSend));
                            } else {
                                var d = new Date(); 
                                const activities = {
                                    email: req.body.email,
                                    category: 'Profile',
                                    comment: 'Profile password successfully reset',
                                    date: new Date(),
                                    time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                                }
                                activitiesCollection.insertOne(activities, (err, result) => {
                                
                                });


                                const msg = {
                                    to: req.body.email,
                                    from: "hr@pragmatichomeslimited.com",
                                    subject: "Password Reset Confirmation",
                                    text: "This is to confirm the reset of your password. You can now login to your portal with these password: "+req.body.password+" Please change the password to a more familiar one on first login to your portal",
                                    html: result.surname+" "+result.firstname+", <br><br>This is to confirm the reset of your password. You can now login to your portal with these details<br><br> Password: "+req.body.password+" <br><br>Please change the password to a more familiar one on first login to your portal",
                                };
                                
                                sgMail.send(msg);

                                const objToSend = {
                                    status: "Sent",
                                    statusMsg: "Please check your email for your reset password",
                                    user: {
                                    
                                    }
                                }
                                res.status(200).send(JSON.stringify(objToSend));
                            }
                        }); 
                    }
                    else {
                        const objToSend = {
                            status: "No Account",
                            statusMsg: "This email is not registered here",
                            user: {
                               
                            }
                        }
                        res.status(200).send(JSON.stringify(objToSend));
                    }
                }
            })

        })

        //ACCOUNTING
        //accounting get all
        app.get('/activities/all', (req, res) => {
            
            activitiesCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                }
            })
        })

        app.get('/activities/find/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
               // _id: ObjectId(req.params.id)
               email: req.params.email
            }
            
            activitiesCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.get('/activities/find/30/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
               // _id: ObjectId(req.params.id)
               email: req.params.email
            }
            
            activitiesCollection.find(query).sort({date: -1}).limit(30).toArray( (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.get('/activities/find/30/all', (req, res) => {
            
            activitiesCollection.find({}).sort({date: -1}).limit(30).toArray( (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })


        //ACCOUNTING
        //accounting get all
        app.get('/accounting/all', (req, res) => {
            
            accountCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                }
            })
        })

        app.get('/accounting/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
               _id: ObjectId(req.params.id)
            }
            
            accountCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.put('/accounting/update/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const comment = '';
            const message = '';

            const query = {
                _id: ObjectId(req.params.id)
            }

            if (req.body.status == 'Void'){
                comment = "Payment evidence void";
                message = `This is to notify you that there is a problem with the receipt you submitted with the following details:
                <br><br>
                Property Name : ${req.body.pname}<br>
                Depositor : ${body.body.depositor}<br>
                Bank : ${body.body.bank}<br>
                Teller : ${body.body.teller}<br>
                Amount : N${body.body.amount}<br>
                <br><br>

                Please you can check the information again and re-submit the payment evidence. You can also contact us if you are sure the information submitted is valid. 
                Please keep your evidence with you until the transaction is cleared from us
                <br><br>

                Thanks,
                Accounting, Pragmatic
                `
            }

            if (req.body.status == 'Cleared'){
                comment = "Payment evidence cleared";
                message = `This is to notify you that the payment evidence you submitted with the following details has been cleared:
                <br><br>
                Property Name : ${req.body.pname}<br>
                Depositor : ${body.body.depositor}<br>
                Bank : ${body.body.bank}<br>
                Teller : ${body.body.teller}<br>
                Amount : N${body.body.amount}<br>
                <br><br>

                Please feel free to login to your portal and confirm. You can also print out your receipts now from your portal.
                <br><br>

                Thanks,
                Accounting, Pragmatic `
            }

            const newSet = {$set : {status : req.body.status} }
            
            accountCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Transaction',
                        comment: comment,
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                       
                    });


                    const msg = {
                        to: body.email,
                        from: "contact@pragmatichomeslimited.com",
                        subject: comment,
                        
                        html: message
                    };
                    sgMail.send(msg);


                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        //accounting get valid
        //accounting get by id
        app.get('/accounting/find/:pname/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
               // _id: ObjectId(req.params.id)
               pname: req.params.pname,
               email: req.params.email
            }
            
            accountCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.get('/accounting/find/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
               // _id: ObjectId(req.params.id)
               email: req.params.email
            }
            
            accountCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        

        //accounting create
        app.post('/accounting/create', (req, res) => {
           
            const body = req.body;

            
            accountCollection.insertOne(body, (err, result) => {
                if(err){

                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Transaction',
                        comment: req.body.category+ ' Transaction failed: '+req.body.pname+' ('+req.body.mode+')transaction',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    const message = {
                        status: "Error",
                        message: "Error creating the account"
                    }
                    res.status(400).send()
                }
                else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Transaction',
                        comment: req.body.category+ ' Transaction successful: '+req.body.pname+' ('+req.body.mode+')transaction',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    const message = {
                        status: "Success",
                        message: "Payment registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })

      
        app.get('/blog/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
                //estate: req.params.estate
            }
            
            blogCollection.find(query).sort({date: -1}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
            
        })
    
       
        //blog get all
        app.get('/blog/all', (req, res) => {
            console.log("Blog all called");
            blogCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                    console.log()
                }
            })
        })
        //blog create
        app.post('/blog/create', (req, res) => {
            const body = req.body;
            blogCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the blog"
                    }
                    res.status(400).send();
                    
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Blog registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })


        //consultant get all
        app.get('/consultant/all', (req, res) => {
            
            consultantCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                    console.log()
                }
            })
        })

        //consultant create
        app.post('/consultant/create', (req, res) => {
            const body = req.body;
            consultantCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the consultant"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Consultant registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })

        //blog get all
        app.get('/client/all', (req, res) => {
            
            finalregistrationCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                }
            })
        })



        //finalregistration create
        app.post('/client/create', (req, res) => {
            const body = req.body;
            const query = {
                email: body.email
            }

            finalregistrationCollection.findOne(query, (err, result) => {
                if (!result){
                    const rand = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
                    const newUser = {
                        num_property : 1,
                        userid: "Nil",
                        surname: body.surname,
                        firstname: body.firstname,
                        middlename: "Nil",
                        location: body.address,
                        email: body.email,
                        phone: body.phone,
                        birthdate: body.birthdate,
                        picture: body.upload,
                        oripass: rand.toString(),
                        num_interest: body.num_interest,
                        agent: body.agent,
                        date: body.date,
                        password: bcrypt.hashSync(rand.toString(), 10)
                    }

                    finalregistrationCollection.insertOne(newUser, (err2, result2) => {
                        if(err2){
                            const message = {
                                status: "Error",
                                message: "Error creating the client account"
                            }
                            res.status(400).send(message);
                        }
                        else {
                            var d = new Date(); 
                            const activities = {
                                email: req.body.email,
                                category: 'Profile',
                                comment: 'Welcome to Pragmatic Homes: Account successfully created',
                                date: new Date(),
                                time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                            }
        
                            activitiesCollection.insertOne(activities, (err3, result3) => {
                                
                            });

                            const msg = {
                                to: body.email,
                                from: "contact@pragmatichomeslimited.com",
                                subject: "Welcome to Pragmatic Homes Online",
                                
                                html: body.lastname+",<br><br>You are welcome to the Pragmatic Homes family. You've been registered successfully and you can access your portal anytime to complete major tasks that like registering your payment tellers and other evidences and printing your payment receipts, you can also print your transaction statement directly from your portal. <br><br>Your can login to your portal on our website www.pragmatichomesltd.com with the following details:<br><br>Email:"+body.email+"<br>Password:"+rand+"<br><br>Please contact us if you have any problem with your portal.<br><br>You are adviced to change your password to a more familiar one on first login. <br><br>Thanks, <br>Management"
                              
                            };
                            sgMail.send(msg);
        
                            const message = {
                                status: "Success",
                                message: "Client registered successfully"
                            }
                            res.status(200).send(message);
                        }
                    })
                }
                else {
                    const query = {
                        email: body.email
                    }

                    const num_prop = body.num_property + 1;
        
                    const newSet = {
                        $set : {
                            num_property : num_prop,
                            userid: result.userid,
                            surname: result.surname,
                            firstname: result.firstname,
                            middlename: result.middlename,
                            location: result.location,
                            email: result.email,
                            phone: result.phone,
                            birthdate: result.birthdate,
                            picture: result.picture,
                            oripass: result.oripass,
                            agent: result.agent,
                            date: result.date,
                            password: result.password
                        } 
                    }
                    
                    finalregistrationCollection.updateOne(query, newSet, {upsert:true}, (err2, result2) => {
                        if (err2) {
                            //res.status(500).send({ message: 'An error has occurred'});
                            const message = {
                                status: "Error",
                                message: "Error updatingg number of properties"
                            }
                            res.status(400).send(message);
                        } else {
                            //res.status(200).send({message: "Updated successfully"});
                            const message = {
                                status: "Success",
                                message: "Client registered and number of properties updated"
                            }
                            res.status(200).send(message);
                        }
                    });
                  
                }
            })

       
            
        })

        app.get('/client/find/:email', (req, res) => {
            const query = {
                email: req.params.email
            }
            finalregistrationCollection.findOne(query, (err, result) => {
                if (result == null){
                    res.status(200).send(result);
                }
                else {
                    res.status(200).send(result);
                }
            });
        })

        app.get('/client/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            
            finalregistrationCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.put('/client/update_details/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {surname : req.body.surname, firstname: req.body.firstname, location: req.body.location, birthdate: req.body.birthdate, email: req.body.email, phone: req.body.phone} }
            
            finalregistrationCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Profile',
                        comment: 'Profile details successfully updated',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                       
                    });

                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/client/update_password/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {password: bcrypt.hashSync(req.body.password, 10)} }
            
            finalregistrationCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Profile',
                        comment: 'Profile password successfully reset',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                       
                    });

                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/client/update_num_property/:email', (req, res) => {
            //const ObjectId  = require('mongodb').ObjectID;
            const query = {
                email: req.params.email
            }

            const newSet = {$set : {num_property : req.body.num_property} }
            
            finalregistrationCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        

        //land get all
        app.get('/land/all', (req, res) => {
            
            landCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })

        //land get by id
        app.get('/land/:estate', (req, res) => {
            //let id = req.params.id;
            const query = {
                //_id: req.params.id
                estate: req.params.estate
            }
            
            landCollection.find(query).sort({date: -1}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
            
        })

        app.get('/land/find/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
                //estate: req.params.estate
            }
            
            landCollection.find(query).sort({date: -1}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
            
        })
        //land create
        app.post('/land/create', (req, res) => {
            const body = req.body;
            landCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the listing"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Land registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
        })

        app.put('/land/update/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
    
            const newSet = {
                $set : {
                    estate: req.body.estate, 
                    caption: req.body.caption, 
                    location: req.body.location, 
                    documentation: req.body.documentation, 
                    features: req.body.features, 
                    video: req.body.video, 
                    longitude: req.body.longitude, 
                    latitude: req.body.latitude, 
                    landmark: req.body.landmark, 
                    upload: req.body.upload, 
                    status: req.body.status
                } 
            }
            
            landCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 
    

         //land detailscreate
         app.post('/land_details/create', (req, res) => {
            const body = req.body;
            landDetailsCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the listing"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Land registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
        })

        //land get all
        app.get('/land_details/all', (req, res) => {
            
            landDetailsCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })

        app.delete('/land_details/delete/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            landDetailsCollection.remove(query, {safe:true}, function(err, result) {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        })  

        //land get by id
        app.get('/land_details/:land_id', (req, res) => {
            //let id = req.params.id;
            const query = {
                //_id: req.params.id
                land_id: req.params.land_id
            }
            
            landDetailsCollection.find(query).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })

        

        //land upload create
        app.post('/land_upload/create', (req, res) => {
            const body = req.body;
            landUploadCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the listing"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Land registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
        })

        app.get('/land_upload/all', (req, res) => {
            
            landUploadCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })


        app.delete('/land_upload/delete/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            landUploadCollection.remove(query, {safe:true}, function(err, result) {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        })  

        //land get by id
        app.get('/land_upload/:land_id', (req, res) => {
            //let id = req.params.id;
            const query = {
                //_id: req.params.id
                land_id: req.params.land_id
            }
            
            landUploadCollection.find(query).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })



        //house get all
       //land get all
    app.get('/house/all', (req, res) => {
        
    houseCollection.find({}).toArray((err, result) => {
        if (result == null){
            res.status(400).send();
        }
        else {
            res.status(200).send(result);
        }
    })
    })

    //land get by id
    app.get('/house/:estate', (req, res) => {
        //let id = req.params.id;
        const query = {
            //_id: req.params.id
            estate: req.params.estate
        }
        
        houseCollection.find(query).sort({date: -1}).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
        
    })

    app.get('/house/find/:id', (req, res) => {
        //let id = req.params.id;
        const ObjectId  = require('mongodb').ObjectID;
        const query = {
            _id: ObjectId(req.params.id)
            //estate: req.params.estate
        }
        
        houseCollection.find(query).sort({date: -1}).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
        
    })

    //land create
    app.post('/house/create', (req, res) => {
        const body = req.body;
        houseCollection.insertOne(body, (err, result) => {
            if(err){
                const message = {
                    status: "Error",
                    message: "Error creating the listing"
                }
                res.status(400).send()
            }
            else {
                const message = {
                    status: "Success",
                    message: "Land registered successfully"
                }
                res.status(200).send(message);
            }
        })
    })

    app.put('/house/update/:id', (req, res) => {
        const ObjectId  = require('mongodb').ObjectID;
        const query = {
            _id: ObjectId(req.params.id)
        }

        const newSet = {
            $set : {
                estate: req.body.estate, 
                caption: req.body.caption, 
                location: req.body.location, 
                documentation: req.body.documentation, 
                features: req.body.features, 
                video: req.body.video, 
                longitude: req.body.longitude, 
                latitude: req.body.latitude, 
                landmark: req.body.landmark, 
                upload: req.body.upload, 
                status: req.body.status
            } 
        }
        
        houseCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
            if (err) {
                res.status(500).send({ message: 'An error has occurred'});
            } else {
                res.status(200).send({message: "Updated successfully"});
            }
        });
    }) 


     //land detailscreate
     app.post('/house_details/create', (req, res) => {
        const body = req.body;
        houseDetailsCollection.insertOne(body, (err, result) => {
            if(err){
                const message = {
                    status: "Error",
                    message: "Error creating the listing"
                }
                res.status(400).send()
            }
            else {
                const message = {
                    status: "Success",
                    message: "Land registered successfully"
                }
                res.status(200).send(message);
            }
        })
    })

    //land get all
    app.get('/house_details/all', (req, res) => {
        
        houseDetailsCollection.find({}).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
    })

    app.delete('/house_details/delete/:id', (req, res) => {
        const ObjectId  = require('mongodb').ObjectID;
        const query = {
            _id: ObjectId(req.params.id)
        }
        houseDetailsCollection.remove(query, {safe:true}, function(err, result) {
            if (err) {
                res.status(500).send({ message: 'An error has occurred'});
            } else {
                res.status(200).send({message: "Updated successfully"});
            }
        });
    })   

    //land get by id
    app.get('/house_details/:house_id', (req, res) => {
        //let id = req.params.id;
        const query = {
            //_id: req.params.id
            house_id: req.params.house_id
        }
        
        houseDetailsCollection.find(query).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
    })

    

    //land upload create
    app.post('/house_upload/create', (req, res) => {
        const body = req.body;
        houseUploadCollection.insertOne(body, (err, result) => {
            if(err){
                const message = {
                    status: "Error",
                    message: "Error creating the listing"
                }
                res.status(400).send()
            }
            else {
                const message = {
                    status: "Success",
                    message: "Land registered successfully"
                }
                res.status(200).send(message);
            }
        })
    })

    app.get('/house_upload/all', (req, res) => {
        
        houseUploadCollection.find({}).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
    })


    app.delete('/house_upload/delete/:id', (req, res) => {
        const ObjectId  = require('mongodb').ObjectID;
        const query = {
            _id: ObjectId(req.params.id)
        }
        houseUploadCollection.remove(query, {safe:true}, function(err, result) {
            if (err) {
                res.status(500).send({ message: 'An error has occurred'});
            } else {
                res.status(200).send({message: "Updated successfully"});
            }
        });
    })  

    //land get by id
    app.get('/house_upload/:house_id', (req, res) => {
        //let id = req.params.id;
        const query = {
            //_id: req.params.id
            house_id: req.params.house_id
        }
        
        houseUploadCollection.find(query).toArray((err, result) => {
            if (result == null){
                res.status(400).send();
            }
            else {
                res.status(200).send(result);
            }
        })
    })




        //message get all
        app.get('/message/all', (req, res) => {
            
            messageCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    res.status(200).send(result);
                }
            })
        })

        app.get('/message/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                //_id: ObjectId(req.params.id)
                email: req.params.email
            }
            
            messageCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        //Message create
        app.post('/message/create', (req, res) => {
            const body = req.body;
            messageCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the message"
                    }
                    res.status(400).send()
                }
                else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: 'Message',
                        comment: 'Message successfully delivered',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    const message = {
                        status: "Success",
                        message: "Messages created successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })

        app.get('/property/all', (req, res) => {
            
            propertyCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    
                    res.status(200).send(result);
                    
                }
            })
        })

        //property create
        app.post('/property/create', (req, res) => {
            const body = req.body;
            propertyCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the property"
                    }
                    res.status(400).send()
                }
                else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: req.body.ptype,
                        comment: 'Property successfully added',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    const msg = {
                        to: body.email,
                        from: "contact@pragmatichomeslimited.com",
                        subject: "Thank you for subscribing to our property",
                        
                        html: `${body.surname},

                        We wish to inform you that the property you've subscribed to on our website has been allocated to you. The details of the property are as follows:
                        <br><br>
                        Property Name : ${body.pname}<br>
                        No of Unit(s) : ${body.deal_no}<br>
                        Price : N${body.amount}<br>
                        <br>
                        You can manage this property directly from your portal anytime you like.<br><br>
                        
                        Thanks for your patronage.<br><br>
                        
                        Thanks<br>
                        Pragmatic Management`
                    };
                    sgMail.send(msg);
                    
                    const message = {
                        status: "Success",
                        message: "Property registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })


        app.put('/property/update_status/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            const newSet = {$set : {status : req.body.status} }
            
            propertyCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: req.body.ptype,
                        comment: 'Property status successfully updated',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/property/update_agent/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {agent : req.body.agent} }
            
            propertyCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    var d = new Date(); 
                    const activities = {
                        email: req.body.email,
                        category: req.body.ptype,
                        comment: 'Property agent successfully updated',
                        date: new Date(),
                        time: d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
                    }
                    activitiesCollection.insertOne(activities, (err, result) => {
                        
                    });

                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.get('/property/:email', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                //_id: ObjectId(req.params.id)
                email: req.params.email
            }
            
            propertyCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        //Property
        app.get('/property/find/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            
            propertyCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        
        //staff get all
        app.get('/staff/all', (req, res) => {
            
            staffCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                    console.log()
                }
            })
        })
        //staff create
        app.post('/staff/create', (req, res) => {
            const body = req.body;
            staffCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the staff"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Staff record registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })

        //blog get all
        
        app.get('/subscribers/all', (req, res) => {
            console.log("Subscribers all called");
            subscribersCollection.find({}).toArray((err, result) => {
                if (result == null){
                    res.status(400).send();
                }
                else {
                    console.log(result);
                    res.status(200).send(result);
                    console.log()
                }
            })
        })

        app.get('/subscribers/:id', (req, res) => {
            //let id = req.params.id;
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }
            
            subscribersCollection.findOne(query, (err, result) => {
                if (result == null){
                    //console.log(err);
                    res.status(400).send();
                }
                else {
                    //console.log(result);
                    res.status(200).send(result);
                }
            });
            
        })

        app.put('/subscribers/update_pname/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {pname : req.body.pname, date: req.body.date} }
            
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/subscribers/update_property/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {punit : req.body.punit, price: req.body.price, agent: req.body.agent}}
           
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/subscribers/update_personal/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {lastname : req.body.lastname, othernames: req.body.othernames, email: req.body.email, phone: req.body.phone, address: req.body.address}}
           
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/subscribers/update_kin/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {kin_fullname : req.body.kin_fullname, kin_phone: req.body.kin_phone, kin_email: req.body.kin_email}}
           
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/subscribers/update_upload/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {upload : req.body.upload, upload2: req.body.upload2}}
           
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.put('/subscribers/update_status/:id', (req, res) => {
            const ObjectId  = require('mongodb').ObjectID;
            const query = {
                _id: ObjectId(req.params.id)
            }

            const newSet = {$set : {status: req.body.status}}
           
            subscribersCollection.updateOne(query, newSet, {upsert:true}, (err, result) => {
                if (err) {
                    res.status(500).send({ message: 'An error has occurred'});
                } else {
                    res.status(200).send({message: "Updated successfully"});
                }
            });
        }) 

        app.delete('/subscriber/delete/:id', (req, res) => {

            let id = req.params.id;
            var sid = new ObjectID(id);
            
            subscribersCollection.deleteOne({_id: sid}, (err, result) => {
                if (err){
                    console.log("Subscriber error");
                    res.status(400).send();
                }
                else {
                    console.log("Subscriber delete");
                    res.status(200).send();
                }
            })
            
        })

        

        //Subscribers create
        app.post('/subscribers/create', (req, res) => {
            const body = req.body;
            subscribersCollection.insertOne(body, (err, result) => {
                if(err){
                    const message = {
                        status: "Error",
                        message: "Error creating the subscribers"
                    }
                    res.status(400).send()
                }
                else {
                    const message = {
                        status: "Success",
                        message: "Subscribers registered successfully"
                    }
                    res.status(200).send(message);
                }
            })
            
        })

       

    }
});


app.post('/dump/accounting', (req, res) => {
           
    const body = req.body;
    accountCollection.insertOne(body, (err, result) => {
    });

});

app.post('/dump/finalregistration', (req, res) => {
           
    const body = req.body;
    finalregistrationCollection.insertOne(body, (err, result) => {
    });

});

app.post('/dump/subscribers', (req, res) => {
           
    const body = req.body;
    subscribersCollection.insertOne(body, (err, result) => {
    });

});

app.listen(port, () => {
    console.log("Listening to my app, coming on port "+process.env.PORT || port);
});