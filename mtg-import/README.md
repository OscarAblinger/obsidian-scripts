# mtg import

How to use:

You need npm and node installed in order to execute this script.
Then, in this folder, run `npm i` in order to install the [dependencies](#dependencies)

Afterwards you can execute the script `toFiles` over your favourite command line.
The options are as follows:

```sh
node toFiles <templatePath> <sourcePath> <targetFolder> <imageFolder>
```

> `templatePath`: path to the eta template file
>
> `sourcePath`: path to the downloaded file with all of the cards.
>   You can find the bulk downloads [here](https://scryfall.com/docs/api/bulk-data)
>   Note however, that the bigger ones are likely too big to be processed using the default
>   node parameters, so I recommend splitting them up into multiple files.
>   You can specify the same folders for all of the files without worrying about overwriting
>   anything.
>
> `targetFolder`: the folder in which all of the cards are being generated
>
> `imageFolder`: the folder in which all of the images are being downloaded.
>   If you do not specify this, then no images will be downloaded.

For example, if you download the "all cards" file into the same directory as this file
and call it `all-cards.json`, then you could execute the following command utilizing the
example template provided in the file `template.eta`:

```sh
node toFiles template.eta all-cards.json targetFolder imageFolder
```

## Some notes on the behaviour

- This script will generate files with the pattern `<name of the card>-<id of the card>.md`.
Note that the id is the bulk id, not the gatherer id, since the later might not be unique.
If you want to change that, you can change the naming scheme in the method
`getFileNameWithoutEnding`.

- Images follow the same schema, although the end in `.jpg` instead of `.md`.

- In the template, you can use all of the variables available in the object of each card.
  You can find the given properties in the documenattion of [scryfall](https://scryfall.com/docs/api/cards).

  Additionally this script will also make a special property with the name `localImg` available,
  which is the name of the `.jpg` file or `null` if images are not downloaded.

  Note that if the card does not have an image available, then this property is still set.
  You can check whether a card has an image via it's `image_uris` properties.
  By default, the script requires `image_uris.normal` to be set in order to be able to download an image.

- Invalid characters in file names will be sanitized and replaced with `_`

## Dependencies

NPM and Node.js in order to run the script.

You can install them [here](https://nodejs.org/en/download/)
(the installers will install both npm and node js).

NPM packages: (no need to install them manually, just run `npm i` in this folder)

- [Axios](https://www.npmjs.com/package/axios) for the http request for images
- [batch-promises](https://www.npmjs.com/package/batch-promises) in order to batch the downloads
- [eta](https://eta.js.org/) for the templating (same engine that is used in the templater plugin)
- [sanitize-filename](https://www.npmjs.com/package/sanitize-filename) for file name sanitizing
