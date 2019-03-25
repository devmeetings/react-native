const path = require('path');
const fs = require('fs');

const pug = require('pug');
const { pipe, map, filter, chain } = require('ramda');

const getTemplates = base => pipe(
    dir => fs.readdirSync(dir),
    map(name => ({ name, base, path: path.join(base, name) })),
    chain(file => {
        const stat = fs.statSync(file.path);

        if (stat.isFile() && file.name.endsWith('.pug')) {
            return [file.path];
        } else if (stat.isDirectory()) {
            return getTemplates(file.path)
        } else {
            return [];
        }
    }))(base)

const getSlides = dir => pipe(
    dir => fs.readdirSync(dir),
    map(name => path.join(dir, name)),
    filter(path => fs.statSync(path).isDirectory()),
    map(dirPath => ({dir: dirPath, templates: getTemplates(dirPath).map(templatePath => path.parse(templatePath).name).sort()})),
)(dir)

const renderIndex = (dir, slides) => {
    const html = pug.compileFile(path.join(__dirname, '..', 'base-templates', 'slides-index.pug'), { pretty: true })({slides})

    fs.writeFileSync(path.join(dir, 'index.html'), html)
}

function renderTemplate(path) {
    const html = pug.compileFile(path, { pretty: true })()

    fs.writeFileSync(path.replace('.pug', '.html'), html)
}

const parseTemplate = base => {
    if(base.indexOf('.pug') !== -1) {
        renderTemplate(base)
    } else {
        getTemplates(base).forEach(renderTemplate)
    }
}

(() => {
    const cwd = process.cwd()
    const paths = ['slides', 'tasks', 'index.pug'];
    const slides = paths.map(base => path.join(cwd, base))
    
    slides.forEach(parseTemplate)

    // Slides index.html
    getSlides(slides[0]).forEach(({dir, templates}) => renderIndex(dir, templates))

    console.log(`Success! HTML for slides in project are built`)
})()
