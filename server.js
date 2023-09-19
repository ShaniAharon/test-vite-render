import express from 'express';
import { carService } from './services/car.service.js';
import { userService } from './services/user.service.js';
import { loggerService } from './services/logger.service.js'
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

const app = express();


// App Configuration
const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.static('public'))
app.use(cookieParser()) // for res.cookies
app.use(express.json()) // for req.body



// **************** Cars API ****************:
// List
app.get('/api/car', (req, res) => {
    const { txt, maxPrice } = req.query
    const filterBy = { txt, maxPrice: +maxPrice }
    carService.query(filterBy)
        .then(cars => {
            res.send(cars)
        })
        .catch(err => {
            loggerService.error('Cannot get cars', err)
            res.status(400).send('Cannot load cars')
        })
})

// Add
app.post('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add car')
    const { vendor, speed, price } = req.body

    const car = {
        vendor,
        speed: +speed,
        price: +price
    }
    carService.save(car, loggedinUser)
        .then((savedCar) => {
            res.send(savedCar)
        })
        .catch(err => {
            loggerService.error('Cannot save car', err)
            res.status(400).send('Cannot add car')
        })

})

// Edit
app.put('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update car')

    const { vendor, speed, price, _id, owner } = req.body
    const car = {
        _id,
        vendor,
        speed: +speed,
        price: +price,
        owner
    }
    carService.save(car, loggedinUser)
        .then((savedCar) => {
            res.send(savedCar)
        })
        .catch(err => {
            loggerService.error('Cannot save car', err)
            res.status(400).send('Cannot update car')
        })

})

// Read - getById
app.get('/api/car/:carId', (req, res) => {
    const { carId } = req.params
    carService.get(carId)
        .then(car => res.send(car))
        .catch(err => { 
            loggerService.error('Cannot get car', err)
            res.status(403).send(err) 
        })
})

// Remove
app.delete('/api/car/:carId', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot delete car')

    const { carId } = req.params
    carService.remove(carId, loggedinUser)
        .then(msg => {
            res.send({ msg, carId })
        })
        .catch(err => {
            loggerService.error('Cannot remove car', err)
            res.status(400).send('Cannot remove car, ' + err)
        })
})


// **************** Users API ****************:
app.get('/api/auth/:userId', (req, res) => {
    const { userId } = req.params
    userService.getById(userId).then(user => {
        res.send(user)
    })
})

app.post('/api/auth/login', (req, res) => {
    const credentials = req.body
    userService.checkLogin(credentials)
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token)
            res.send(user)
        })
        .catch(err => {
            res.status(401).send('Not you!')
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body
    userService.save(credentials)
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token)
            res.send(user)
        })
        .catch(err => {
            loggerService.error('Cannot signup', err)
            res.status(401).send('Nope!')
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})

app.put('/api/user', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update user')

    const { score, _id } = req.body
    const user = {
        _id,
       score: +score
    }
     userService.save(user)
        .then((savedUser) => {
            res.send(savedUser)
        })
        .catch(err => {
            loggerService.error('Cannot update user', err)
            res.status(400).send('Cannot update user')
        })

})

// app.get('/**', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// })

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

// Listen will always be the last line in our server!
// app.listen(3030, () => console.log('Server listening on port 3030!'))

const port = process.env.PORT || 3030;
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
});