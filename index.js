const { faker } = require('@faker-js/faker');
const mysql2 = require('mysql2');
const express =require('express');
const app=express();
const port=3000;
const path=require('path');
const methodOverride=require('method-override');

app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));

//defining connection in DB
const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'my_delta',
  port: 3306 
});

//asssigning fake values for keys
let getRandomUser= ()=> {
  return {
    userId: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
 
    password: faker.internet.password(),
    
  };
}

//connecting with the DB
connection.connect(err => {
  if (err) {
    console.error('Error connecting to DB:', err);
    return;
  }
  console.log('Connected to DB');
});

//Inserting all the fields in DB
let q = "INSERT INTO user(id, username, email, password) VALUES ?";
let data = [];
for(let i=1; i<=100; i++){
  const user = getRandomUser();
  data.push([user.userId, user.username, user.email, user.password]);
}

//connecting DB with the router
connection.query("SELECT COUNT(*) AS total FROM user", (err, result) => {
  if (err) {
    console.error(err);
    return;
  }
  if (result[0].total === 0) {
    connection.query(q, [data], (err, result) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Inserted 100 users');
    });
  } else {
    console.log("Users already exist in DB. Skipping insert.");
  }
});

//Home route
//fetch and show total no of users on our app
app.get('/', (req, res) => {
  let q = `SELECT count(*) AS count FROM user`;
  connection.query(q, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Some error in database");
    }
    console.log(result);
    let count=result[0].count;
    res.render('home', { count });

  });
});

//Show route
app.get('/user',(req,res)=>{
  let q=`SELECT * FROM user`;
  connection.query(q, (err, users) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Some error in database");
    }
    // console.log(result);
    // res.send(result);
    res.render('showusers',{users})
  });
});

//Edit form
app.get("/user/:id/edit",(req,res)=>{
  let {id}=req.params;
  let q=`SELECT * FROM user WHERE id='${id}'`;
  try{
    connection.query(q,(err,result)=>{
      if(err)throw err;
      console.log(result);
      let user=result[0];
      res.render('edit.ejs',{user});
    });
  }catch(err){
    res.send("some error occured");
  }
});
//update route
app.patch('/user/:id',(req,res)=>{
  
   let {id}=req.params;
   let {password:formPass , username:newuser}=req.body;
  let q=`SELECT * FROM user WHERE id='${id}'`;
  try{
    connection.query(q,(err,result)=>{
      if(err)throw err;
      console.log(result);
      let user=result[0];
      if(formPass!=user.password){
        res.send("Wrong password");
      }
      else{
        let q2=`UPDATE user SET username='${newuser}' WHERE ID='${id}'`;
        connection.query(q2,(err,result)=>{
          if(err)throw err;
          res.redirect('/user');
        });
      }
    });
  }catch(err){
    res.send("some error occured");
  }
});
app.listen(port,()=>{
  console.log(`listening on port ${port}`);
});