const express = require('express')
const path = require('path')
const fs = require('fs')

let object
const playlist = []
fs.readdir('static/mp3', (err, dirs) => {
    if (err) console.log(err)
    else {
        fs.readdir('static/mp3/' + dirs[0], (err, files) => {
            if (err) console.log(err)
            else {
                const arrayOfFiles = files.map(songName => {
                    const stats = fs.statSync('static/mp3/' + dirs[0] + '/' + songName)
                    return obj = {
                        dir: dirs[0],
                        file: songName,
                        size: (stats.size / (1024 * 1024)).toFixed(2) + 'MB'
                    }
                })
                object = {
                    dirs,
                    files: arrayOfFiles
                }
            }
        })
    }
})

const port = process.env.PORT || 8080
const app = express()

app.use(express.static(path.join(__dirname, 'client/build')))

app.get('/api/albums', (req, res) => {
    res.end(JSON.stringify(object, null, 4))
});

app.listen(port, () => console.log(`App listening`))