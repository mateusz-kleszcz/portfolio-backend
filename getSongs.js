const fs = require('fs')
const mm = require('music-metadata')

exports.getSongs = album => {
    return new Promise(res => {
        fs.readdir('static/mp3/' + album, (err, files) => {
            if (err) console.log(err)
            else {
                const arrayOfFiles = files.map(songName => {
                    return new Promise((resolve, reject) => {
                        const stats = fs.statSync(`static/mp3/${album}/${songName}`)
                        mm.parseFile(`static/mp3/${album}/${songName}`)
                            .then(metadata => {
                                const { duration } = metadata.format
                                obj = {
                                    album,
                                    name: songName,
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
                    res(results)
                })
            }
        })
    })
}