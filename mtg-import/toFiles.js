const [ templatePath, sourcePath, targetFolder, imageFolder, rest ] = process.argv.slice(2)

console.log({template: templatePath, source: sourcePath, targetFolder, imageFolder, rest})

if (!templatePath || !sourcePath || !targetFolder) {
    console.log('You need to specify the template, source and targetFolder – I did nothing')
    return
}

if (rest != null) {
    console.log('I did nothing, because I didn\'t recognise the following input:', rest)
    return
}

// options are all of the ones in "image_uris"
// idk which, if any, are guaranteed, but the ones I found included
// small, normal, large, png, art_crop, border_crop
const imageSize = 'normal'
if (imageFolder) {
    console.log(`Image folder was specified – images will be downloaded using size "${imageSize}". You can change the size in the script (variable 'imageSize')`)
} else {
    console.log('No image folder was given – no images will be downloaded')
}

const eta = require('eta')
const fs = require('fs')
const path = require('path')
const axios = require('axios').create({
    responseType: 'stream'
})

// create necessary folders
if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, true)
}
if (imageFolder && !fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder, true)
}

// load template and source json
const templateFile = fs.readFileSync(templatePath, 'utf-8')
const sourceJson = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))

// create all files with that template
function getLocalImageNameForCard(cardData) {
    return imageFolder ? `${cardData['id']}-${cardData['name']}.jpg` : null
}

function renderTemplateAndSave(cardData) {
    const enrichedData = Object.assign(
        {},
        { localImg: getLocalImageNameForCard(cardData) },
        cardData)

    const renderedText = eta.render(templateFile, enrichedData)
    fs.writeFileSync(
        path.join(targetFolder, `${cardData['name']}-${cardData['id']}.md`),
        renderedText)
}

for (const card of sourceJson) {
    renderTemplateAndSave(card)
}

// download all images and save it in the directory (if a directory was given)
function downloadAndSafeImage(cardData) {
    if (cardData.image_uris) {
        const imgurl = cardData.image_uris[imageSize]
        if (imgurl) {
            return axios.get(imgurl)
                .then(response => {
                    const writer = fs.createWriteStream(path.join(imageFolder, getLocalImageNameForCard(cardData)))

                    return new Promise((resolve, reject) => {
                        response.data.pipe(writer)
                        let error = null
                        writer.on('error', err => {
                            error = err
                            writer.close()
                            reject(err)
                        })
                        writer.on('close', () => {
                            if (!error) {
                                resolve(response)
                            }
                        })
                    })
                })
        } else {
            return Promise.reject(`No image in size ${imageSize} found for card '${cardData['name']}-${cardData['id']}'`)
        }
    } else {
        return Promise.reject(`No image urls found for card '${cardData['name']}-${cardData['id']}'`)
    }
}
if (imageFolder) {
    console.log('Downloading images now.')
    console.log(`A note on good citizenship: Since the documentation of scryfall explicitely \
points out that image files are not subject to the rate limits, I took that to mean that the \
"good citizenship" ask also excludes those servers.
Therefore downloads are parallized and do not include a delay in between.
`)

    const batchPromises = require('batch-promises')

    const onePercent = 0.01 * sourceJson.length
    let nrOfSuccessfulDownloads = 0
    let nrOfUnsuccessfulDownloads = 0

    function printUpdate() {
        if ((nrOfSuccessfulDownloads + nrOfUnsuccessfulDownloads) % onePercent === 0) {
            console.log(`Status: Total: ${sourceJson.length} | failed: ${nrOfUnsuccessfulDownloads} | success: ${nrOfSuccessfulDownloads}`)
        }
    }

    batchPromises(
        10, // ten parallel downloads
        sourceJson,
        card => {
            return downloadAndSafeImage(card)
                .then(successfulDownload => {
                    ++nrOfSuccessfulDownloads
                    printUpdate()
                    return nrOfSuccessfulDownloads
                })
                .catch(err => {
                    ++nrOfUnsuccessfulDownloads
                    printUpdate()
                    throw err
                })
        })
        .then(_ => console.log('All done 🎉'))
        .catch(err => console.error(err))

} else {
    console.log('All done 🎉')
}