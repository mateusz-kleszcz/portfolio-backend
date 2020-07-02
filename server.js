const express = require('express')
const path = require('path')
const fs = require('fs')
const mm = require('music-metadata')

let object
const playlist = []
fs.readdir('static/mp3', (err, dirs) => {
    if (err) console.log(err)
    else {
        fs.readdir('static/mp3/' + dirs[0], (err, files) => {
            if (err) console.log(err)
            else {
                const arrayOfFiles = files.map(songName => {
                    return new Promise((resolve, reject) => {
                        const stats = fs.statSync(`static/mp3/${dirs[0]}/${songName}`)
                        mm.parseFile(`static/mp3/${dirs[0]}/${songName}`)
                            .then(metadata => {
                                const { duration } = metadata.format
                                obj = {
                                    dir: dirs[0],
                                    file: songName,
                                    size: (stats.size / (1024 * 1024)).toFixed(2) + 'MB',
                                    duration
                                }
                                resolve(obj)
                            })
                            .catch(err => {
                                reject(err)
                            });
                    })
                })
                Promise.all(arrayOfFiles).then(results => {
                    object = {
                        dirs,
                        files: results
                    }
                })
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