const express = require('express')
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')

const { getSongs } = require('./getSongs')
const User = require('./modules/User')
const UserSession = require('./modules/UserSession')

const config = require('./config/config')
const isDev = process.env.NODE_ENV !== 'production'
mongoose.connect(isDev ? config.db_dev : config.db, { useNewUrlParser: true })
mongoose.Promise = global.Promise

let object
fs.readdir('static/mp3', async (err, dirs) => {
    if (err) console.log(err)
    else {
        const files = await getSongs(dirs[0])
        object = {
            dirs,
            files
        }
    }
})

const port = process.env.PORT || 8080
const app = express()

app.use(express.static(path.join(__dirname, 'client/build')))
app.use(express.json())
app.use(express.urlencoded())

app.get('/api/albums', (req, res) => {
    res.end(JSON.stringify(object, null, 4))
});

app.post('/api/albums', async (req, res) => {
    const { albumName } = req.body
    const files = await getSongs(albumName)
    res.end(JSON.stringify(files, null, 4))
})

app.post('/api/albums/favourite', async (req, res) => {
    const { album, name, size, duration } = req.body.favouriteSong.song
    const { userId } = req.body.favouriteSong
    const { action } = req.body
    const favourite = { album, name, size, duration }
    let updateObj
    if (action === 'ADD')
        updateObj = { $push: { playlist: favourite } }
    else if (action === 'REMOVE')
        updateObj = { $pull: { playlist: favourite } }
    User.findByIdAndUpdate(userId,
        updateObj,
        null,
        (err, result) => {
            const { playlist } = result
            let userPlaylist
            if (action === 'ADD')
                userPlaylist = [...playlist, favourite]
            else if (action === 'REMOVE')
                userPlaylist = playlist.filter(item => {
                    if (item.name == name && item.album == album)
                        return false
                    else return true
                })
            if (err) {
                return res.send({
                    success: false,
                    message: 'Error: Server error'
                })
            }
            return res.send({
                success: true,
                message: 'Change playlist',
                userPlaylist
            })
        })
})

app.post('/api/account/signup', (req, res, next) => {
    const { username, password } = req.body.user
    let { email } = req.body.user
    email = email.toLowerCase()
    User.find({
        email
    }, (err, previousUser) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: Server error'
            })
        } else if (previousUser.length > 0) {
            return res.send({
                success: false,
                message: 'Error: Account already exist'
            })
        } else {
            const newUser = new User()
            newUser.email = email
            newUser.username = username
            newUser.password = newUser.generateHash(password)
            newUser.save((err, user) => {
                return res.send({
                    success: true,
                    message: 'Signed Up'
                })
            })
        }
    })
})

app.post('/api/account/signin', (req, res, next) => {
    const { username, password } = req.body.login
    User.find({ username }, (err, users) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: Server error'
            })
        } if (users.length != 1) {
            return res.send({
                success: false,
                message: 'Error: Invalid username'
            })
        }
        const user = users[0]
        if (!user.validPassword((password))) {
            return res.send({
                success: false,
                message: 'Wrong Password'
            })
        }
        const userSession = new UserSession()
        userSession.userId = user._id
        userSession.save((err, doc) => {
            if (err) {
                return res.send({
                    success: false,
                    message: 'Error: server error'
                })
            }
            return res.send({
                success: true,
                message: 'Valid sign in',
                token: doc._id,
                userId: user._id,
                userPlaylist: user.playlist
            })
        })
    })
})

app.post('/api/account/signout', (req, res, next) => {
    const { token } = req.body
    UserSession.findOneAndUpdate({
        _id: token,
        isDeleted: false
    }, {
        $set: { isDeleted: true }
    }, null, (err) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: Server error'
            })
        }
        return res.send({
            success: true,
            message: 'Valid sign out',
        })
    })
})

app.get('/api/account/verify', (req, res, next) => {
    const { token } = req.query
    UserSession.find({
        _id: token,
        isDeleted: false
    }, (err, sessions) => {
        if (err) {
            return res.send({
                success: false,
                message: 'Error: Server error'
            })
        } if (sessions.length != 1) {
            return res.send({
                success: false,
                message: 'Error: Invalid'
            })
        } else {
            return res.send({
                success: true,
                message: 'Good'
            })
        }
    })
})

app.listen(port, () => console.log(`App listening`))