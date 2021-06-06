
//API server
const express = require('express');
const app = express(); //create app by running express
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex'); //connecting server to db

const db = knex({

	client: 'pg',
	connection: {
		host : 'localhost',
		user : 'postgres',
		password: '1q2w3e',
		database: 'app-database'
	}
});
/*
db.select('*').from('users').then(data => {
	console.log(data);
}); */

app.use(bodyParser.json()) //bodyParser is a middleware, we put it after the app has been created
app.use(cors())
/*const database = {
	users: [
	{
		id: '123',
		name: 'John',
		email: 'john@gmail.com',
		password: 'cookies',
		entries: 0, //how many times he submited a photo
		joined: new Date() //when the user joined
	},
	{
		id: '124',
		name: 'Mary',
		email: 'mary@gmail.com',
		password: 'icecream',
		entries: 0, //how many times he submited a photo
		joined: new Date() //when the user joined
	}
	]
	
}
*/
app.get('/', (req,res) => {
	res.send(database.users);
})

app.post('/signin', (req,res) => {
	/*bcrypt.compare("cookies", '$2a$10$zAI4l2fWLFYd63apcj1pFu7ZgzAS7ltQ/0sp4Y.Cqvn4S.jromOzq',function(err,res){
		console.log('first guess', res) //convert your password into hash for better security

	})
		
	bcrypt.compare("veggies", '$2a$10$zAI4l2fWLFYd63apcj1pFu7ZgzAS7ltQ/0sp4Y.Cqvn4S.jromOzq', function(err,res){
		console.log('second guess', res)
	})

*/	
	const { email, password} = req.body;
	if(!email || !password){
		return res.status(400).json('incorect form submission');
	}

	db.select('email', 'hash').from('login')
		.where('email', '=', req.body.email)
		.then(data => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
			console.log(isValid);
			if(isValid){
				return db.select('*').from('users')
					.where('email', '=', req.body.email)
					.then(user =>{
						console.log(user);
						res.json(user[0])
					})
					.catch(err => res.status(400).json('unable to get user'))
			}else {
				res.status(400).json('wrong credentials')
			}
		})
		.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req,res) =>{
	const { email, name, password} = req.body;

	if(!email || !name || !password){
		return res.status(400).json('incorect form submission');
	}
	/*bcrypt.hash(password, null, null, function(err,hash){
		//store hash in your password DB
		console.log(hash); 
	})*/
	/*database.users.push({
		id: '125',
		name: name,
		email: email,
		password: password,
		entries: 0, 
		joined: new Date() 
	})*/
	const hash = bcrypt.hashSync(password);
	db.transaction( trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail =>{
			return trx('users') //adding new user 
				.returning('*')
				.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
				})

				.then(user => {
				res.json(user[0]); // returning our last user that registerd
				})

		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	
	.catch(err => res.status(400).json('unable to register'))
	})


app.get('/profile/:id' , (req,res) =>{ //seach the user by id
	const { id } = req.params;
	
	/*database.users.forEach(user =>{
		if(user.id === id){
			found = true;
			return res.json(user);
		}
	})*/
	db.select('*').from('users').where({id})
	.then(user => {
		console.log(user);
	})
	
})

app.put('/image', (req,res) =>{
	const { id } = req.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('unable to get entries'))
})

app.listen(3000, () => {
	console.log('app is running on port 3000 ');
})

/*
Our route
/ --> response = this is working
/signin --> POST REQUEST succes/fail
/register --> POST REQUEST = user
/profile/:userId --> GET REQUEST = user
/image --> PUT REQUEST so we get an update 

*/